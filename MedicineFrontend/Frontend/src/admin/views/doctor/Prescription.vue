<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { authService } from '@user/services/AuthService';
import { useAuthStore } from '@user/stores/auth/useAuthStore';
import { PrescriptionService, formatCurrency } from "@admin/stores/admin/Prescriptions";

// Các hook và state
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const authStore = useAuthStore();

const consultationCode = route.params.consultationCode;
const medicines = ref([]);
const filteredMedicines = ref([]);
// Bỏ biến không sử dụng: const selectedMedicines = ref([]);
const isLoading = ref(false);
const consultationData = ref(null);
const appointmentData = ref(null);
const prescription = ref({
    consultationId: null,
    appointmentId: null,
    patientId: null,
    doctorId: null,
    prescriptionItems: [],
    diagnosis: "",
    notes: "",
    status: "DRAFT"
});

// Filters
const filters = ref({
    name: '',
    category: '',
    manufacturer: ''
});

// Danh sách tất cả các nhà sản xuất và danh mục từ dữ liệu thuốc
const categories = computed(() => {
    const uniqueCategories = new Set();
    medicines.value.forEach(med => {
        if (med.category) uniqueCategories.add(med.category);
    });
    return Array.from(uniqueCategories);
});

const manufacturers = computed(() => {
    const uniqueManufacturers = new Set();
    medicines.value.forEach(med => {
        if (med.manufacturer) uniqueManufacturers.add(med.manufacturer);
    });
    return Array.from(uniqueManufacturers);
});

// Danh sách thuốc đã thêm vào đơn
const prescriptionItems = ref([]);

// Đếm số lượng thuốc trong đơn
const medicineCount = computed(() => prescriptionItems.value.length);

// Tính tổng tiền của đơn thuốc
const totalAmount = computed(() => {
    return prescriptionItems.value.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
});

// Lọc thuốc theo các tiêu chí
const applyFilters = () => {
    filteredMedicines.value = medicines.value.filter(med => {
        // Lọc theo tên
        if (filters.value.name && !med.name.toLowerCase().includes(filters.value.name.toLowerCase())) {
            return false;
        }

        // Lọc theo danh mục
        if (filters.value.category && med.category !== filters.value.category) {
            return false;
        }

        // Lọc theo nhà sản xuất
        if (filters.value.manufacturer && med.manufacturer !== filters.value.manufacturer) {
            return false;
        }

        return true;
    });
};

// Reset filters
const resetFilters = () => {
    filters.value = {
        name: '',
        category: '',
        manufacturer: ''
    };
    filteredMedicines.value = [...medicines.value];
};

// Watch để lọc thuốc khi filters thay đổi
watch(filters, () => {
    applyFilters();
}, { deep: true });

// Thêm thuốc vào đơn
const addMedicineToList = (medicine) => {
    // Kiểm tra xem thuốc đã tồn tại trong đơn chưa
    const existingItem = prescriptionItems.value.find(item => item.medicineId === medicine.id);

    if (existingItem) {
        // Nếu đã tồn tại, tăng số lượng
        existingItem.quantity += 1;
        toast.add({
            severity: "info",
            summary: "Đã cập nhật",
            detail: `Tăng số lượng ${medicine.name}`,
            life: 3000,
        });
    } else {
        // Nếu chưa tồn tại, thêm mới
        prescriptionItems.value.push({
            medicineId: medicine.id,
            name: medicine.name,
            dosageForm: medicine.dosageForm,
            strength: medicine.strength,
            price: medicine.price,
            unit: medicine.unit,
            quantity: 1,
            frequency: "Ngày 2 lần",
            duration: "5 ngày",
            instructions: "Uống sau khi ăn",
            notes: ""
        });

        toast.add({
            severity: "success",
            summary: "Thêm thành công",
            detail: `Đã thêm ${medicine.name} vào đơn thuốc`,
            life: 3000,
        });
    }
};

// Xóa thuốc khỏi đơn
const removeMedicineFromList = (index) => {
    confirm.require({
        message: "Bạn có chắc chắn muốn xóa thuốc này khỏi đơn không?",
        header: "Xác nhận",
        icon: "pi pi-info-circle",
        accept: () => {
            const removedItem = prescriptionItems.value.splice(index, 1)[0];

            toast.add({
                severity: "success",
                summary: "Đã xóa",
                detail: `Đã xóa ${removedItem.name} khỏi đơn thuốc`,
                life: 3000,
            });
        }
    });
};

