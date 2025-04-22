<script setup>
import { ref, watch, computed } from "vue";
import { useToast } from "primevue/usetoast";
import {
  AppointmentService,
  formatDate,
} from "@admin/stores/admin/Appointments";

// Props và Emits
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:visible", "refresh"]);

// Services và States
const toast = useToast();
const isLoading = ref(false);
const activeTab = ref(0); // Tab active: 0 - Thông tin, 1 - Lịch sử tư vấn, 2 - Đơn thuốc
const formData = ref({
  id: null,
  patientId: null,
  doctorId: null,
  patient: null,
  doctor: null,
  serviceBooking: null,
  appointmentDate: null,
  appointmentTime: null,
  appointmentDateTime: "",
  status: "SCHEDULED",
  notes: "",
  prescriptions: [],
  consultation: null,
});

// Tính toán tiêu đề form
const title = computed(() => "Cập nhật lịch hẹn");

// Tính toán thông tin bệnh nhân hiển thị
const patientInfo = computed(() => {
  if (!formData.value.patient) return null;

  const patient = formData.value.patient;
  const user = patient.user;

  return {
    id: patient.id,
    name: user?.fullName || `Bệnh nhân #${patient.id}`,
    email: user?.email || "Không có email",
    phone: user?.phone || "Không có số điện thoại",
    bloodType: patient.bloodType || "Không xác định",
    hasAllergies: patient.hasAllergies,
    allergies: patient.allergies || "Không có",
    hasMedicalHistory: patient.hasMedicalHistory,
    medicalHistory: patient.medicalHistory || "Không có",
    avatar: user?.avatar,
  };
});

// Tính toán thông tin bác sĩ hiển thị
const doctorInfo = computed(() => {
  if (!formData.value.doctor) return null;

  const doctor = formData.value.doctor;
  const user = doctor.user;

  return {
    id: doctor.id,
    name: user?.fullName || `Bác sĩ #${doctor.id}`,
    email: user?.email || "Không có email",
    phone: user?.phone || "Không có số điện thoại",
    specialization: doctor.specialization || "Không có chuyên môn",
    experience: doctor.experience || "Không có thông tin",
    workplace: doctor.workplace || "Không có thông tin",
    avatar: user?.avatar,
  };
});

const chatMessages = computed(() => {
  // Kiểm tra nếu consultation không tồn tại hoặc không có chatMessages
  if (
    !formData.value.consultation ||
    !formData.value.consultation.chatMessages
  ) {
    return [];
  }

  // Sắp xếp tin nhắn theo thời gian gửi (mới nhất xuống dưới)
  return [...formData.value.consultation.chatMessages].sort(
    (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
  );
});

// Đơn thuốc
const prescriptions = computed(() => {
  // Kiểm tra nếu không có prescriptions
  if (!formData.value.prescriptions) {
    return [];
  }

  // Trả về danh sách đơn thuốc
  return formData.value.prescriptions;
});
// Trạng thái lịch hẹn
const statusOptions = [
  {
    value: "PENDING",
    label: "PENDING",
    class: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "IN_PROGRESS",
    label: "IN_PROGRESS",
    class: "bg-blue-100 text-blue-800",
  },
  {
    value: "COMPLETED",
    label: "COMPLETED",
    class: "bg-green-100 text-green-800",
  },
  { value: "CANCELLED", label: "CANCELLED", class: "bg-red-100 text-red-800" },
];

// Lấy trạng thái hiện tại dạng chữ và class
const currentStatus = computed(() => {
  const status = statusOptions.find(
    (option) => option.value === formData.value.status
  );
  return (
    status || {
      value: formData.value.status,
      label: formData.value.status,
      class: "",
    }
  );
});

// Định dạng thời gian
const formatAppointmentTime = (time) => {
  if (!time) return "Chưa có dữ liệu";

  // Nếu là chuỗi thời gian
  if (typeof time === "string") {
    // Chuỗi định dạng "hh:mm:ss"
    if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(time)) {
      return time.substring(0, 5); // Trả về "hh:mm"
    }

    // Chuỗi ISO date
    try {
      const date = new Date(`2000-01-01T${time}`);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return time; // Nếu không parse được, trả về nguyên bản
    }
  }

  // Nếu là đối tượng có hour và minute
  if (time.hour !== undefined && time.minute !== undefined) {
    return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
  }

  return "Định dạng không hỗ trợ";
};

