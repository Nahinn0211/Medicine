<script setup>
    import { ref, computed, onMounted, watch } from 'vue';
    import { useToast } from 'primevue/usetoast';
    import FormDialog from '@admin/components/FormDialog.vue';
    import InputText from 'primevue/inputtext';
    import Textarea from 'primevue/textarea';
    import Dropdown from 'primevue/dropdown';
    import Button from 'primevue/button';
    import MultiSelect from 'primevue/multiselect';
    import InputNumber from 'primevue/inputnumber';
    import Calendar from 'primevue/calendar';
    import { Attributes } from '@admin/stores/admin/AttributeService';

    // Services
    import { Medicines } from '@admin/stores/admin/Medicines';
    import { Brands } from '@admin/stores/admin/Brands';
    import { Categories } from '@admin/stores/admin/Categories';
    
    const props = defineProps({
        modelValue: Boolean,
        data: {
            type: Object,
            default: () => ({
                id: 0,
                code: '',
                name: '',
                description: '',
                brandId: 0,
                origin: '',
                categoryIds: [],
                // Thêm các trường mới nếu có
                dosageInstruction: '',
                usageInstruction: '',
                isPrescriptionRequired: false
            })
        }
    });
    
    const emit = defineEmits(['update:modelValue', 'refreshList']);
    
    // State
    const formVisible = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value)
    });
    const isSubmitting = ref(false);
    const toast = useToast();
    const brands = ref([]);
    const categories = ref([]);
    const uploadedFiles = ref([]);
    const uploadedFilePaths = ref([]);
    const mainImageIndex = ref(0);
    const fileUploadInput = ref(null);
    const isEditMode = computed(() => props.data && props.data.id > 0);
    const submitted = ref(false);
    
    // Thuộc tính của thuốc
    const attributes = ref([]);
    const newAttribute = ref(createEmptyAttribute());
    
    function createEmptyAttribute() {
        // Ngày hết hạn mặc định là 6 tháng kể từ hôm nay
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6);
        
        return {
            name: '',
            priceIn: 0,
            priceOut: 0,
            stock: 0,
            expiryDate: futureDate.toISOString().split('T')[0]
        };
    }
    
    // Load dropdowns khi component được tạo
    onMounted(async () => {
        try {
            const [brandResponse, categoryResponse] = await Promise.all([
                Brands.getBrands(), 
                Categories.getCategories()
            ]);
    
            brands.value = brandResponse.data.map(brand => ({
                label: brand.name,
                value: brand.id
            }));
    
            categories.value = categoryResponse.data.map(category => ({
                label: category.name,
                value: category.id
            }));
        } catch (error) {
            showErrorToast('Không thể tải dữ liệu danh mục');
        }
    });
    
    // Theo dõi khi form được mở
    watch(formVisible, async (newValue) => {
        if (newValue) {
            if (isEditMode.value) {
                resetForm();
                await loadMedicineDetails();
            } else {
                // Reset form khi mở để thêm mới
                resetForm();
            }
        }
    });
    
    // Xử lý các thuộc tính
    const addAttribute = () => {
        if (!newAttribute.value.name) {
            showWarningToast('Vui lòng nhập tên thuộc tính');
            return;
        }
    
        attributes.value.push({...newAttribute.value});
        newAttribute.value = createEmptyAttribute();
    };
    
 const removeAttribute = async (index) => {
    try {
        const attributeToRemove = attributes.value[index];
        
         if (attributeToRemove.id) {
            await Attributes.deleteMultipleAttributes([attributeToRemove.id]);
        }
        
         attributes.value.splice(index, 1);
        
        showSuccessToast('Đã xóa thuộc tính');
    } catch (error) {
        showErrorToast('Không thể xóa thuộc tính', error);
    }
};
    
    // Helpers
    const resetForm = () => {
        if (!isEditMode.value) {
             props.data.code = '';
            props.data.name = '';
            props.data.description = '';
            props.data.brandId = 0;
            props.data.origin = '';
            props.data.categoryIds = [];
            props.data.dosageInstruction = '';
            props.data.usageInstruction = '';
            props.data.isPrescriptionRequired = false;
        }
        
        resetImageState();
        attributes.value = [];
        newAttribute.value = createEmptyAttribute();
        submitted.value = false;
    };
    
    const resetImageState = () => {
        uploadedFiles.value = [];
        uploadedFilePaths.value = [];
        mainImageIndex.value = 0;
    };
    
    const showSuccessToast = (message) => {
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: message,
            life: 3000
        });
    };
    
    const showErrorToast = (message, error) => {
        if (error) console.error(error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: message,
            life: 3000
        });
    };
    
    const showWarningToast = (message) => {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: message,
            life: 3000
        });
    };
    
    // Load chi tiết thuốc khi chỉnh sửa
    const loadMedicineDetails = async () => {
        try {
            const medicineResponse = await Medicines.getMedicineById(props.data.id);
    
            if (medicineResponse.data) {
                // Cập nhật thông tin thuốc
                Object.assign(props.data, {
                    code: medicineResponse.data.code,
                    name: medicineResponse.data.name,
                    description: medicineResponse.data.description || '',
                    brandId: medicineResponse.data.brand ? medicineResponse.data.brand.id : null,
                    origin: medicineResponse.data.origin || '',
                    categoryIds: medicineResponse.data.categories ? medicineResponse.data.categories.map(cat => cat.id) : [],
                    dosageInstruction: medicineResponse.data.dosageInstruction || '',
                    usageInstruction: medicineResponse.data.usageInstruction || '',
                    isPrescriptionRequired: medicineResponse.data.isPrescriptionRequired || false
                });
    
                // Cập nhật danh sách thuộc tính
                if (medicineResponse.data.attributes && medicineResponse.data.attributes.length > 0) {
                    attributes.value = medicineResponse.data.attributes.map(attr => ({
                        id: attr.id,
                        name: attr.name,
                        priceIn: attr.priceIn,
                        priceOut: attr.priceOut,
                        stock: attr.stock,
                        expiryDate: attr.expiryDate
                    }));
                }
    
                // Cập nhật hình ảnh
                if (medicineResponse.data.medias && medicineResponse.data.medias.length > 0) {
                    medicineResponse.data.medias.forEach((media, index) => {
                        uploadedFilePaths.value.push(media.mediaUrl);
                        if (media.mainImage) {
                            mainImageIndex.value = index;
                        }
                    });
                }
            }
        } catch (error) {
            showErrorToast('Không thể tải chi tiết thuốc', error);
        }
    };
    
    // Xử lý upload hình ảnh
    const triggerFileUpload = () => {
        fileUploadInput.value?.click();
    };
    
    const onFileSelect = (event) => {
        const files = event.target.files;
        Array.from(files).forEach(file => {
            uploadedFiles.value.push(file);
            uploadedFilePaths.value.push(URL.createObjectURL(file));
        });
    };
    
    const removeImage = (index) => {
        uploadedFiles.value.splice(index, 1);
        uploadedFilePaths.value.splice(index, 1);
    
        // Điều chỉnh chỉ số ảnh chính nếu cần
        if (mainImageIndex.value >= uploadedFilePaths.value.length) {
            mainImageIndex.value = uploadedFilePaths.value.length > 0 ? 0 : -1;
        }
    };
    
    const setMainImage = (index) => {
        mainImageIndex.value = index;
    };
    
    // Xử lý lưu dữ liệu
    const saveAll = async () => {
        submitted.value = true;
    
        try {
            // Validate thuốc
            if (!props.data.code || !props.data.name || !props.data.brandId) {
                showWarningToast('Vui lòng nhập đầy đủ thông tin thuốc');
                return;
            }
    
           
    
            isSubmitting.value = true;
    
            // Chuẩn bị dữ liệu để gửi
            const medicineData = {
                id: props.data.id || null,
                code: props.data.code,
                name: props.data.name,
                description: props.data.description || '',
                brandId: props.data.brandId,
                origin: props.data.origin || '',
                dosageInstruction: props.data.dosageInstruction || '',
                usageInstruction: props.data.usageInstruction || '',
                isPrescriptionRequired: props.data.isPrescriptionRequired || false,
                attributes: attributes.value
            };
    
            // Lọc để chỉ lấy các file mới (không phải URL)
            const newFiles = uploadedFiles.value.filter(file => file instanceof File);
    
            // Gọi API lưu tất cả trong 1 lần
            const response = await Medicines.save(
                medicineData,
                newFiles,
                props.data.categoryIds,
                mainImageIndex.value
            );
    
            showSuccessToast('Đã lưu thông tin thuốc đầy đủ');
            emit('refreshList');
            closeForm();
        } catch (error) {
            showErrorToast(`Không thể lưu thông tin thuốc: ${error.response?.data || error.message}`, error);
        } finally {
            isSubmitting.value = false;
        }
    };
    
    const closeForm = () => {
        formVisible.value = false;
        resetForm();
    };
    </script>
    
    <template>
        <FormDialog 
            :visible="formVisible" 
            :title="isEditMode ? 'Cập nhật thuốc' : 'Thêm thuốc mới'" 
            :loading="isSubmitting" 
            @save="saveAll" 
            @cancel="closeForm" 
            @hide="closeForm"
            :style="{ width: '80vw', maxWidth: '1000px' }"
        >
            <div class="grid">
                <!-- Thông tin cơ bản của thuốc -->
                <div class="col-12">
                    <div class="text-xl font-bold mb-3">Thông tin thuốc</div>
                </div>
    
                <div class="col-6">
                    <div class="field">
                        <label for="code" class="font-semibold">Mã thuốc:<span class="text-red-500">*</span></label>
                        <InputText id="code" v-model="props.data.code" placeholder="Nhập mã thuốc" class="w-full" :class="{'p-invalid': submitted && !props.data.code}" />
                        <small v-if="submitted && !props.data.code" class="p-error">Vui lòng nhập mã thuốc</small>
                    </div>
                </div>
    
                <div class="col-6">
                    <div class="field">
                        <label for="name" class="font-semibold">Tên thuốc:<span class="text-red-500">*</span></label>
                        <InputText id="name" v-model="props.data.name" placeholder="Nhập tên thuốc" class="w-full" :class="{'p-invalid': submitted && !props.data.name}" />
                        <small v-if="submitted && !props.data.name" class="p-error">Vui lòng nhập tên thuốc</small>
                    </div>
                </div>
    
                <div class="col-12">
                    <div class="field">
                        <label for="description" class="font-semibold">Mô tả:</label>
                        <Textarea id="description" v-model="props.data.description" placeholder="Nhập mô tả thuốc" class="w-full" rows="3" autoResize />
                    </div>
                </div>
    
                <div class="col-6">
                    <div class="field">
                        <label for="usageInstruction" class="font-semibold">Hướng dẫn sử dụng:</label>
                        <Textarea id="usageInstruction" v-model="props.data.usageInstruction" placeholder="Nhập hướng dẫn sử dụng" class="w-full" rows="2" autoResize />
                    </div>
                </div>
    
                <div class="col-6">
                    <div class="field">
                        <label for="dosageInstruction" class="font-semibold">Hướng dẫn liều dùng:</label>
                        <Textarea id="dosageInstruction" v-model="props.data.dosageInstruction" placeholder="Nhập hướng dẫn liều dùng" class="w-full" rows="2" autoResize />
                    </div>
                </div>
    
                <div class="col-6">
                    <div class="field">
                        <label for="brandId" class="font-semibold">Thương hiệu:<span class="text-red-500">*</span></label>
                        <Dropdown id="brandId" v-model="props.data.brandId" :options="brands" optionLabel="label" optionValue="value" placeholder="Chọn thương hiệu" class="w-full" :class="{'p-invalid': submitted && !props.data.brandId}" />
                        <small v-if="submitted && !props.data.brandId" class="p-error">Vui lòng chọn thương hiệu</small>
                    </div>
                </div>
    
                <div class="col-6">
                    <div class="field">
                        <label for="origin" class="font-semibold">Xuất xứ:</label>
                        <InputText id="origin" v-model="props.data.origin" placeholder="Nhập xuất xứ" class="w-full" />
                    </div>
                </div>
    
                <div class="col-6">
                    <div class="field flex align-items-center">
                        <div class="p-checkbox p-component mr-2">
                            <input type="checkbox" v-model="props.data.isPrescriptionRequired" id="isPrescriptionRequired" class="p-checkbox-input" />
                        </div>
                        <label for="isPrescriptionRequired" class="font-semibold cursor-pointer">Yêu cầu đơn thuốc?</label>
                    </div>
                </div>
    
                <!-- Hình ảnh thuốc -->
                <div class="col-12 mt-4">
                    <div class="text-xl font-bold mb-3">Hình ảnh thuốc</div>
                </div>
    
                <div class="col-12">
                    <div class="field">
                        <label class="font-semibold">Tải ảnh:</label>
                        <div class="flex items-center gap-2">
                            <Button icon="pi pi-images" label="Chọn ảnh" @click="triggerFileUpload" class="p-button-outlined" />
                            <input type="file" ref="fileUploadInput" multiple accept="image/*" class="hidden" @change="onFileSelect" />
                            <small class="text-gray-500"> {{ uploadedFilePaths.length }} ảnh đã chọn </small>
                        </div>
    
                        <div v-if="uploadedFilePaths.length > 0" class="mt-4 grid grid-cols-4 gap-4">
                            <div v-for="(path, index) in uploadedFilePaths" :key="index" class="relative">
                                <img :src="path" alt="Ảnh thuốc" class="w-full h-32 object-cover rounded" @error="$event.target.src = 'https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'" />
                                <div class="absolute top-2 right-2 flex gap-2">
                                    <Button icon="pi pi-star" :severity="index === mainImageIndex ? 'success' : 'secondary'" class="p-button-rounded p-button-sm" @click="setMainImage(index)" tooltip="Đặt làm ảnh chính" />
                                    <Button icon="pi pi-trash" severity="danger" class="p-button-rounded p-button-sm" @click="removeImage(index)" tooltip="Xóa ảnh" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    
                <!-- Danh mục thuốc -->
                <div class="col-12 mt-4">
                    <div class="text-xl font-bold mb-3">Danh mục thuốc</div>
                </div>
    
                <div class="col-12">
                    <div class="field">
                        <label for="categoryId" class="font-semibold">Danh mục:</label>
                        <MultiSelect id="categories" v-model="props.data.categoryIds" :options="categories" optionLabel="label" optionValue="value" placeholder="Chọn danh mục" class="w-full" />
                    </div>
                </div>
    
                <!-- Thuộc tính của thuốc -->
                <div class="col-12 mt-4">
                    <div class="text-xl font-bold mb-3">Thuộc tính thuốc</div>
                </div>
    
                <!-- Danh sách thuộc tính đã thêm -->
                <div class="col-12">
                    <div v-if="attributes.length > 0" class="mb-4">
                        <h3 class="text-lg font-semibold mb-2">Danh sách thuộc tính:</h3>
                        <div class="p-datatable p-component">
                            <div class="p-datatable-wrapper">
                                <table class="p-datatable-table">
                                    <thead class="p-datatable-thead">
                                        <tr>
                                            <th class="text-left p-2">Tên thuộc tính</th>
                                            <th class="text-right p-2">Giá nhập</th>
                                            <th class="text-right p-2">Giá bán</th>
                                            <th class="text-right p-2">Tồn kho</th>
                                            <th class="text-center p-2">Ngày hết hạn</th>
                                            <th class="text-center p-2">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody class="p-datatable-tbody">
                                        <tr v-for="(attr, index) in attributes" :key="index" class="p-datatable-row">
                                            <td class="text-left p-2">{{ attr.name }}</td>
                                            <td class="text-right p-2">{{ Number(attr.priceIn).toLocaleString('vi-VN') }}</td>
                                            <td class="text-right p-2">{{ Number(attr.priceOut).toLocaleString('vi-VN') }}</td>
                                            <td class="text-right p-2">{{ attr.stock }}</td>
                                            <td class="text-center p-2">{{ new Date(attr.expiryDate).toLocaleDateString('vi-VN') }}</td>
                                            <td class="text-center p-2">
                                                <Button icon="pi pi-trash" severity="danger" class="p-button-rounded p-button-sm" @click="removeAttribute(index)" tooltip="Xóa thuộc tính" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                 </div>
    
                <!-- Form thêm thuộc tính mới -->
                <div class="col-12 mt-4">
                    <div class="p-card p-4">
                        <h3 class="text-lg font-semibold mb-4">Thêm thuộc tính mới:</h3>
                        <div class="grid">
                            <div class="col-12 md:col-12">
                                <div class="field">
                                    <label for="attrName" class="font-semibold">Tên thuộc tính<span class="text-red-500">*</span></label>
                                    <InputText id="attrName" v-model="newAttribute.name" placeholder="Nhập tên thuộc tính" class="w-full" />
                                </div>
                            </div>
                            
                            <div class="col-12 md:col-6">
                                <div class="field">
                                    <label for="attrPriceIn" class="font-semibold">Giá nhập<span class="text-red-500">*</span></label>
                                    <InputNumber id="attrPriceIn" v-model="newAttribute.priceIn" placeholder="Nhập giá nhập" :min="0" class="w-full" />
                                </div>
                            </div>
                            
                            <div class="col-12 md:col-6">
                                <div class="field">
                                    <label for="attrPriceOut" class="font-semibold">Giá bán<span class="text-red-500">*</span></label>
                                    <InputNumber id="attrPriceOut" v-model="newAttribute.priceOut" placeholder="Nhập giá bán" :min="0" class="w-full" />
                                </div>
                            </div>
                            
                            <div class="col-12 md:col-6">
                                <div class="field">
                                    <label for="attrStock" class="font-semibold">Tồn kho<span class="text-red-500">*</span></label>
                                    <InputNumber id="attrStock" v-model="newAttribute.stock" placeholder="Nhập số lượng tồn kho" :min="0" class="w-full" />
                                </div>
                            </div>
                            
                            <div class="col-12 md:col-6">
                                <div class="field">
                                    <label for="attrExpiryDate" class="font-semibold">Ngày hết hạn<span class="text-red-500">*</span></label>
                                    <Calendar id="attrExpiryDate" v-model="newAttribute.expiryDate" dateFormat="dd/mm/yy" placeholder="Chọn ngày hết hạn" showIcon class="w-full" />
                                </div>
                            </div>
                            
                            <div class="col-12 text-right">
                                <Button label="Thêm thuộc tính" icon="pi pi-plus" @click="addAttribute" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormDialog>
    </template>
    
    <style scoped>
    .field {
        margin-bottom: 1rem;
    }
    .p-error {
        color: #f44336;
        font-size: 0.75rem;
        margin-top: 0.25rem;
    }
    </style>