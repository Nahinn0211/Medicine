<script setup>
  import { ref, onMounted } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import { useToast } from 'primevue/usetoast';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import Toast from 'primevue/toast';
  import ConfirmDialog from 'primevue/confirmdialog';
  import CreateForm from './Create.vue';
  import { OrderService } from '@admin/stores/admin/Order';
  
  const confirm = useConfirm();
  const toast = useToast();
  const orders = ref([]);
  const selectedOrders = ref([]);
  const isLoading = ref(false);
  
  const form = ref({ 
    visible: false, 
    data: {
      id: 0,
      orderCode: '',
      patientId: null,
      totalPrice: 0,
      paymentMethod: '',
      status: '',
      voucherCode: '',
      discountAmount: 0,
      note: ''
    } 
  });
  
  const fetchOrders = async () => {
    try {
      isLoading.value = true;
      const response = await OrderService.getOrders();
      
      if (Array.isArray(response.data)) {
        orders.value = response.data;
      } else {
        console.error('Dữ liệu đơn hàng không phải là mảng:', response.data);
        orders.value = [];
        toast.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Dữ liệu đơn hàng không đúng định dạng',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách đơn hàng',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  // Gọi API khi component được tạo
  onMounted(() => {
    fetchOrders();
  });
  
  // Mở form thêm hoặc sửa đơn hàng
  const openForm = async (data = null) => {
    if (data && data.id) {
      try {
        const response = await OrderService.getOrderById(data.id);
        form.value = {
          visible: true,
          data: { ...response.data }
        };
      } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin đơn hàng',
          life: 3000
        });
      }
    } else {
      form.value = {
        visible: true,
        data: {
          id: 0,
          orderCode: '',
          patientId: null,
          totalPrice: 0,
          paymentMethod: '',
          status: '',
          voucherCode: '',
          discountAmount: 0,
          note: ''
        }
      };
    }
  };
  
  // Hàm xóa đơn hàng
  const deleteOrder = (id) => {
    confirm.require({
      message: 'Bạn có chắc chắn muốn xóa đơn hàng này không?',
      header: 'Xác nhận',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptClass: 'p-button-danger',
      accept: async () => {
        try {
          await OrderService.deleteOrders([id]);
          
          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã xóa đơn hàng',
            life: 3000
          });
          
          fetchOrders();
        } catch (error) {
          console.error('Lỗi khi xóa đơn hàng:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa đơn hàng',
            life: 3000
          });
        }
      }
    });
  };
  
  // Hàm xóa nhiều đơn hàng được chọn
  const deleteSelectedOrders = () => {
    if (selectedOrders.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Chưa chọn đơn hàng để xóa',
        life: 3000
      });
      return;
    }
    
    confirm.require({
      message: 'Bạn có chắc chắn muốn xóa các đơn hàng đã chọn không?',
      header: 'Xác nhận',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptClass: 'p-button-danger',
      accept: async () => {
        try {
          const ids = selectedOrders.value.map(order => order.id);
          await OrderService.deleteOrders(ids);
          
          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xóa ${selectedOrders.value.length} đơn hàng`,
            life: 3000
          });
          
          fetchOrders();
          selectedOrders.value = [];
        } catch (error) {
          console.error('Lỗi khi xóa nhiều đơn hàng:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa các đơn hàng đã chọn',
            life: 3000
          });
        }
      }
    });
  };
  </script>
  <template>
    <div class="card">
      <Toast />
      <ConfirmDialog />
      
      <DataTable
        v-model:selection="selectedOrders"
        :value="orders"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :loading="isLoading"
        showCurrentPageReport
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        responsiveLayout="scroll"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-xl">Quản lý đơn hàng</span>
             
          </div>
        </template>
        
          
        <!-- Cột ID -->
        <Column header="STT" :exportable="false" style="min-width: 5rem">
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>        
        <!-- Cột mã đơn hàng -->
        <Column field="orderCode" header="Mã đơn hàng" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.orderCode }}</span>
          </template>
        </Column>
        
        <!-- Cột ID bệnh nhân -->
        <Column field="patientName" header="Tên bệnh nhân" sortable style="min-width: 10rem"></Column>
        
        <!-- Cột tổng giá -->
        <Column field="totalPrice" header="Tổng giá" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span>{{ data.totalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) }}</span>
          </template>
        </Column>
        
        <!-- Cột phương thức thanh toán -->
        <Column field="paymentMethod" header="Phương thức thanh toán" sortable style="min-width: 14rem"></Column>
        
        <!-- Cột trạng thái -->
        <Column field="status" header="Trạng thái" sortable style="min-width: 10rem"></Column>
        
        <!-- Cột tác vụ -->
        <Column header="Tác vụ" :exportable="false" style="min-width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" rounded outlined @click="openForm(data)" />
             </div>
          </template>
        </Column>
        
        <!-- Template khi không có dữ liệu -->
        <template #empty>
          <div class="text-center py-4">
            <i class="pi pi-search text-gray-400 text-3xl mb-2"></i>
            <p>Không tìm thấy đơn hàng nào.</p>
          </div>
        </template>
        
        <!-- Template loading -->
        <template #loading>
          <div class="text-center py-4">
            <i class="pi pi-spin pi-spinner text-primary text-3xl mb-2"></i>
            <p>Đang tải dữ liệu...</p>
          </div>
        </template>
      </DataTable>
      
      <CreateForm v-model:modelValue="form.visible" :data="form.data" @refreshList="fetchOrders" />
    </div>
  </template>