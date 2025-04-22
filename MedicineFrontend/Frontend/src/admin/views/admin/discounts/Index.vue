<!-- src/views/admin/discounts/List.vue -->
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
    import { DiscountService } from '@admin/stores/admin/Discount';
    import { Medicines } from '@admin/stores/admin/Medicines';
    
    const confirm = useConfirm();
    const toast = useToast();
    const discounts = ref([]);
    const selectedDiscounts = ref([]);
    const medicineMap = ref({}); // Sử dụng map để lưu trữ thông tin thuốc theo ID
    const isLoading = ref(false);
    
    // Trạng thái form
    const form = ref({ 
      visible: false, 
      data: {
        id: 0,
        code: '',
        name: '',
        medicineId: 0,
        discountPercentage: 0,
        startDate: null,
        endDate: null
      } 
    });
    
    // Format ngày tháng
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
    
    // Hàm lấy danh sách thuốc
    const fetchMedicines = async () => {
      try {
        const response = await Medicines.getMedicines();
        
        // Tạo map từ ID thuốc sang thông tin thuốc
        medicineMap.value = {};
        if (Array.isArray(response.data)) {
          response.data.forEach(medicine => {
            medicineMap.value[medicine.id] = {
              id: medicine.id,
              name: medicine.name || `Thuốc #${medicine.id}`,
              image: medicine.mediaUrl && medicine.mainImage ? medicine.mediaUrl : null
            };
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thuốc:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách thuốc',
          life: 3000
        });
      }
    };
    
    // Hàm lấy thông tin thuốc từ ID
    const getMedicineName = (medicineId) => {
      const medicine = medicineMap.value[medicineId];
      return medicine ? medicine.name : `ID: ${medicineId}`;
    };
    
    // Hàm lấy hình ảnh của thuốc (nếu có)
    const getMedicineImage = (medicineId) => {
      const medicine = medicineMap.value[medicineId];
      if (medicine) {
        return medicine.image || 'https://placehold.co/100x100/EEE/999?text=No+Image';
      }
      return 'https://placehold.co/100x100/EEE/999?text=No+Image';
    };
    
    // Hàm lấy danh sách giảm giá
    const fetchDiscounts = async () => {
      try {
        isLoading.value = true;
        const response = await DiscountService.getDiscounts();
        
        if (Array.isArray(response.data)) {
          discounts.value = response.data;
        } else {
          console.error('Dữ liệu giảm giá không phải là mảng:', response.data);
          discounts.value = [];
          toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Dữ liệu giảm giá không đúng định dạng',
            life: 3000
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu giảm giá:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách giảm giá',
          life: 3000
        });
      } finally {
        isLoading.value = false;
      }
    };
    
    // Gọi API khi component được tạo
    onMounted(() => {
      fetchMedicines();
      fetchDiscounts();
    });
    
    // Mở form thêm hoặc sửa giảm giá
    const openForm = async (data = null) => {
      if (data && data.id) {
        try {
          // Nếu có id, gọi API lấy chi tiết giảm giá để edit
          const response = await DiscountService.getDiscountById(data.id);
          form.value = {
            visible: true,
            data: { ...response.data }
          };
        } catch (error) {
          console.error('Lỗi khi lấy thông tin giảm giá:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải thông tin giảm giá',
            life: 3000
          });
        }
      } else {
        form.value = {
          visible: true,
          data: {
            id: 0,
            code: '',
            name: '',
            medicineId: 0,
            discountPercentage: 0,
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Mặc định 1 tháng
          }
        };
      }
    };
    
    // Hàm xóa giảm giá
    const deleteDiscount = (id) => {
      confirm.require({
        message: 'Bạn có chắc chắn muốn xóa giảm giá này không?',
        header: 'Xác nhận',
        icon: 'pi pi-info-circle',
        acceptLabel: 'Đồng ý',
        rejectLabel: 'Hủy',
        acceptClass: 'p-button-danger',
        accept: async () => {
          try {
            // Thay đổi theo cấu trúc API của bạn
            await DiscountService.deleteDiscounts([id]);
            
            // Thông báo thành công
            toast.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã xóa giảm giá',
              life: 3000
            });
            
            fetchDiscounts();
          } catch (error) {
            console.error('Lỗi khi xóa giảm giá:', error);
            toast.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể xóa giảm giá',
              life: 3000
            });
          }
        }
      });
    };
    
    // Hàm xóa nhiều giảm giá được chọn
    const deleteSelectedDiscounts = () => {
      if (selectedDiscounts.value.length === 0) {
        toast.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Chưa chọn giảm giá để xóa',
          life: 3000
        });
        return;
      }
      
      confirm.require({
        message: 'Bạn có chắc chắn muốn xóa các giảm giá đã chọn không?',
        header: 'Xác nhận',
        icon: 'pi pi-info-circle',
        acceptLabel: 'Đồng ý',
        rejectLabel: 'Hủy',
        acceptClass: 'p-button-danger',
        accept: async () => {
          try {
            // Sử dụng API xóa nhiều item
            const ids = selectedDiscounts.value.map(discount => discount.id);
            await DiscountService.deleteDiscounts(ids);
            
            // Thông báo thành công
            toast.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã xóa ${selectedDiscounts.value.length} giảm giá`,
              life: 3000
            });
            
            fetchDiscounts();
            selectedDiscounts.value = [];
          } catch (error) {
            console.error('Lỗi khi xóa nhiều giảm giá:', error);
            toast.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể xóa các giảm giá đã chọn',
              life: 3000
            });
          }
        }
      });
    };
    
    // Kiểm tra trạng thái của giảm giá (đã hết hạn, đang hoạt động, sắp bắt đầu)
    const getDiscountStatus = (discount) => {
      const now = new Date();
      const startDate = new Date(discount.startDate);
      const endDate = new Date(discount.endDate);
      
      if (now < startDate) {
        return { label: 'Sắp bắt đầu', class: 'bg-blue-100 text-blue-800' };
      } else if (now > endDate) {
        return { label: 'Đã kết thúc', class: 'bg-gray-100 text-gray-800' };
      } else {
        return { label: 'Đang hoạt động', class: 'bg-green-100 text-green-800' };
      }
    };
    </script>
    
    <template>
      <div class="card">
        <Toast />
        <ConfirmDialog />
        
        <DataTable
          v-model:selection="selectedDiscounts"
          :value="discounts"
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
              <span class="font-semibold text-xl">Quản lý giảm giá</span>
              <div class="flex gap-2">
                <Button
                  v-if="selectedDiscounts.length > 0"
                  label="Xóa các mục đã chọn"
                  icon="pi pi-trash"
                  severity="danger"
                  @click="deleteSelectedDiscounts"
                />
                <Button label="Thêm giảm giá" icon="pi pi-plus" @click="openForm()" />
              </div>
            </div>
          </template>
          
          <!-- Cột chọn nhiều dòng -->
          <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
          
          <!-- Cột ID -->
          <Column field="id" header="ID" sortable style="min-width: 5rem"></Column>
          
          <!-- Cột mã giảm giá -->
          <Column field="code" header="Mã giảm giá" sortable style="min-width: 10rem"></Column>
          
          <!-- Cột tên giảm giá -->
          <Column field="name" header="Tên giảm giá" sortable style="min-width: 14rem"></Column>
          
          <!-- Cột thuốc áp dụng -->
          <Column field="medicineId" header="Thuốc áp dụng" sortable style="min-width: 14rem">
            <template #body="{ data }">
              <div class="flex items-center">
                <img 
                  :src="getMedicineImage(data.medicineId)" 
                  :alt="getMedicineName(data.medicineId)"
                  class="w-10 h-10 mr-2 object-cover rounded"
                  @error="$event.target.src='https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'"
                />
                <span>{{ getMedicineName(data.medicineId) }}</span>
              </div>
            </template>
          </Column>
          
          <!-- Cột phần trăm giảm giá -->
          <Column field="discountPercentage" header="Giảm giá (%)" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="font-semibold">{{ data.discountPercentage }}%</span>
            </template>
          </Column>
          
          <!-- Cột trạng thái -->
          <Column header="Trạng thái" style="min-width: 10rem">
            <template #body="{ data }">
              <span :class="`px-2 py-1 rounded-full text-xs font-semibold ${getDiscountStatus(data).class}`">
                {{ getDiscountStatus(data).label }}
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
                <Button icon="pi pi-trash" rounded outlined severity="danger" @click="deleteDiscount(data.id)" />
              </div>
            </template>
          </Column>
          
          <!-- Template khi không có dữ liệu -->
          <template #empty>
            <div class="text-center py-4">
              <i class="pi pi-search text-gray-400 text-3xl mb-2"></i>
              <p>Không tìm thấy giảm giá nào.</p>
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
        
        <CreateForm v-model:modelValue="form.visible" :data="form.data" @refreshList="fetchDiscounts" />
      </div>
    </template>
    
    