// Chuyển đổi từ appointmentDate và appointmentTime sang định dạng datetime-local
const formatDateTimeForInput = (date, time) => {
  if (!date) return "";

  try {
    // Xử lý date
    let dateObj;
    if (typeof date === "string") {
      // Đảm bảo định dạng đúng (YYYY-MM-DD)
      dateObj = new Date(date);
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date:", date);
      return "";
    }

    // Xử lý time
    let hours = 0;
    let minutes = 0;

    if (time) {
      if (typeof time === "string") {
        // Nếu time là chuỗi (ví dụ: "14:30:00")
        const timeParts = time.split(":");
        hours = parseInt(timeParts[0], 10) || 0;
        minutes = parseInt(timeParts[1], 10) || 0;
      } else if (time.hour !== undefined && time.minute !== undefined) {
        // Nếu time là object
        hours = time.hour;
        minutes = time.minute;
      }
    }

    // Đặt giờ và phút cho date object
    dateObj.setHours(hours);
    dateObj.setMinutes(minutes);

    // Format theo chuẩn datetime-local input (YYYY-MM-DDTHH:MM)
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");

    console.log(`Formatting datetime: ${yyyy}-${mm}-${dd}T${hh}:${min}`);
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch (error) {
    console.error("Error formatting date time:", error);
    return "";
  }
};

// Chuyển đổi từ datetime-local sang đối tượng date và time
const splitDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return { date: null, time: null };

  try {
    const dateObj = new Date(dateTimeStr);

    if (isNaN(dateObj.getTime())) {
      return { date: null, time: null };
    }

    // Format date as YYYY-MM-DD
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Format time as object
    const time = {
      hour: dateObj.getHours(),
      minute: dateObj.getMinutes(),
      second: 0,
      nano: 0,
    };

    return { date: formattedDate, time };
  } catch (error) {
    console.error("Error splitting datetime:", error);
    return { date: null, time: null };
  }
};

// Định dạng trạng thái người gửi tin nhắn
const formatSenderType = (type) => {
  switch (type) {
    case "DOCTOR":
      return "Bác sĩ";
    case "PATIENT":
      return "Bệnh nhân";
    case "SYSTEM":
      return "Hệ thống";
    default:
      return type;
  }
};
// Định dạng thời gian chi tiết
const formatDetailDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "";

  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;

    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateTimeStr;
  }
};

// Watch props.data để cập nhật formData
watch(
  () => props.data,
  (newVal) => {
    if (newVal) {
      console.log("Data received:", newVal);

      // Xác định patientId, doctorId, serviceBookingId
      const patientId = newVal.patientId || newVal.patient?.id || null;
      const doctorId = newVal.doctorId || newVal.doctor?.id || null;
      const serviceBookingId =
        newVal.serviceBookingId || newVal.serviceBooking?.id || null;

      // Sao chép dữ liệu
      formData.value = {
        ...newVal,
        patientId,
        doctorId,
        serviceBookingId,
      };

      // Thêm chuỗi datetime-local
      formData.value.appointmentDateTime = formatDateTimeForInput(
        formData.value.appointmentDate,
        formData.value.appointmentTime
      );

      console.log("Initialized formData:", {
        id: formData.value.id,
        patientId: formData.value.patientId,
        doctorId: formData.value.doctorId,
        serviceBookingId: formData.value.serviceBookingId,
        appointmentDate: formData.value.appointmentDate,
        appointmentTime: formData.value.appointmentTime,
        status: formData.value.status,
      });

      // Log thông tin về tin nhắn và đơn thuốc
      if (formData.value.consultation?.chatMessages) {
        console.log(
          `Loaded ${formData.value.consultation.chatMessages.length} chat messages`
        );
      }
      if (formData.value.prescriptions) {
        console.log(
          `Loaded ${formData.value.prescriptions.length} prescriptions`
        );
      }
    }
  },
  { deep: true, immediate: true }
);