// Cập nhật thông tin thuốc trong đơn
const updatePrescriptionItem = (index, field, value) => {
    if (prescriptionItems.value[index]) {
        prescriptionItems.value[index][field] = value;
    }
};

// Tăng số lượng thuốc
const increaseQuantity = (index) => {
    if (prescriptionItems.value[index]) {
        prescriptionItems.value[index].quantity += 1;
    }
};

// Giảm số lượng thuốc
const decreaseQuantity = (index) => {
    if (prescriptionItems.value[index] && prescriptionItems.value[index].quantity > 1) {
        prescriptionItems.value[index].quantity -= 1;
    }
};

// Lưu đơn thuốc
const savePrescription = async () => {
    if (prescriptionItems.value.length === 0) {
        toast.add({
            severity: "warn",
            summary: "Cảnh báo",
            detail: "Vui lòng thêm ít nhất một thuốc vào đơn",
            life: 3000,
        });
        return;
    }

    try {
        isLoading.value = true;

        // Kiểm tra và lấy dữ liệu cần thiết
        if (!consultationData.value) {
            throw new Error("Không có dữ liệu cuộc tư vấn");
        }

        // Dữ liệu DTO backend phải có cấu trúc SavePrescriptionDTO
        // Backend yêu cầu lưu riêng từng thuốc trong đơn
        const promises = prescriptionItems.value.map(item => {
            // Tạo đúng cấu trúc dữ liệu cho mỗi thuốc theo cấu trúc SavePrescriptionDTO
            const prescriptionItemData = {
                doctorId: consultationData.value.doctorId,
                patientId: consultationData.value.patientId,
                appointmentId: consultationData.value.appointmentId,
                medicineId: item.medicineId,
                dosage: `${item.frequency}, ${item.duration}, ${item.instructions}`,
                notes: item.notes ? `${prescription.value.notes} - ${item.notes}` : prescription.value.notes,
                status: "ACTIVE"
            };
            
            // Gọi API để lưu từng thuốc
            return PrescriptionService.savePrescription(prescriptionItemData);
        });

        // Chờ tất cả các lệnh lưu hoàn thành
        const results = await Promise.all(promises);
        
        console.log("Prescriptions saved successfully:", results);

        toast.add({
            severity: "success",
            summary: "Thành công",
            detail: "Đã lưu đơn thuốc thành công",
            life: 3000,
        });

        // Chuyển hướng về trang danh sách lịch hẹn
        setTimeout(() => {
            router.push('/admin');
        }, 1500);

    } catch (error) {
        console.error("Lỗi khi lưu đơn thuốc:", error);
        toast.add({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể lưu đơn thuốc: " + (error.message || "Lỗi không xác định"),
            life: 3000,
        });
    } finally {
        isLoading.value = false;
    }
};

// Quay lại trang trước đó
const goBack = () => {
    if (prescriptionItems.value.length > 0) {
        confirm.require({
            message: "Đơn thuốc chưa được lưu. Bạn có chắc chắn muốn thoát không?",
            header: "Xác nhận",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                router.push('/admin');
            }
        });
    } else {
        router.push('/admin');
    }
};

