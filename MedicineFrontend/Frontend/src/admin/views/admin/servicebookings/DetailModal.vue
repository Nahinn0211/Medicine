<script setup>
import { ref, defineProps, defineEmits, computed, watch } from "vue";
import Dialog from "primevue/dialog";
import Card from "primevue/card";
import Divider from "primevue/divider";
import Avatar from "primevue/avatar";
import Tag from "primevue/tag";
import { sendGet } from "@admin/services/axios";
import { API_BASE_URL } from "@/config/apiConfig";

// Props và emits
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  booking: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:visible"]);

// State
const appointmentDetails = ref(null);
const isLoading = ref(false);

// Computed
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

// API Service
const AppointmentService = {
  async getAppointmentByServiceBookingId(serviceBookingId) {
    return await sendGet(
      `${API_BASE_URL}/appointments/service-bookings/${serviceBookingId}`
    );
  },
};

// Watchers
watch(
  () => props.booking,
  async (newBooking) => {
    if (newBooking && newBooking.id && props.visible) {
      await fetchAppointmentDetails(newBooking.id);
    }
  },
  { immediate: true }
);

watch(
  () => props.visible,
  async (isVisible) => {
    if (isVisible && props.booking && props.booking.id) {
      await fetchAppointmentDetails(props.booking.id);
    }
  }
);

// Methods
// Lấy thông tin chi tiết lịch hẹn từ API
const fetchAppointmentDetails = async (bookingId) => {
  try {
    isLoading.value = true;
    const response =
      await AppointmentService.getAppointmentByServiceBookingId(bookingId);
    appointmentDetails.value = response.data || response;
    console.log("Chi tiết cuộc hẹn:", appointmentDetails.value);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin chi tiết cuộc hẹn:", error);
    appointmentDetails.value = null;
  } finally {
    isLoading.value = false;
  }
};

// Format tiền VND
const formatPrice = (price) => {
  return price
    ? price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
    : "---";
};

// Format ngày giờ
const formatDate = (dateString) => {
  if (!dateString) return "---";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format ngày
const formatDateOnly = (dateString) => {
  if (!dateString) return "---";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Format giờ
const formatTimeOnly = (timeObj) => {
  if (!timeObj) return "---";

  // Trường hợp timeObj là đối tượng với hour, minute
  if (timeObj.hour !== undefined && timeObj.minute !== undefined) {
    const hour = String(timeObj.hour).padStart(2, "0");
    const minute = String(timeObj.minute).padStart(2, "0");
    return `${hour}:${minute}`;
  }

  return "---";
};

// Format phương thức thanh toán
const getPaymentMethodLabel = (method) => {
  const methodMap = {
    PAYPAL: "PayPal",
    CREDIT_CARD: "Thẻ tín dụng",
    BANK_TRANSFER: "Chuyển khoản",
    CASH: "Tiền mặt",
    MOMO: "Ví MoMo",
    VNPAY: "VNPay",
    BALANCEACCOUNT: "Số dư tài khoản",
  };
  return methodMap[method] || method;
};

// Format trạng thái booking
const getStatusLabel = (status) => {
  const statusMap = {
    PENDING: "Đang chờ",
    CONFIRMED: "Đã xác nhận",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    FAILED: "Thất bại",
  };
  return statusMap[status] || status;
};

// CSS class cho trạng thái booking
const getStatusClass = (status) => {
  const classMap = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-gray-100 text-gray-800",
  };
  return classMap[status] || "";
};

// Format trạng thái cuộc hẹn
const getAppointmentStatusLabel = (status) => {
  const statusMap = {
    SCHEDULED: "Đã lên lịch",
    CONFIRMED: "Đã xác nhận",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    NO_SHOW: "Không đến",
    PENDING: "Đang chờ",
  };
  return statusMap[status] || status;
};

// CSS class cho trạng thái cuộc hẹn
const getAppointmentStatusClass = (status) => {
  const classMap = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-purple-100 text-purple-800",
    NO_SHOW: "bg-gray-100 text-gray-800",
    PENDING: "bg-yellow-100 text-yellow-800",
  };
  return classMap[status] || "";
};

// Lấy URL avatar
const getUserAvatar = (avatar) => {
  if (!avatar) return "https://placehold.co/100x100/EEE/999?text=No+Avatar";

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  return `${API_BASE_URL}/../uploads/users/${avatar}`;
};

// Lấy nhãn nhóm máu
const getBloodTypeLabel = (bloodType) => {
  const bloodTypeMap = {
    A_POSITIVE: "A+",
    A_NEGATIVE: "A-",
    B_POSITIVE: "B+",
    B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+",
    AB_NEGATIVE: "AB-",
    O_POSITIVE: "O+",
    O_NEGATIVE: "O-",
  };
  return bloodTypeMap[bloodType] || bloodType;
};
</script>

