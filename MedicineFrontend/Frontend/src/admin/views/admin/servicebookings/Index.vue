<script setup>
  import { ref, onMounted } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import { useToast } from 'primevue/usetoast';
  
  // Primevue Components
  import Toast from 'primevue/toast';
  import ConfirmDialog from 'primevue/confirmdialog';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  
  // Custom Components
  import EditForm from './EditForm.vue';
  import DetailModal from './DetailModal.vue';
  
  // Services
  import { ServiceBookingService } from '@admin/stores/admin/ServiceBooking';
  import { AppointmentService } from '@/admin/stores/admin/Appointments';
  
  // Composition Setup
  const confirm = useConfirm();
  const toast = useToast();
  
  // Reactive State
  const serviceBookings = ref([]);
  const selectedServiceBookings = ref([]);
  const isLoading = ref(false);
  const editForm = ref({ visible: false, data: {} });
  const detailModal = ref({ visible: false, booking: {} });
  
  // Columns Configuration
  const columns = ref([
    { field: 'id', label: 'ID', visible: true },
    { field: 'service.name', label: 'Dịch vụ', visible: true },
    { field: 'patient.user.fullName', label: 'Bệnh nhân', visible: true },
    { field: 'totalPrice', label: 'Tổng giá', visible: true },
    { field: 'paymentMethod', label: 'Phương thức thanh toán', visible: true },
    { field: 'status', label: 'Trạng thái', visible: true },
    { field: 'createdAt', label: 'Ngày tạo', visible: true },
    { field: 'updatedAt', label: 'Ngày cập nhật', visible: true }
  ]);
  
  // Fetch Service Bookings with Appointment Details
  const fetchServiceBookings = async () => {
    try {
      isLoading.value = true;
      const response = await ServiceBookingService.getServiceBookings();
      serviceBookings.value = await Promise.all(
        response.data.map(async (booking) => {
          try {
            const appointmentResponse = await AppointmentService.getAppointmentByServiceBookingId(booking.id);
            return {
              ...booking,
              appointmentDetails: appointmentResponse.data || null
            };
          } catch (error) {
            console.error(`Error fetching appointment for booking ${booking.id}:`, error);
            return booking;
          }
        })
      );
    } catch (error) {
      console.error('Error fetching service bookings:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách đặt lịch',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  // Open Edit Form for a Booking
  const openEditForm = async (data) => {
    try {
      const response = await ServiceBookingService.getServiceBookingById(data.id);
      editForm.value = {
        visible: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching service booking details:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải thông tin đặt lịch',
        life: 3000
      });
    }
  };
  
  // Open Detail Modal for a Booking
  const openDetailModal = async (data) => {
    try {
      isLoading.value = true;
      const response = await ServiceBookingService.getServiceBookingById(data.id);
      detailModal.value = {
        visible: true,
        booking: response.data
      };
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải thông tin chi tiết đặt lịch',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  // Handle Deletion of Bookings
  const handleDelete = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
  
    confirm.require({
      message: ids.length > 1
        ? 'Bạn có chắc chắn muốn xóa các đặt lịch đã chọn không?'
        : 'Bạn có chắc chắn muốn xóa đặt lịch này không?',
      header: 'Xác nhận',
      icon: 'pi pi-info-circle',
      accept: async () => {
        try {
          isLoading.value = true;
          await ServiceBookingService.deleteServiceBookings(ids);
  
          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xóa ${ids.length} đặt lịch`,
            life: 3000
          });
  
          fetchServiceBookings();
  
          if (ids.length > 1) {
            selectedServiceBookings.value = [];
          }
        } catch (error) {
          console.error('Error deleting service bookings:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa đặt lịch',
            life: 3000
          });
        } finally {
          isLoading.value = false;
        }
      }
    });
  };
  
  // Delete Selected Service Bookings
  const deleteSelectedServiceBookings = () => {
    if (selectedServiceBookings.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Chưa chọn đặt lịch để xóa',
        life: 3000
      });
      return;
    }
  
    const ids = selectedServiceBookings.value.map(booking => booking.id);
    handleDelete(ids);
  };
  
  // Utility Functions
  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatPrice = (price) => {
    return price ? price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '---';
  };
  
  // Payment Method Mapping
  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      'PAYPAL': 'PayPal',
      'CREDIT_CARD': 'Thẻ tín dụng',
      'BANK_TRANSFER': 'Chuyển khoản',
      'CASH': 'Tiền mặt',
      'MOMO': 'Ví MoMo',
      'VNPAY': 'VNPay',
      'BALANCEACCOUNT': 'Số dư tài khoản'
    };
    return methodMap[method] || method;
  };
  
  // Status Mapping
  const getStatusLabel = (status) => {
    const statusMap = {
      'PENDING': 'Đang chờ',
      'CONFIRMED': 'Đã xác nhận',
      'CANCELLED': 'Đã hủy',
      'COMPLETED': 'Hoàn thành',
      'FAILED': 'Thất bại'
    };
    return statusMap[status] || status;
  };
  
  // Status CSS Class Mapping
  const getStatusClass = (status) => {
    const classMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || '';
  };
  
  // Fetch service bookings on component mount
  onMounted(fetchServiceBookings);
  </script>
<template>
  <div class="card">
    <Toast />
    <ConfirmDialog />

    <DataTable 
      v-model:selection="selectedServiceBookings" 
      :value="serviceBookings" 
      dataKey="id" 
      :paginator="true"
      :rows="5" 
      :loading="isLoading"
      showCurrentPageReport
      currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    >
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold text-xl">Danh sách đặt lịch dịch vụ</span>
          <div class="flex gap-2">
            <Button 
              v-if="selectedServiceBookings.length > 0" 
              label="Xóa các mục đã chọn" 
              icon="pi pi-trash" 
              severity="danger" 
              @click="deleteSelectedServiceBookings"
            />
          </div>
        </div>
      </template>
      
      <Column selectionMode="multiple" style="width: 3rem"></Column>
      
      <Column field="id" header="ID" sortable style="width: 5rem"></Column>
      
      <Column field="service.name" header="Dịch vụ" sortable>
        <template #body="{ data }">
          {{ data.service?.name || '---' }}
        </template>
      </Column>
      
      <Column field="patient.user.fullName" header="Bệnh nhân" sortable>
        <template #body="{ data }">
          {{ 
            data.appointmentDetails?.patient?.user?.fullName || 
            data.patient?.user?.fullName || 
            "Không có tên" 
          }}
        </template>
      </Column>
      
      <Column field="totalPrice" header="Tổng giá" sortable>
        <template #body="{ data }">
          <span class="font-semibold text-red-600">{{ formatPrice(data.totalPrice) }}</span>
        </template>
      </Column>
      
      <Column field="paymentMethod" header="Thanh toán" sortable>
        <template #body="{ data }">
          {{ getPaymentMethodLabel(data.paymentMethod) }}
        </template>
      </Column>
      
      <Column field="status" header="Trạng thái" sortable>
        <template #body="{ data }">
          <span :class="['px-2 py-1 rounded-lg text-xs font-medium inline-block', getStatusClass(data.status)]">
            {{ getStatusLabel(data.status) }}
          </span>
        </template>
      </Column>
      
      <Column field="createdAt" header="Ngày tạo" sortable>
        <template #body="{ data }">
          {{ formatDate(data.createdAt) }}
        </template>
      </Column>
      
      <Column header="Tác vụ" style="width: 12rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button 
              icon="pi pi-eye" 
              outlined
              severity="info"
              tooltip="Xem chi tiết" 
              @click="openDetailModal(data)" 
            />
            <Button 
              icon="pi pi-pencil" 
              outlined 
              tooltip="Cập nhật trạng thái và giá" 
              @click="openEditForm(data)" 
            />
            <Button 
              icon="pi pi-trash" 
              outlined 
              severity="danger" 
              tooltip="Xóa" 
              @click="handleDelete(data.id)" 
            />
          </div>
        </template>
      </Column>
    </DataTable>
    
    <!-- Form cập nhật -->
    <EditForm 
      v-model:modelValue="editForm.visible" 
      :data="editForm.data" 
      @refreshList="fetchServiceBookings" 
    />
    
    <!-- Modal xem chi tiết -->
    <DetailModal
      v-model:visible="detailModal.visible"
      :booking="detailModal.booking"
    />
  </div>
</template>

<style scoped>
.card {
  padding: 1rem;
}
</style>