// Hàm cập nhật lịch hẹn
async function updateAppointment() {
  try {
    isLoading.value = true;

    // Phân tách datetime thành date và time
    const { date, time } = splitDateTime(formData.value.appointmentDateTime);

    // Format time as a string (HH:MM:SS)
    let timeString = null;
    if (time) {
      const hour = String(time.hour).padStart(2, "0");
      const minute = String(time.minute).padStart(2, "0");
      timeString = `${hour}:${minute}:00`;
    }

    // Đảm bảo lấy đúng ID từ dữ liệu ban đầu (nếu có)
    const patientId =
      formData.value.patientId || formData.value.patient?.id || null;
    const doctorId =
      formData.value.doctorId || formData.value.doctor?.id || null;
    const serviceBookingId =
      formData.value.serviceBookingId ||
      formData.value.serviceBooking?.id ||
      null;

    // Tạo payload cho API với đúng định dạng yêu cầu
    const payload = {
      id: formData.value.id,
      patientId: patientId,
      doctorId: doctorId,
      serviceBookingId: serviceBookingId,
      appointmentDate: date, // Chuỗi định dạng YYYY-MM-DD
      appointmentTime: timeString, // Chuỗi định dạng HH:MM:SS
      status: formData.value.status,
      notes: formData.value.notes || "",
    };

    console.log("Sending data to API:", payload);

    // Gọi API để cập nhật lịch hẹn
    await AppointmentService.saveOrUpdateAppointment(payload);

    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Cập nhật lịch hẹn thành công",
      life: 3000,
    });

    // Đóng form và refresh dữ liệu
    closeDialog();
    emit("refresh");
  } catch (error) {
    console.error("Lỗi khi cập nhật lịch hẹn:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể cập nhật lịch hẹn. Vui lòng thử lại sau.",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}

// Hàm đóng dialog
function closeDialog() {
  emit("update:visible", false);
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :style="{ width: '800px' }"
    :header="title"
    :closeOnEscape="true"
    @update:visible="closeDialog"
  >
    <div class="p-fluid">
      <!-- Tabs -->
      <TabMenu
        :model="[
          { label: 'Thông tin lịch hẹn', icon: 'pi pi-calendar' },
          {
            label: 'Lịch sử tư vấn',
            icon: 'pi pi-comments',
            badge:
              chatMessages.length > 0
                ? chatMessages.length.toString()
                : undefined,
            disabled: !formData.consultation?.chatMessages?.length,
          },
          {
            label: 'Đơn thuốc',
            icon: 'pi pi-file-excel',
            badge:
              prescriptions.length > 0
                ? prescriptions.length.toString()
                : undefined,
            disabled: !formData.prescriptions?.length,
          },
        ]"
        v-model:activeIndex="activeTab"
        class="mb-4"
      />

      <!-- Tab Thông tin lịch hẹn -->
      <div v-if="activeTab === 0">
        <div class="grid grid-cols-1 gap-4">
          <!-- Thời gian hẹn -->
          <div class="field">
            <label class="font-semibold mb-2 block" for="appointmentDateTime"
              >Thời gian hẹn</label
            >
            <input
              id="appointmentDateTime"
              type="datetime-local"
              v-model="formData.appointmentDateTime"
              class="p-3 border rounded-md bg-gray-50 w-full"
              step="60"
            />
            <small class="text-gray-500 mt-1 block">
              Định dạng 24 giờ (00:00 - 23:59)
            </small>
          </div>
        </div>

        <!-- Thông tin bệnh nhân và bác sĩ -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
          <!-- Patient Information -->
          <div class="field">
            <label class="font-semibold mb-2 block">Bệnh nhân</label>
            <div v-if="patientInfo" class="p-3 border rounded-md bg-gray-50">
              <div class="flex gap-3 items-center mb-2">
                <Avatar
                  :image="patientInfo.avatar"
                  size="large"
                  shape="circle"
                />
                <div>
                  <div class="font-medium">{{ patientInfo.name }}</div>
                </div>
              </div>

              <div class="text-sm grid gap-1">
                <div>
                  <i class="pi pi-envelope mr-1 text-gray-500"></i>
                  {{ patientInfo.email }}
                </div>
                <div>
                  <i class="pi pi-phone mr-1 text-gray-500"></i>
                  {{ patientInfo.phone }}
                </div>
                <div>
                  <i class="pi pi-heart mr-1 text-gray-500"></i> Nhóm máu:
                  {{ patientInfo.bloodType }}
                </div>
              </div>
            </div>
            <div
              v-else
              class="p-3 border rounded-md bg-gray-100 text-gray-500 italic"
            >
              Không có thông tin bệnh nhân
            </div>
          </div>

          <!-- Doctor Information -->
          <div class="field">
            <label class="font-semibold mb-2 block">Bác sĩ</label>
            <div v-if="doctorInfo" class="p-3 border rounded-md bg-gray-50">
              <div class="flex gap-3 items-center mb-2">
                <Avatar
                  :image="doctorInfo.avatar"
                  size="large"
                  shape="circle"
                />
                <div>
                  <div class="font-medium">
                    {{ doctorInfo.name }} - {{ doctorInfo.specialization }}
                  </div>
                </div>
              </div>

              <div class="text-sm grid gap-1">
                <div>
                  <i class="pi pi-briefcase mr-1 text-gray-500"></i>
                  {{ doctorInfo.workplace }}
                </div>
                <div>
                  <i class="pi pi-envelope mr-1 text-gray-500"></i>
                  {{ doctorInfo.email }}
                </div>
                <div>
                  <i class="pi pi-phone mr-1 text-gray-500"></i>
                  {{ doctorInfo.phone }}
                </div>
              </div>
            </div>
            <div
              v-else
              class="p-3 border rounded-md bg-gray-100 text-gray-500 italic"
            >
              Không có thông tin bác sĩ
            </div>
          </div>
        </div>

        <!-- Dịch vụ đã đặt -->
        <div v-if="formData.serviceBooking" class="field mb-4">
          <label class="font-semibold mb-2 block">Dịch vụ đã đặt</label>
          <div class="p-3 border rounded-md bg-gray-50">
            <div class="flex justify-between items-start">
              <div class="font-medium">
                {{
                  formData.serviceBooking.service?.name ||
                  "Dịch vụ không xác định"
                }}
              </div>
              <Tag
                :value="formData.serviceBooking.status"
                :severity="
                  formData.serviceBooking.status === 'COMPLETED'
                    ? 'success'
                    : 'info'
                "
              />
            </div>

            <div
              class="text-sm mt-2"
              v-if="formData.serviceBooking.service?.description"
            >
              {{ formData.serviceBooking.service.description }}
            </div>

            <div class="grid grid-cols-2 gap-2 mt-2">
              <div class="text-sm">
                <span class="font-medium">Giá dịch vụ:</span>
                {{
                  formData.serviceBooking.service?.price?.toLocaleString(
                    "vi-VN"
                  ) || 0
                }}
                VNĐ
              </div>
              <div class="text-sm">
                <span class="font-medium">Tổng thanh toán:</span>
                {{
                  formData.serviceBooking.totalPrice?.toLocaleString("vi-VN") ||
                  0
                }}
                VNĐ
              </div>
              <div class="text-sm">
                <span class="font-medium">Phương thức:</span>
                {{
                  formData.serviceBooking.paymentMethod === "BALANCEACCOUNT"
                    ? "Tài khoản"
                    : formData.serviceBooking.paymentMethod
                }}
              </div>
              <div class="text-sm">
                <span class="font-medium">Ngày đặt:</span>
                {{ formatDate(formData.serviceBooking.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

         <div 
          v-for="(message, index) in chatMessages" 
          :key="index"
          :class="[
            'message-container relative flex mb-4 items-start',
            {
              'flex-row-reverse': message.senderType === 'DOCTOR',
              'flex-row': message.senderType === 'PATIENT' || message.senderType === 'SYSTEM'
            }
          ]"
        >
          <!-- Sender Avatar Placeholder -->
          <div 
            :class="[
              'message-avatar w-10 h-10 rounded-full flex items-center justify-center text-white mr-3 ml-3',
              {
                'bg-blue-500': message.senderType === 'DOCTOR',
                'bg-green-500': message.senderType === 'PATIENT',
                'bg-gray-500': message.senderType === 'SYSTEM'
              }
            ]"
          >
            {{ formatSenderType(message.senderType)[0] }}
          </div>
      
          <div 
            :class="[
              'message-content-wrapper max-w-[70%] rounded-lg shadow-sm p-3',
              {
                'bg-blue-50 text-blue-900': message.senderType === 'DOCTOR',
                'bg-green-50 text-green-900': message.senderType === 'PATIENT',
                'bg-gray-100 text-gray-800': message.senderType === 'SYSTEM'
              }
            ]"
          >
            <!-- Sender Type Label -->
            <div 
              class="message-sender text-xs font-semibold mb-1 opacity-70"
            >
              {{ formatSenderType(message.senderType) }}
              <span class="ml-2 text-xs text-gray-500">
                {{ formatDetailDateTime(message.sentAt) }}
              </span>
            </div>
      
            <!-- Message Content -->
            <div class="message-text">
              {{ message.content }}
            </div>
      
            <!-- Edited Indicator -->
            <div 
              v-if="message.isEdited" 
              class="edited-indicator text-xs text-gray-400 mt-1 text-right italic"
            >
              <i class="pi pi-pencil mr-1"></i>
              Đã chỉnh sửa
            </div>
          </div>
        </div>

      <DataTable
        :value="prescriptions"
        stripedRows
        showGridlines
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column field="medicine.name" header="Tên thuốc">
          <template #body="{ data }">
            <div class="font-medium">
              {{ data.medicine?.name || "Chưa xác định" }}
            </div>
            <div
              v-if="data.medicine?.description"
              class="text-xs text-gray-500 mt-1 line-clamp-2"
            >
              {{ data.medicine.description }}
            </div>
          </template>
        </Column>

        <Column field="dosage" header="Liều lượng">
          <template #body="{ data }">
            {{ data.dosage || "Không có" }}
          </template>
        </Column>

        <Column field="status" header="Trạng thái">
          <template #body="{ data }">
            <Tag
              :value="data.status"
              :severity="data.isValid ? 'success' : 'danger'"
            />
            <div
              v-if="data.isNearingExpiry"
              class="text-xs text-orange-500 mt-1"
            >
              <i class="pi pi-exclamation-triangle mr-1"></i>
              Sắp hết hạn
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Hủy" icon="pi pi-times" outlined @click="closeDialog" />
        <Button
          label="Cập nhật"
          icon="pi pi-check"
          @click="updateAppointment"
          :loading="isLoading"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.field label {
  color: #495057;
}

.p-3 {
  padding: 0.75rem;
}

.border {
  border: 1px solid #e2e8f0;
}

.rounded-md {
  border-radius: 0.375rem;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

.bg-blue-50 {
  background-color: #eff6ff;
}

.bg-green-50 {
  background-color: #f0fdf4;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-orange-500 {
  color: #f97316;
}

.font-medium {
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.text-5xl {
  font-size: 3rem;
  line-height: 1;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.ml-8 {
  margin-left: 2rem;
}

.mr-1 {
  margin-right: 0.25rem;
}

.mr-8 {
  margin-right: 2rem;
}

.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.p-3 {
  padding: 0.75rem;
}

.p-4 {
  padding: 1rem;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}

.gap-4 {
  gap: 1rem;
}

.grid {
  display: grid;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.items-start {
  align-items: flex-start;
}

.justify-between {
  justify-content: space-between;
}

.justify-end {
  justify-content: flex-end;
}

.justify-center {
  justify-content: center;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.w-full {
  width: 100%;
}

.max-h-96 {
  max-height: 24rem;
}

.overflow-y-auto {
  overflow-y: auto;
}

.overflow-hidden {
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.border-t {
  border-top-width: 1px;
}

.border-b {
  border-bottom-width: 1px;
}

/* Styling for datetime-local input */
input[type="datetime-local"] {
  appearance: none;
  -webkit-appearance: none;
  padding: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #1f2937;
}

input[type="datetime-local"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Chat messages styling */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}
.message-container {
  align-items: flex-start;
}

.message-avatar {
  flex-shrink: 0;
  font-weight: bold;
}

.message-content-wrapper {
  border-radius: 0.75rem;
  position: relative;
}

.message-sender {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
