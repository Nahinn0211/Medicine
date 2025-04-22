<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import { useToast } from 'primevue/usetoast';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import Toast from 'primevue/toast';
  import ConfirmDialog from 'primevue/confirmdialog';
  import VoucherForm from './Create.vue';
  import { 
    VoucherService, 
    VOUCHER_DEFAULTS, 
    normalizeVoucherData 
  } from '@admin/stores/admin/Voucher';
  
  // Composables
  const confirm = useConfirm();
  const toast = useToast();
  
  // Reactive state
  const vouchers = ref([]);
  const selectedVouchers = ref([]);
  const isLoading = ref(false);
  const form = ref({ 
    visible: false, 
    data: { ...VOUCHER_DEFAULTS }
  });
  
  // Các trạng thái UI của voucher
  const VOUCHER_UI_STATUS = {
    UPCOMING: { label: 'Sắp bắt đầu', class: 'bg-blue-100 text-blue-800' },
    ENDED: { label: 'Đã kết thúc', class: 'bg-gray-100 text-gray-800' },
    OUT_OF_STOCK: { label: 'Hết lượt dùng', class: 'bg-red-100 text-red-800' },
    ACTIVE: { label: 'Đang hoạt động', class: 'bg-green-100 text-green-800' }
  };
  
  // Computed
  const hasSelectedVouchers = computed(() => selectedVouchers.value.length > 0);
  
  // Methods
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
  
  const fetchVouchers = async () => {
    try {
      isLoading.value = true;
      const response = await VoucherService.getVouchers();
      
      if (Array.isArray(response.data)) {
        vouchers.value = response.data;
      } else {
        console.error('Dữ liệu voucher không phải là mảng:', response.data);
        vouchers.value = [];
        showToast('warn', 'Cảnh báo', 'Dữ liệu voucher không đúng định dạng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu voucher:', error);
      showToast('error', 'Lỗi', 'Không thể tải danh sách voucher');
    } finally {
      isLoading.value = false;
    }
  };
  
  const openForm = async (data = null) => {
    if (data && data.id) {
      try {
        const response = await VoucherService.getVoucherById(data.id);
        form.value = {
          visible: true,
          data: normalizeVoucherData(response.data)
        };
      } catch (error) {
        console.error('Lỗi khi lấy thông tin voucher:', error);
        showToast('error', 'Lỗi', 'Không thể tải thông tin voucher');
      }
    } else {
      form.value = {
        visible: true,
        data: { ...VOUCHER_DEFAULTS }
      };
    }
  };
  
  const deleteVoucher = (id) => {
    showConfirmDialog(
      'Bạn có chắc chắn muốn xóa voucher này không?',
      async () => {
        try {
          await VoucherService.deleteVouchers([id]);
          showToast('success', 'Thành công', 'Đã xóa voucher');
          fetchVouchers();
        } catch (error) {
          console.error('Lỗi khi xóa voucher:', error);
          showToast('error', 'Lỗi', 'Không thể xóa voucher');
        }
      }
    );
  };
  
  const deleteSelectedVouchers = () => {
    if (!hasSelectedVouchers.value) {
      showToast('warn', 'Cảnh báo', 'Chưa chọn voucher để xóa');
      return;
    }
    
    showConfirmDialog(
      'Bạn có chắc chắn muốn xóa các voucher đã chọn không?',
      async () => {
        try {
          const ids = selectedVouchers.value.map(voucher => voucher.id);
          await VoucherService.deleteVouchers(ids);
          showToast('success', 'Thành công', `Đã xóa ${selectedVouchers.value.length} voucher`);
          fetchVouchers();
          selectedVouchers.value = [];
        } catch (error) {
          console.error('Lỗi khi xóa nhiều voucher:', error);
          showToast('error', 'Lỗi', 'Không thể xóa các voucher đã chọn');
        }
      }
    );
  };
  
  const getVoucherStatus = (voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);
    
    if (now < startDate) {
      return VOUCHER_UI_STATUS.UPCOMING;
    } else if (now > endDate) {
      return VOUCHER_UI_STATUS.ENDED;
    } else if (voucher.stock <= 0) {
      return VOUCHER_UI_STATUS.OUT_OF_STOCK;
    } else {
      return VOUCHER_UI_STATUS.ACTIVE;
    }
  };
  
  // Helper functions
  const showToast = (severity, summary, detail, life = 3000) => {
    toast.add({ severity, summary, detail, life });
  };
  
  const showConfirmDialog = (message, onAccept) => {
    confirm.require({
      message,
      header: 'Xác nhận',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptClass: 'p-button-danger',
      accept: onAccept
    });
  };
  
  // Lifecycle hooks
  onMounted(() => {
    fetchVouchers();
  });
  </script>
  
  <template>
    <div class="card">
      <Toast />
      <ConfirmDialog />
      
      <DataTable
        v-model:selection="selectedVouchers"
        :value="vouchers"
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
            <span class="font-semibold text-xl">Quản lý voucher</span>
            <div class="flex gap-2">
              <Button
                v-if="hasSelectedVouchers"
                label="Xóa các mục đã chọn"
                icon="pi pi-trash"
                severity="danger"
                @click="deleteSelectedVouchers"
              />
              <Button label="Thêm voucher" icon="pi pi-plus" @click="openForm()" />
            </div>
          </div>
        </template>
        
        <!-- Cột chọn nhiều dòng -->
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        
        <!-- Cột ID -->
        <Column field="id" header="ID" sortable style="min-width: 5rem"></Column>
        
        <!-- Cột mã voucher -->
        <Column field="code" header="Mã voucher" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.code }}</span>
          </template>
        </Column>
        
        <!-- Cột phần trăm giảm giá -->
        <Column field="voucherPercentage" header="Giảm giá (%)" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.voucherPercentage }}%</span>
          </template>
        </Column>
        
        <!-- Cột số lượng còn lại -->
        <Column field="stock" header="Số lượng còn lại" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span :class="data.stock <= 0 ? 'text-red-500 font-semibold' : 'font-semibold'">
              {{ data.stock }}
            </span>
          </template>
        </Column>
        
        <!-- Cột trạng thái -->
        <Column header="Trạng thái" style="min-width: 10rem">
          <template #body="{ data }">
            <span :class="`px-2 py-1 rounded-full text-xs font-semibold ${getVoucherStatus(data).class}`">
              {{ getVoucherStatus(data).label }}
            </span>
          </template>
        </Column>
        
        <!-- Cột thời gian hiệu lực -->
        <Column header="Thời gian hiệu lực" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <div class="flex flex-col">
              <div><span class="font-semibold">Bắt đầu:</span> {{ formatDate(data.startDate) }}</div>
              <div><span class="font-semibold">Kết thúc:</span> {{ formatDate(data.endDate) }}</div>
            </div>
          </template>
        </Column>
        
        <!-- Cột tác vụ -->
        <Column header="Tác vụ" :exportable="false" style="min-width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" rounded outlined @click="openForm(data)" />
              <Button icon="pi pi-trash" rounded outlined severity="danger" @click="deleteVoucher(data.id)" />
            </div>
          </template>
        </Column>
        
        <!-- Template khi không có dữ liệu -->
        <template #empty>
          <div class="text-center py-4">
            <i class="pi pi-search text-gray-400 text-3xl mb-2"></i>
            <p>Không tìm thấy voucher nào.</p>
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
      
      <VoucherForm v-model="form.visible" :data="form.data" @refreshList="fetchVouchers" />
    </div>
  </template>