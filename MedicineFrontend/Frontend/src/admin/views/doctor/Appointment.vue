<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router';
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { authService } from '@user/services/AuthService';
import { useAuthStore } from '@user/stores/auth/useAuthStore';
import {
  AppointmentService,
  formatDate,
  formatTimeOnly,
  getAppointmentStatusLabel,
  getAppointmentStatusClass,
} from "@admin/stores/admin/Appointments";

const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();
const appointments = ref([]);
const selectedAppointments = ref([]);
const isLoading = ref(false);
const form = ref({ visible: false, data: {} });
const router = useRouter();

// Định nghĩa các cột cho DataTable
const columns = ref([
  { field: "patientName", label: "Bệnh nhân", visible: true },
  { field: "doctorName", label: "Bác sĩ", visible: true },
  { field: "appointmentDate", label: "Ngày hẹn", visible: true },
  { field: "appointmentTime", label: "Giờ hẹn", visible: true },
  { field: "status", label: "Trạng thái", visible: true },
]);
const token = localStorage.getItem("token");
console.log("Token:", token);

const fetchAppointments = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Không tìm thấy token");
    }

    const doctorData = await authService.getDataDoctor(authStore.user.id);
    const doctorId = doctorData.id;

    isLoading.value = true;

    const response = await AppointmentService.getAppointmentsByDoctorId(doctorId);
    appointments.value = response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lịch hẹn:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải danh sách lịch hẹn",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

const isConsultationAvailable = (appointmentDate, appointmentTime, consultation) => {
  return !!consultation;
};

// Chuyển đến trang video consultation hoặc prescription
const navigateToVideoConsultation = async (consultation) => {
  try {
    // Kiểm tra trạng thái và tính khả dụng của cuộc tư vấn
    if (!consultation) {
      toast.add({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Không tìm thấy thông tin cuộc tư vấn",
        life: 3000,
      });
      return;
    }

    // Lấy mã cuộc tư vấn
    const consultationCode = consultation.consultationCode;
    if (!consultationCode) {
      toast.add({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Không có mã cuộc tư vấn",
        life: 3000,
      });
      return;
    }
    if (consultation.status === "COMPLETED") {
      router.push(`/prescription/${consultationCode}`);
    } else {
      // Chuyển đến trang video consultation (Call)
      router.push({
        name: 'Call',
        params: { consultationCode: consultationCode }
      });
    }
  } catch (error) {
    console.error('Lỗi chuyển đến trang tư vấn:', error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể chuyển đến trang tư vấn",
      life: 3000,
    });
  }
};

// Gọi API khi component được tạo
onMounted(fetchAppointments);

// Mở form thêm hoặc sửa lịch hẹn
const openForm = (data = null) => {
  if (data) {
    form.value = {
      visible: true,
      data: { ...data },
    };
  } else {
    form.value = {
      visible: true,
      data: {
        patientId: null,
        doctorId: null,
        serviceBookingId: null,
        appointmentDate: null,
        appointmentTime: null,
        status: "SCHEDULED",
        notes: "",
      },
    };
  }
};

// Xác nhận xóa lịch hẹn
const deleteAppointment = (id) => {
  confirm.require({
    message: "Bạn có chắc chắn muốn xóa lịch hẹn này không?",
    header: "Xác nhận",
    icon: "pi pi-info-circle",
    accept: async () => {
      try {
        isLoading.value = true;
        await AppointmentService.deleteAppointments([id]);
        await fetchAppointments(); // Gọi lại API để refresh dữ liệu
        toast.add({
          severity: "success",
          summary: "Thành công",
          detail: "Đã xóa lịch hẹn thành công",
          life: 3000,
        });
      } catch (error) {
        console.error("Lỗi khi xóa lịch hẹn:", error);
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể xóa lịch hẹn",
          life: 3000,
        });
      } finally {
        isLoading.value = false;
      }
    },
  });
};