<template>
  <Dialog
    v-model:visible="modalVisible"
    :modal="true"
    :draggable="false"
    :closable="true"
    :style="{ width: '90vw', maxWidth: '900px' }"
    header="Chi tiết đặt lịch dịch vụ"
  >
    <div v-if="isLoading" class="flex justify-center items-center p-6">
      <i class="pi pi-spin pi-spinner text-primary text-4xl"></i>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 p-3">
      <!-- Thông tin đặt lịch -->
      <div class="col-span-1 md:col-span-2">
        <Card class="shadow-sm">
          <template #title>
            <div class="flex items-center">
              <i class="pi pi-calendar-plus mr-2 text-blue-500"></i>
              <span>Thông tin đặt lịch</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="mb-3">
                <p class="text-gray-500 mb-1 text-sm">Mã đặt lịch:</p>
                <p class="font-bold">#{{ props.booking.id }}</p>
              </div>

              <div class="mb-3">
                <p class="text-gray-500 mb-1 text-sm">Trạng thái:</p>
                <span
                  :class="[
                    'px-2 py-1 rounded-lg text-xs font-medium inline-block',
                    getStatusClass(props.booking.status),
                  ]"
                >
                  {{ getStatusLabel(props.booking.status) }}
                </span>
              </div>

              <div class="mb-3">
                <p class="text-gray-500 mb-1 text-sm">Tổng thanh toán:</p>
                <p class="font-bold text-red-600">
                  {{ formatPrice(props.booking.totalPrice) }}
                </p>
              </div>

              <div class="mb-3">
                <p class="text-gray-500 mb-1 text-sm">
                  Phương thức thanh toán:
                </p>
                <p>{{ getPaymentMethodLabel(props.booking.paymentMethod) }}</p>
              </div>

              <div class="mb-3">
                <p class="text-gray-500 mb-1 text-sm">Ngày tạo:</p>
                <p>{{ formatDate(props.booking.createdAt) }}</p>
              </div>

              <div class="mb-3">
                <p class="text-gray-500 mb-1 text-sm">Cập nhật lần cuối:</p>
                <p>{{ formatDate(props.booking.updatedAt) }}</p>
              </div>

              <div
                class="col-span-1 md:col-span-2 mb-3"
                v-if="props.booking.notes"
              >
                <p class="text-gray-500 mb-1 text-sm">Ghi chú:</p>
                <p class="italic">
                  {{ props.booking.notes || "Không có ghi chú" }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Thông tin dịch vụ -->
      <div>
        <Card class="shadow-sm h-full">
          <template #title>
            <div class="flex items-center">
              <i class="pi pi-briefcase-medical mr-2 text-green-500"></i>
              <span>Thông tin dịch vụ</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col h-full">
              <div
                v-if="props.booking.service?.image"
                class="mb-4 flex justify-center"
              >
                <img
                  :src="props.booking.service.image"
                  :alt="props.booking.service?.name"
                  class="h-36 object-cover rounded-lg shadow-sm"
                  @error="
                    $event.target.src =
                      'https://placehold.co/150x150/EEE/999?text=Không+có+ảnh'
                  "
                />
              </div>

              <div class="mb-3">
                <p class="text-gray-500 mb-1 text-sm">Tên dịch vụ:</p>
                <p class="font-semibold text-lg text-blue-700">
                  {{ props.booking.service?.name }}
                </p>
              </div>

              <div class="mb-3">
                <p class="text-gray-500 mb-1 text-sm">Giá dịch vụ:</p>
                <p class="font-bold text-red-600">
                  {{ formatPrice(props.booking.service?.price) }}
                </p>
              </div>

              <div class="mb-3 flex-grow">
                <p class="text-gray-500 mb-1 text-sm">Mô tả:</p>
                <p class="text-gray-700">
                  {{ props.booking.service?.description || "Không có mô tả" }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Chi tiết cuộc hẹn nếu có -->
      <div v-if="appointmentDetails">
        <Card class="shadow-sm h-full">
          <template #title>
            <div class="flex items-center">
              <i class="pi pi-calendar mr-2 text-orange-500"></i>
              <span>Thông tin cuộc hẹn</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 gap-3">
              <div class="mb-1">
                <p class="text-gray-500 text-sm">Mã cuộc hẹn:</p>
                <p class="font-bold">{{ appointmentDetails.id }}</p>
              </div>

              <div class="mb-1">
                <p class="text-gray-500 text-sm">Ngày hẹn:</p>
                <p>{{ formatDateOnly(appointmentDetails.appointmentDate) }}</p>
              </div>

              <div class="mb-1">
                <p class="text-gray-500 text-sm">Giờ hẹn:</p>
                <p>{{ formatTimeOnly(appointmentDetails.appointmentTime) }}</p>
              </div>

              <div class="mb-1">
                <p class="text-gray-500 text-sm">Trạng thái cuộc hẹn:</p>
                <span
                  :class="[
                    'px-2 py-1 rounded-lg text-xs font-medium inline-block',
                    getAppointmentStatusClass(appointmentDetails.status),
                  ]"
                >
                  {{ getAppointmentStatusLabel(appointmentDetails.status) }}
                </span>
              </div>

              <div class="mb-1" v-if="appointmentDetails.notes">
                <p class="text-gray-500 text-sm">Ghi chú cuộc hẹn:</p>
                <p class="italic">{{ appointmentDetails.notes }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Thông tin không có cuộc hẹn -->
      <div v-else>
        <Card class="shadow-sm h-full">
          <template #title>
            <div class="flex items-center">
              <i class="pi pi-calendar mr-2 text-gray-500"></i>
              <span>Thông tin cuộc hẹn</span>
            </div>
          </template>
          <template #content>
            <div class="py-6 text-center">
              <i class="pi pi-calendar-times text-gray-400 text-3xl mb-2"></i>
              <p class="text-gray-500">
                Không tìm thấy thông tin cuộc hẹn cho đặt lịch này
              </p>
            </div>
          </template>
        </Card>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="appointmentDetails">
    <!-- Thông tin bệnh nhân -->
    <Card class="shadow-sm" v-if="appointmentDetails.patient">
      <template #title>
        <div class="flex items-center">
          <i class="pi pi-user mr-1 text-purple-500"></i>
          <span>Thông tin bệnh nhân</span>
        </div>
      </template>
      <template #content>
        <div class="flex items-center mb-4">
          <Avatar
            :image="getUserAvatar(appointmentDetails.patient?.user?.avatar)"
            shape="circle"
            size="large"
            class="mr-3"
          />
          <div>
            <div class="font-bold">
              {{
                appointmentDetails.patient?.user?.fullName || "Không có tên"
              }}
            </div>
            <div class="text-sm text-gray-600">
              ID: {{ appointmentDetails.patientId }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <div class="mb-1">
            <p class="text-gray-500 text-sm">Email:</p>
            <p>{{ appointmentDetails.patient?.user?.email || "---" }}</p>
          </div>
          <div class="mb-1">
            <p class="text-gray-500 text-sm">Số điện thoại:</p>
            <p>{{ appointmentDetails.patient?.user?.phone || "---" }}</p>
          </div>
          <div class="mb-1">
            <p class="text-gray-500 text-sm">Địa chỉ:</p>
            <p>{{ appointmentDetails.patient?.user?.address || "---" }}</p>
          </div>
          <div class="mb-1">
            <p class="text-gray-500 text-sm">Nhóm máu:</p>
            <p>
              {{
                getBloodTypeLabel(appointmentDetails.patient?.bloodType) ||
                "---"
              }}
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Thông tin bác sĩ từ appointment API -->
    <Card class="shadow-sm" v-if="appointmentDetails.doctor">
      <template #title>
        <div class="flex items-center">
          <i class="pi pi-user-plus mr-1 text-indigo-500"></i>
          <span>Thông tin bác sĩ</span>
        </div>
      </template>
      <template #content>
        <div class="flex items-center mb-4">
          <Avatar
            :image="getUserAvatar(appointmentDetails.doctor?.user?.avatar)"
            shape="circle"
            size="large"
            class="mr-3"
          />
          <div>
            <div class="font-bold">
              {{
                appointmentDetails.doctor?.user?.fullName || "Không có tên"
              }}
            </div>
            <div class="text-sm text-gray-600">
              ID: {{ appointmentDetails.doctorId }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <div class="mb-1">
            <p class="text-gray-500 text-sm">Chuyên khoa:</p>
            <p class="font-medium">
              {{ appointmentDetails.doctor?.specialization || "---" }}
            </p>
          </div>
          <div class="mb-1">
            <p class="text-gray-500 text-sm">Kinh nghiệm:</p>
            <p>{{ appointmentDetails.doctor?.experience || "---" }}</p>
          </div>
          <div class="mb-1">
            <p class="text-gray-500 text-sm">Nơi làm việc:</p>
            <p>{{ appointmentDetails.doctor?.workplace || "---" }}</p>
          </div>
          <div class="mb-1">
            <p class="text-gray-500 text-sm">Email:</p>
            <p>{{ appointmentDetails.doctor?.user?.email || "---" }}</p>
          </div>
        </div>
      </template>
    </Card>
  </div>
  </Dialog>
</template>

<style scoped>
.p-card .p-card-title {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.p-card .p-card-content {
  padding-top: 0;
}

.p-dialog-content {
  padding: 0 !important;
}
</style>
