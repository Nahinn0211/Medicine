<script setup>
  import { ref, onMounted } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import { useToast } from 'primevue/usetoast';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import Toast from 'primevue/toast';
  import ConfirmDialog from 'primevue/confirmdialog';
  import InputText from 'primevue/inputtext';
  import Dialog from 'primevue/dialog';
  import { Brands } from '@admin/stores/admin/Brands';
  
  // Composables
  const confirm = useConfirm();
  const toast = useToast();
  
  // Reactive state
  const brands = ref([]);
  const selectedBrands = ref([]);
  const isLoading = ref(false);
  
  // Form state
  const brandDialog = ref(false);
  const currentBrand = ref({
    id: null,
    name: '',
    image: ''
  });
  const isEditMode = ref(false);
  const submitted = ref(false);
  
  // Fetch brands
  const fetchBrands = async () => {
    try {
      isLoading.value = true;
      const response = await Brands.getBrands();
      
      // Kiểm tra cấu trúc phản hồi
      if (response && Array.isArray(response)) {
        brands.value = response;
      } else if (response && Array.isArray(response.data)) {
        brands.value = response.data;
      } else {
        console.error('Unexpected API response format:', response);
        brands.value = [];
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách thương hiệu',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  // Open dialog for adding/editing brand
  const openBrandDialog = (brand = null) => {
    submitted.value = false;
    
    if (brand) {
      // Edit mode
      currentBrand.value = { 
        id: brand.id, 
        name: brand.name, 
        image: brand.image 
      };
      isEditMode.value = true;
    } else {
      // Add mode
      currentBrand.value = { 
        id: null, 
        name: '', 
        image: '' 
      };
      isEditMode.value = false;
    }
    
    brandDialog.value = true;
  };
  
  // Validate form
  const validateForm = () => {
    submitted.value = true;
    
    if (!currentBrand.value.name.trim()) {
      toast.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập tên thương hiệu',
        life: 3000
      });
      return false;
    }
    
    return true;
  };
  
  // Save brand
  const saveBrand = async () => {
    if (!validateForm()) return;
    
    try {
      const formData = new FormData();
      
      // Thêm dữ liệu vào formData
      formData.append('id', currentBrand.value.id || '');
      formData.append('name', currentBrand.value.name);
      formData.append('image', currentBrand.value.image || '');
      
      await Brands.saveBrand(formData);
      
      // Show success message
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: isEditMode.value 
          ? 'Đã cập nhật thương hiệu' 
          : 'Đã thêm thương hiệu mới',
        life: 3000
      });
      
      // Refresh list and close dialog
      fetchBrands();
      brandDialog.value = false;
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu thương hiệu: ' + (error.response?.data?.message || error.message),
        life: 3000
      });
    }
  };
  
  // Delete single brand
  const deleteBrand = (brand) => {
    confirm.require({
      message: `Bạn có chắc chắn muốn xóa thương hiệu "${brand.name}" không?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        try {
          await Brands.deleteBrands([brand.id]);
          
          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã xóa thương hiệu',
            life: 3000
          });
          
          fetchBrands();
        } catch (error) {
          console.error('Error deleting brand:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa thương hiệu',
            life: 3000
          });
        }
      }
    });
  };
  
  // Delete multiple brands
  const deleteSelectedBrands = () => {
    if (selectedBrands.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Chưa chọn thương hiệu để xóa',
        life: 3000
      });
      return;
    }
    
    confirm.require({
      message: `Bạn có chắc chắn muốn xóa ${selectedBrands.value.length} thương hiệu đã chọn không?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        try {
          const ids = selectedBrands.value.map(brand => brand.id);
          await Brands.deleteBrands(ids);
          
          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xóa ${selectedBrands.value.length} thương hiệu`,
            life: 3000
          });
          
          fetchBrands();
          selectedBrands.value = [];
        } catch (error) {
          console.error('Error deleting brands:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa các thương hiệu đã chọn',
            life: 3000
          });
        }
      }
    });
  };
  
  // Lifecycle hook
  onMounted(() => {
    fetchBrands();
  });
  </script>
   <template>
    <div class="card">
      <Toast />
      <ConfirmDialog />
      
      <!-- Brands List -->
      <DataTable
        v-model:selection="selectedBrands"
        :value="brands"
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
            <span class="font-semibold text-xl">Quản lý Thương hiệu</span>
            <div class="flex gap-2">
              <Button
                v-if="selectedBrands.length > 0"
                label="Xóa các mục đã chọn"
                icon="pi pi-trash"
                severity="danger"
                @click="deleteSelectedBrands"
              />
              <Button 
                label="Thêm thương hiệu" 
                icon="pi pi-plus" 
                @click="openBrandDialog()" 
              />
            </div>
          </div>
        </template>
        
        <!-- Selection Column -->
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        
        <!-- ID Column -->
        <Column field="id" header="ID" sortable style="min-width: 5rem"></Column>
           <!-- Image Column -->
           <Column header="Ảnh" style="min-width: 10rem">
            <template #body="{ data }">
              <img
                :src="data.image || 'https://placehold.co/100x100/EEE/999?text=No+Image'"
                :alt="data.name"
                class="w-20 h-20 object-cover rounded-lg"
                @error="
                  $event.target.src =
                    'https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'
                "
              />
            </template>
          </Column>
        <!-- Name Column -->
        <Column field="name" header="Tên thương hiệu" sortable style="min-width: 12rem"></Column>
        
     
        
        <!-- Actions Column -->
        <Column header="Tác vụ" :exportable="false" style="min-width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button 
                icon="pi pi-pencil" 
                rounded 
                outlined 
                @click="openBrandDialog(data)" 
              />
              <Button 
                icon="pi pi-trash" 
                rounded 
                outlined 
                severity="danger" 
                @click="deleteBrand(data)" 
              />
            </div>
          </template>
        </Column>
        
        <!-- Empty Template -->
        <template #empty>
          <div class="text-center py-4">
            <i class="pi pi-search text-gray-400 text-3xl mb-2"></i>
            <p>Không tìm thấy thương hiệu nào.</p>
          </div>
        </template>
        
        <!-- Loading Template -->
        <template #loading>
          <div class="text-center py-4">
            <i class="pi pi-spin pi-spinner text-primary text-3xl mb-2"></i>
            <p>Đang tải dữ liệu...</p>
          </div>
        </template>
      </DataTable>
      
      <!-- Brand Dialog -->
      <Dialog 
        v-model:visible="brandDialog" 
        :header="isEditMode ? 'Cập nhật Thương hiệu' : 'Thêm Thương hiệu mới'"
        modal 
        class="p-fluid"
        :style="{ width: '450px' }"
      >
        <div class="field mb-4">
          <label for="name" class="font-semibold block mb-2">Tên thương hiệu</label>
          <InputText 
            id="name" 
            v-model="currentBrand.name" 
            required 
            autofocus 
            :class="{'p-invalid': submitted && !currentBrand.name}"
            placeholder="Nhập tên thương hiệu"
          />
          <small 
            v-if="submitted && !currentBrand.name" 
            class="p-error"
          >
            Tên thương hiệu là bắt buộc
          </small>
        </div>
        
        <div class="field mb-4">
          <label for="image" class="font-semibold block mb-2">Ảnh thương hiệu</label>
          <InputText 
            id="image" 
            v-model="currentBrand.image" 
            placeholder="Nhập URL ảnh thương hiệu"
          />
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button 
              label="Hủy" 
              icon="pi pi-times" 
              outlined
              @click="brandDialog = false"
            />
            <Button 
              :label="isEditMode ? 'Cập nhật' : 'Thêm mới'" 
              icon="pi pi-check"
              @click="saveBrand"
            />
          </div>
        </template>
      </Dialog>
    </div>
  </template>
  ```
  
  <style scoped>
  .card {
    padding: 1.5rem;
    border-radius: 0.5rem;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  :deep(.p-datatable-wrapper) {
    overflow-x: auto;
  }
  
  :deep(.p-datatable .p-datatable-header) {
    background: transparent;
    border: none;
    padding: 0 0 1rem 0;
  }
  
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    background: #f8f9fa;
    color: #343a40;
    font-weight: 600;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr) {
    transition: background-color 0.2s;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background: #f1f5f9;
  }
  
  :deep(.p-dialog-content) {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }
  </style>