// Chức năng hoàn thành lịch hẹn
const completeAppointment = async (appointment) => {
  try {
    isLoading.value = true;
    const updatedAppointment = {
      ...appointment,
      status: "COMPLETED",
    };
    await AppointmentService.saveOrUpdateAppointment(updatedAppointment);
    await fetchAppointments();
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã hoàn thành lịch hẹn",
      life: 3000,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật lịch hẹn:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể cập nhật lịch hẹn",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

// Chức năng xác nhận lịch hẹn
const confirmAppointment = async (appointment) => {
  try {
    isLoading.value = true;
    const updatedAppointment = {
      ...appointment,
      status: "CONFIRMED",
    };
    await AppointmentService.saveOrUpdateAppointment(updatedAppointment);
    await fetchAppointments();
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã xác nhận lịch hẹn",
      life: 3000,
    });
  } catch (error) {
    console.error("Lỗi khi xác nhận lịch hẹn:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể xác nhận lịch hẹn",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

// Chức năng hủy lịch hẹn
const cancelAppointment = async (appointment) => {
  try {
    isLoading.value = true;
    const updatedAppointment = {
      ...appointment,
      status: "CANCELLED",
    };
    await AppointmentService.saveOrUpdateAppointment(updatedAppointment);
    await fetchAppointments();
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã hủy lịch hẹn",
      life: 3000,
    });
  } catch (error) {
    console.error("Lỗi khi hủy lịch hẹn:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể hủy lịch hẹn",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

// Xóa nhiều lịch hẹn được chọn
const deleteSelectedAppointments = () => {
  if (selectedAppointments.value.length === 0) {
    toast.add({
      severity: "warn",
      summary: "Cảnh báo",
      detail: "Vui lòng chọn ít nhất một lịch hẹn để xóa",
      life: 3000,
    });
    return;
  }

  confirm.require({
    message: `Bạn có chắc chắn muốn xóa ${selectedAppointments.value.length} lịch hẹn đã chọn không?`,
    header: "Xác nhận xóa nhiều",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      try {
        isLoading.value = true;
        const ids = selectedAppointments.value.map(
          (appointment) => appointment.id
        );
        await AppointmentService.deleteAppointments(ids);
        await fetchAppointments();
        selectedAppointments.value = [];
        toast.add({
          severity: "success",
          summary: "Thành công",
          detail: "Đã xóa các lịch hẹn đã chọn",
          life: 3000,
        });
      } catch (error) {
        console.error("Lỗi khi xóa nhiều lịch hẹn:", error);
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể xóa các lịch hẹn đã chọn",
          life: 3000,
        });
      } finally {
        isLoading.value = false;
      }
    },
  });
};
</script>

<template>
  <div class="card">
    <ConfirmDialog />
    <Toast />

    <DataTable v-model:selection="selectedAppointments" :value="appointments" dataKey="id" :paginator="true" :rows="10"
      :loading="isLoading" showCurrentPageReport
      currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      responsiveLayout="scroll" stripedRows>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold text-xl">Danh sách lịch hẹn</span>
        </div>
      </template>

      <!-- Cột thông tin bệnh nhân -->
      <Column field="patientName" header="Bệnh nhân" sortable>
        <template #body="{ data }">
          <div>
            <span class="font-semibold">{{
              data.patient?.user?.fullName || data.patientName || "---"
            }}</span>
            <div v-if="data.patient?.user?.email" class="text-sm text-gray-500">
              {{ data.patient.user.email }}
            </div>
          </div>
        </template>
      </Column>

      <!-- Cột thông tin bác sĩ -->
      <Column field="doctorName" header="Bác sĩ" sortable>
        <template #body="{ data }">
          <div>
            <span class="font-semibold">{{
              data.doctor?.user?.fullName || data.doctorName || "---"
            }}</span>
            <div v-if="data.doctor?.specialization" class="text-sm text-gray-500">
              {{ data.doctor.specialization }}
            </div>
          </div>
        </template>
      </Column>

      <!-- Cột ngày hẹn -->
      <Column field="appointmentDate" header="Ngày hẹn" sortable>
        <template #body="{ data }">
          {{ data.appointmentDate }}
        </template>
      </Column>

      <!-- Cột giờ hẹn -->
      <Column field="appointmentTime" header="Giờ hẹn" sortable>
        <template #body="{ data }">
          {{ formatTimeOnly(data.appointmentTime) }}
        </template>
      </Column>

      <!-- Cột trạng thái -->
      <Column field="status" header="Trạng thái" sortable>
        <template #body="{ data }">
          <span :class="[
            'px-2 py-1 rounded-lg text-xs font-medium',
            getAppointmentStatusClass(data.status),
          ]">
            {{ getAppointmentStatusLabel(data.status) }}
          </span>
        </template>
      </Column>

      <!-- Cột thời gian tạo/cập nhật -->
      <Column header="Thời gian">
        <template #body="{ data }">
          <div class="text-sm">
            <div>
              <span class="font-semibold">Tạo:</span>
              {{ formatDate(data.createdAt) }}
            </div>
            <div>
              <span class="font-semibold">Cập nhật:</span>
              {{ formatDate(data.updatedAt) }}
            </div>
          </div>
        </template>
      </Column>

      <!-- Cột Tác vụ -->
      <Column header="Tác vụ" :exportable="false" style="min-width: 12rem">
        <template #body="{ data }">
          <div class="flex gap-1">


            <Button v-if="data.status === 'SCHEDULED'" icon="pi pi-check" outlined severity="success" size="small"
              @click="confirmAppointment(data)" tooltip="Xác nhận lịch hẹn" />

            <Button v-if="['SCHEDULED', 'CONFIRMED'].includes(data.status)" icon="pi pi-times" outlined
              severity="warning" size="small" @click="cancelAppointment(data)" tooltip="Hủy lịch hẹn" />

            <Button v-if="data.status === 'CONFIRMED'" icon="pi pi-check-circle" outlined severity="info" size="small"
              @click="completeAppointment(data)" tooltip="Hoàn thành lịch hẹn" />

            <Button icon="pi pi-video" outlined severity="info" size="small" tooltip="Xem phiên tư vấn"
              @click="navigateToVideoConsultation(data.consultation)"
              :disabled="!data.consultation || !['PENDING', 'IN_PROGRESS'].includes(data.consultation?.status)" />
          </div>
        </template>
      </Column>

      <!-- Hiển thị khi không có dữ liệu -->
      <template #empty>
        <div class="text-center p-4">
          <i class="pi pi-calendar-times text-gray-400 text-5xl mb-4"></i>
          <p>Không tìm thấy lịch hẹn nào</p>
        </div>
      </template>

      <!-- Hiển thị khi đang tải dữ liệu -->
      <template #loading>
        <div class="text-center p-4">
          <i class="pi pi-spin pi-spinner text-primary text-5xl mb-4"></i>
          <p>Đang tải dữ liệu lịch hẹn...</p>
        </div>
      </template>
    </DataTable>

    <!-- Popup thêm/sửa lịch hẹn -->
    <CreateForm v-model:visible="form.visible" :data="form.data" @refresh="fetchAppointments" />
  </div>
</template>

<style scoped>
.card {
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background-color: white;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