// Fetch consultation data
const fetchConsultationData = async () => {
    if (!consultationCode) {
        toast.add({
            severity: "error",
            summary: "Lỗi",
            detail: "Không tìm thấy mã buổi tư vấn",
            life: 3000,
        });
        router.push('/admin');
        return;
    }

    try {
        isLoading.value = true;
        console.log(`Fetching consultation data for code: ${consultationCode}`);

        // Lấy thông tin cuộc tư vấn
        const consultation = await PrescriptionService.getConsultationByCode(consultationCode);
        consultationData.value = consultation.data; // Sửa: Thêm .data để truy cập đúng dữ liệu

        console.log("Consultation data loaded:", consultation);
        // Lấy thông tin cuộc hẹn liên quan
        if (consultationData.value && consultationData.value.appointmentId) {
            console.log(`Fetching appointment with ID: ${consultationData.value.appointmentId}`);
            const appointmentResponse = await PrescriptionService.getAppointmentById(consultationData.value.appointmentId);
            appointmentData.value = appointmentResponse;
            
            // Cập nhật thông tin prescription
            prescription.value.consultationId = consultationData.value.id;
            prescription.value.appointmentId = consultationData.value.appointmentId;
            prescription.value.patientId = consultationData.value.patientId;
            prescription.value.doctorId = consultationData.value.doctorId;
            console.log("Appointment data loaded:", appointmentResponse); // Sửa: Sử dụng appointmentResponse thay vì appointment
        } else {
            console.warn("No appointment ID found in consultation data");
        }

    } catch (error) {
        console.error("Error fetching consultation data:", error);
        toast.add({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể tải thông tin buổi tư vấn: " + (error.message || "Lỗi không xác định"),
            life: 3000,
        });
        router.push('/admin');
    } finally {
        isLoading.value = false;
    }
};

// Fetch medicines
const fetchMedicines = async () => {
    try {
        isLoading.value = true;
        console.log("Fetching medicines list");
        const response = await PrescriptionService.getMedicines();
        medicines.value = response.data;
        filteredMedicines.value = [...medicines.value];
        console.log("Medicines loaded:", medicines.value.length);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách thuốc:", error);
        toast.add({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể tải danh sách thuốc: " + (error.message || "Lỗi không xác định"),
            life: 3000,
        });
    } finally {
        isLoading.value = false;
    }
};

// Gọi API khi component được tạo
onMounted(async () => {
    console.log("Prescription component mounted with consultationCode:", consultationCode);
    await fetchConsultationData();
    await fetchMedicines();
});
</script>

