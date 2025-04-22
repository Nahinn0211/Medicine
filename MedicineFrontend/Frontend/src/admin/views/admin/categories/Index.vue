<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import { useToast } from 'primevue/usetoast';
  import Toast from 'primevue/toast';
  import ConfirmDialog from 'primevue/confirmdialog';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import CreateForm from './Create.vue';
  import { Categories } from '@admin/stores/admin/Categories';
  
  // Composables
  const confirm = useConfirm();
  const toast = useToast();
  
  // Reactive state
  const categories = ref([]);
  const selectedCategories = ref([]);
  const isLoading = ref(false);
  const form = ref({ 
    visible: false, 
    data: { 
      name: '', 
      parentId: null,
      image: null
    } 
  });
  
  // Table columns configuration
  const columns = ref([
    { field: 'name', label: 'Tên danh mục', sortable: true },
    { field: 'parentId', label: 'Danh mục cha', sortable: true },
    { field: 'image', label: 'Ảnh', sortable: false }
  ]);
  
  // Computed properties
  const hasSelectedCategories = computed(() => selectedCategories.value.length > 0);
  
  // Fetch categories data
  const fetchCategories = async () => {
    try {
      isLoading.value = true;
      const response = await Categories.getCategories();
      categories.value = response.data;
    } catch (error) {
      showErrorToast('Không thể tải danh sách danh mục');
      console.error('Error fetching categories:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  // Initialize component
  onMounted(fetchCategories);
  
  // Open form to add or edit category
  const openForm = async (data = null) => {
    try {
      if (data?.id) {
        isLoading.value = true;
        const response = await Categories.getCategoryById(data.id);
        form.value = {
          visible: true,
          data: { ...response.data }
        };
      } else {
        form.value = {
          visible: true,
          data: { name: '', parentId: null, image: null }
        };
      }
    } catch (error) {
      showErrorToast('Không thể tải thông tin danh mục');
      console.error('Error loading category details:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  // Delete category(s)
  const handleDelete = (ids) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    const isMultiple = idsArray.length > 1;
    
    confirm.require({
      message: isMultiple 
        ? 'Bạn có chắc chắn muốn xóa các danh mục đã chọn không?' 
        : 'Bạn có chắc chắn muốn xóa danh mục này không?',
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        try {
          isLoading.value = true;
          await Categories.deleteCategories(idsArray);
          
          showSuccessToast(`Đã xóa ${idsArray.length} danh mục`);
          
          await fetchCategories();
          
          if (isMultiple) {
            selectedCategories.value = [];
          }
        } catch (error) {
          showErrorToast('Không thể xóa danh mục: ' + (error.response?.data || error.message));
          console.error('Error deleting categories:', error);
        } finally {
          isLoading.value = false;
        }
      }
    });
  };
  
  // Delete selected categories
  const deleteSelectedCategories = () => {
    if (!hasSelectedCategories.value) {
      showWarningToast('Chưa chọn danh mục để xóa');
      return;
    }
    
    const ids = selectedCategories.value.map(category => category.id);
    handleDelete(ids);
  };
  
  // Delete single category
  const deleteCategory = (id) => {
    handleDelete([id]);
  };
  
  // Find parent category name
  const findParentName = (parentId) => {
    if (!parentId) return 'Không có';
    const parentCategory = categories.value.find(cat => cat.id === parentId);
    return parentCategory ? parentCategory.name : 'Không có';
  };
  
  // Toast helpers
  const showSuccessToast = (message) => {
    toast.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: message, 
      life: 3000 
    });
  };
  
  const showErrorToast = (message) => {
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
  </script>
 <template>
  <div class="card p-4 bg-white rounded-lg shadow-sm">
    <Toast />
    <ConfirmDialog />
    
    <DataTable 
      v-model:selection="selectedCategories" 
      :value="categories" 
      dataKey="id" 
      :paginator="true"
      :rows="10" 
      :loading="isLoading"
      showCurrentPageReport
      currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} danh mục"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      responsiveLayout="scroll"
      stripedRows
      class="p-datatable-sm"
    >
      <!-- Header -->
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-800">Quản lý danh mục</h2>
          <div class="flex gap-2">
            <Button 
              v-if="hasSelectedCategories" 
              label="Xóa đã chọn" 
              icon="pi pi-trash" 
              severity="danger" 
              @click="deleteSelectedCategories"
            />
            <Button 
              label="Thêm danh mục" 
              icon="pi pi-plus" 
              @click="openForm()"
            />
          </div>
        </div>
      </template>
      
      <!-- Selection column -->
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      
      <!-- ID column -->
      <Column field="id" header="ID" sortable headerStyle="width: 5rem" />
       <!-- Image column -->
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
      <!-- Name column -->
      <Column field="name" header="Tên danh mục" sortable>
        <template #body="{ data }">
          <span class="font-medium">{{ data.name }}</span>
        </template>
      </Column>
      
     
      
      <!-- Parent category column -->
      <Column field="parentId" header="Danh mục cha" sortable>
        <template #body="{ data }">
          {{ findParentName(data.parentId) }}
        </template>
      </Column>
      
      <!-- Actions column -->
      <Column header="Thao tác" headerStyle="width: 8rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button 
              icon="pi pi-pencil" 
              outlined 
              size="small"
              aria-label="Chỉnh sửa"
              tooltip="Chỉnh sửa"
              @click="openForm(data)" 
            />
            <Button 
              icon="pi pi-trash" 
              outlined 
              severity="danger" 
              size="small"
              aria-label="Xóa"
              tooltip="Xóa"
              @click="deleteCategory(data.id)" 
            />
          </div>
        </template>
      </Column>
      
      <!-- Empty state -->
      <template #empty>
        <div class="text-center p-4">
          <i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i>
          <p>Không có danh mục nào.</p>
        </div>
      </template>
      
      <!-- Loading state -->
      <template #loading>
        <div class="text-center p-4">
          <i class="pi pi-spin pi-spinner text-blue-500 text-5xl mb-3"></i>
          <p>Đang tải dữ liệu...</p>
        </div>
      </template>
    </DataTable>
    
    <!-- Category form -->
    <CreateForm 
      v-model:modelValue="form.visible" 
      :data="form.data" 
      @refreshList="fetchCategories" 
    />
  </div>
</template>
```
  
  <style scoped>
  :deep(.p-datatable-header) {
    background-color: transparent;
    border: none;
    padding: 0.75rem 1rem;
  }
  
  :deep(.p-paginator) {
    padding: 0.75rem;
  }
  
  :deep(.p-column-title) {
    font-weight: 600;
  }
  </style>