<template>
    <div class="prescription-container">
        <ConfirmDialog />
        <Toast />

        <div class="card">
            <!-- Header -->
            <div class="header">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2">
                        <Button icon="pi pi-arrow-left" outlined @click="goBack" />
                        <h2 class="text-xl font-semibold">Kê đơn thuốc</h2>
                    </div>
                    <div class="flex gap-2">
                        <Button label="Lưu đơn thuốc" icon="pi pi-check" @click="savePrescription"
                            :loading="isLoading" />
                    </div>
                </div>

                <!-- Thông tin bệnh nhân và bác sĩ -->
                <div v-if="consultationData && appointmentData"
                    class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Thông tin bệnh nhân</h3>
                        <div class="flex flex-col gap-1">
                            <div><span class="font-medium">Họ tên:</span> {{ 
                                appointmentData.data?.patient?.user?.fullName || "Không có thông tin" }}</div>
                            <div><span class="font-medium">Email:</span> {{ appointmentData.data?.patient?.user?.email ||
                                "Không có thông tin" }}</div>
                            <div><span class="font-medium">Số điện thoại:</span> {{
                                appointmentData.data?.patient?.user?.phone || "Không có thông tin" }}</div>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Thông tin bác sĩ</h3>
                        <div class="flex flex-col gap-1">
                            <div><span class="font-medium">Họ tên:</span> {{ appointmentData.data?.doctor?.user?.fullName
                                || "Không có thông tin" }}</div>
                            <div><span class="font-medium">Chuyên khoa:</span> {{
                                appointmentData.data?.doctor?.specialization || "Không có thông tin" }}</div>
                            <div><span class="font-medium">Ngày kê đơn:</span> {{ new Date().toLocaleDateString('vi-VN')
                                }}</div>
                        </div>
                    </div>
                </div>

                <!-- Hiển thị thông báo nếu không có dữ liệu -->
                <div v-else-if="isLoading" class="p-4 bg-gray-50 rounded-lg mb-4 text-center">
                    <i class="pi pi-spin pi-spinner text-primary text-3xl mb-3"></i>
                    <p>Đang tải thông tin bệnh nhân và bác sĩ...</p>
                </div>

                <div v-else class="p-4 bg-gray-50 rounded-lg mb-4 text-center">
                    <i class="pi pi-exclamation-triangle text-yellow-500 text-3xl mb-3"></i>
                    <p>Không thể tải thông tin bệnh nhân và bác sĩ</p>
                </div>

                <!-- Chuẩn đoán và ghi chú -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="field">
                        <label for="diagnosis" class="font-medium">Chẩn đoán</label>
                        <Textarea id="diagnosis" v-model="prescription.diagnosis" rows="3" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="notes" class="font-medium">Ghi chú</label>
                        <Textarea id="notes" v-model="prescription.notes" rows="3" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Danh sách thuốc và filter -->
            <div class="grid grid-cols-12 gap-4">
                <!-- Danh sách thuốc -->
                <div class="col-span-7">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-semibold mb-3">Danh sách thuốc</h3>

                            <!-- Bộ lọc -->
                            <div class="filter-section p-3 bg-gray-50 rounded-lg mb-3">
                                <div class="grid grid-cols-4 gap-2">
                                    <div class="field">
                                        <label for="nameFilter" class="text-sm">Tên thuốc</label>
                                        <InputText id="nameFilter" v-model="filters.name" class="w-full"
                                            placeholder="Nhập tên thuốc..." />
                                    </div>
                                    <div class="field">
                                        <label for="categoryFilter" class="text-sm">Danh mục</label>
                                        <Dropdown id="categoryFilter" v-model="filters.category" :options="categories"
                                            class="w-full" placeholder="Chọn danh mục" />
                                    </div>
                                    <div class="field">
                                        <label for="manufacturerFilter" class="text-sm">Nhà sản xuất</label>
                                        <Dropdown id="manufacturerFilter" v-model="filters.manufacturer"
                                            :options="manufacturers" class="w-full" placeholder="Chọn nhà sản xuất" />
                                    </div>
                                    <div class="field flex items-end">
                                        <Button label="Đặt lại" icon="pi pi-refresh" outlined @click="resetFilters"
                                            class="w-full" />
                                    </div>
                                </div>
                            </div>

                            <!-- Bảng danh sách thuốc -->
                            <DataTable :value="filteredMedicines" paginator :rows="5" :loading="isLoading"
                                dataKey="id"
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                responsiveLayout="scroll">

                                <Column field="name" header="Tên thuốc" sortable>
                                    <template #body="{ data }">
                                        <div>
                                            <span class="font-semibold">{{ data.name }}</span>
                                            <div class="text-xs text-gray-600">{{ data.dosageForm }} {{ data.strength }}
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="category" header="Danh mục" sortable></Column>

                                <Column field="manufacturer" header="Nhà sản xuất" sortable></Column>

                                <Column field="price" header="Đơn giá" sortable>
                                    <template #body="{ data }">
                                        {{ formatCurrency(data.price) }}/{{ data.unit }}
                                    </template>
                                </Column>

                                <Column headerStyle="width: 6rem">
                                    <template #body="{ data }">
                                        <Button icon="pi pi-plus" rounded size="small" @click="addMedicineToList(data)"
                                            tooltip="Thêm vào đơn" tooltipOptions="{ position: 'top' }" />
                                    </template>
                                </Column>

                                <!-- Template khi không có dữ liệu -->
                                <template #empty>
                                    <div class="text-center p-4">
                                        <i class="pi pi-search text-gray-400 text-5xl mb-3"></i>
                                        <p>Không tìm thấy thuốc nào</p>
                                    </div>
                                </template>

                                <!-- Template khi đang tải -->
                                <template #loading>
                                    <div class="text-center p-4">
                                        <i class="pi pi-spin pi-spinner text-primary text-5xl mb-3"></i>
                                        <p>Đang tải dữ liệu...</p>
                                    </div>
                                </template>
                            </DataTable>
                        </div>
                    </div>
                </div>

                <!-- Đơn thuốc -->
                <div class="col-span-5">
                    <div class="card">
                        <div class="card-header flex justify-between items-center mb-3">
                            <h3 class="text-lg font-semibold">Đơn thuốc ({{ medicineCount }} loại)</h3>
                            <div class="text-xl font-bold">{{ formatCurrency(totalAmount) }}</div>
                        </div>

                        <div v-if="prescriptionItems.length === 0" class="text-center p-5 bg-gray-50 rounded-lg">
                            <i class="pi pi-file-o text-gray-400 text-5xl mb-3"></i>
                            <p class="text-gray-500">Chưa có thuốc nào trong đơn. Vui lòng thêm thuốc từ danh sách bên
                                trái.</p>
                        </div>

                        <div v-else class="prescription-items">
                            <div v-for="(item, index) in prescriptionItems" :key="index"
                                class="prescription-item p-3 border-b">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="flex-1">
                                        <div class="font-semibold">{{ item.name }}</div>
                                        <div class="text-xs text-gray-600">{{ item.dosageForm }} {{ item.strength }}
                                        </div>
                                    </div>
                                    <Button icon="pi pi-trash" text severity="danger"
                                        @click="removeMedicineFromList(index)" />
                                </div>

                                <div class="grid grid-cols-3 gap-2 mb-2">
                                    <div class="field">
                                        <label class="text-xs block mb-1">Số lượng</label>
                                        <div class="flex items-center">
                                            <Button icon="pi pi-minus" text size="small"
                                                @click="decreaseQuantity(index)" :disabled="item.quantity <= 1" />
                                            <InputNumber v-model="item.quantity" showButtons buttonLayout="horizontal"
                                                :min="1" style="width: 80px" inputClass="text-center"
                                                @update:modelValue="(val) => updatePrescriptionItem(index, 'quantity', val)" />
                                            <Button icon="pi pi-plus" text size="small"
                                                @click="increaseQuantity(index)" />
                                        </div>
                                    </div>

                                    <div class="field">
                                        <label class="text-xs block mb-1">Tần suất</label>
                                        <Dropdown v-model="item.frequency"
                                            :options="['Ngày 1 lần', 'Ngày 2 lần', 'Ngày 3 lần', '8 giờ/lần']"
                                            @change="(e) => updatePrescriptionItem(index, 'frequency', e.value)"
                                            class="w-full" />
                                    </div>

                                    <div class="field">
                                        <label class="text-xs block mb-1">Thời gian dùng</label>
                                        <Dropdown v-model="item.duration"
                                            :options="['3 ngày', '5 ngày', '7 ngày', '10 ngày', '14 ngày']"
                                            @change="(e) => updatePrescriptionItem(index, 'duration', e.value)"
                                            class="w-full" />
                                    </div>
                                </div>

                                <div class="field mb-2">
                                    <label class="text-xs block mb-1">Hướng dẫn sử dụng</label>
                                    <Dropdown v-model="item.instructions" class="w-full"
                                        :options="['Uống trước khi ăn', 'Uống sau khi ăn', 'Uống trong khi ăn', 'Uống lúc đói']"
                                        @change="(e) => updatePrescriptionItem(index, 'instructions', e.value)" />
                                </div>

                                <div class="field">
                                    <label class="text-xs block mb-1">Ghi chú riêng</label>
                                    <InputText v-model="item.notes" class="w-full"
                                        placeholder="Ghi chú thêm về thuốc..."
                                        @input="(e) => updatePrescriptionItem(index, 'notes', e.target.value)" />
                                </div>

                                <div class="flex justify-between items-center mt-2 text-sm">
                                    <div>Đơn giá: {{ formatCurrency(item.price) }}/{{ item.unit }}</div>
                                    <div class="font-semibold">Thành tiền: {{ formatCurrency(item.price * item.quantity)
                                        }}</div>
                                </div>
                            </div>
                        </div>

                        <div v-if="prescriptionItems.length > 0" class="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <div class="font-medium">Tổng số lượng thuốc:</div>
                                <div>{{ medicineCount }} loại</div>
                            </div>
                            <div class="flex justify-between items-center text-lg">
                                <div class="font-medium">Tổng tiền:</div>
                                <div class="font-bold text-blue-700">{{ formatCurrency(totalAmount) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-4 flex justify-between">
                <Button label="Quay lại" icon="pi pi-arrow-left" outlined @click="goBack" />
                <Button label="Lưu đơn thuốc" icon="pi pi-check" @click="savePrescription" :loading="isLoading" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.prescription-container {
    padding: 1rem;
}

.card {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 1rem;
}

.prescription-item {
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    transition: box-shadow 0.3s;
}

.prescription-item:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.field label {
    color: #4b5563;
    margin-bottom: 0.5rem;
    display: block;
}

/* Responsive */
@media (max-width: 991px) {
    .grid-cols-12 {
        grid-template-columns: 1fr;
    }

    .col-span-7,
    .col-span-5 {
        grid-column: span 12;
    }
}
</style>