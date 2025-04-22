<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import { useToast } from 'primevue/usetoast';
  import CreateForm from './Create.vue';
  import { Medicines } from '@admin/stores/admin/Medicines';
  import { MedicineMediaService } from '@admin/stores/admin/MedicineMedia';
  import { Attributes } from '@admin/stores/admin/AttributeService';


  const confirm = useConfirm();
  const toast = useToast();
  const medicines = ref([]);
  const selectedMedicines = ref([]);
  const isLoading = ref(false);
  const medicineImages = ref({}); // Lưu trữ ảnh theo ID thuốc
  
  const form = ref({
    visible: false,
    data: {
        id: 0,
        code: '',
        name: '',
        brandId: null,
        origin: '',
        manufacturer: '',
        banner: ''
    }
  });

  const columns = ref([
    { field: 'name', label: 'Tên thuốc', visible: true },
    { field: 'banner', label: 'Hình ảnh', visible: true },
    { field: 'code', label: 'Mã thuốc', visible: true },
    { field: 'origin', label: 'Xuất xứ', visible: true }
   ]);
  
  // Hàm lấy ảnh chính cho thuốc
  const fetchMedicineImage = async (medicineId) => {
    try {
      const response = await MedicineMediaService.getMainImageByMedicineId(medicineId);
      if (response.data && response.data.mediaUrl) {
        // Lưu đường dẫn ảnh từ mediaUrl
        medicineImages.value[medicineId] = response.data.mediaUrl;
      }
    } catch (error) {
      console.error(`Lỗi khi lấy ảnh cho thuốc ID ${medicineId}:`, error);
    }
  };
  
  // Hàm lấy danh sách thuốc
  const fetchMedicines = async () => {
    try {
      isLoading.value = true;
      const response = await Medicines.getMedicines();
      medicines.value = response.data;
      
      // Lấy ảnh chính cho mỗi thuốc
      for (const medicine of medicines.value) {
        if (medicine.id) {
          await fetchMedicineImage(medicine.id);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu medicines:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách thuốc',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  // Gọi API khi component được tạo
  onMounted(fetchMedicines);
  
  // Mở form thêm hoặc sửa thuốc
  const openForm = async (data = null) => {
    if (data) {
        form.value.data = { ...data };
    } else {
        form.value.data = {
            id: 0,
            code: '',
            name: '',
            brandId: null,
            origin: '',
            manufacturer: '',
            banner: ''
        };
    }
    form.value.visible = true;
  };
  
  // Xác nhận xóa thuốc
  const confirmDelete = (ids) => {
    // Nếu ids là một số, chuyển thành mảng
    const deleteIds = Array.isArray(ids) ? ids : [ids];
    
    confirm.require({
      message: `Bạn có chắc chắn muốn xóa ${deleteIds.length > 1 ? deleteIds.length + ' bản ghi' : 'bản ghi này'} không?`,
      header: 'Xác nhận',
      icon: 'pi pi-info-circle',
      accept: async () => {
        try {
          isLoading.value = true;
          await Medicines.deleteMedicines(deleteIds);
          fetchMedicines();
          
          // Reset selected medicines after deletion
          selectedMedicines.value = [];
          
          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xóa ${deleteIds.length > 1 ? deleteIds.length + ' thuốc' : 'thuốc'} thành công`,
            life: 3000
          });
        } catch (error) {
          console.error('Lỗi khi xóa thuốc:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa thuốc',
            life: 3000
          });
        } finally {
          isLoading.value = false;
        }
      }
    });
  };
  
  // Xử lý lỗi khi tải ảnh
  const handleImageError = (event) => {
    event.target.src = 'https://placehold.co/80x80/EEE/999?text=Không+có+ảnh';
  };
  
  // Lấy URL ảnh cho thuốc dựa vào ID
  const getMedicineImageUrl = (medicineId) => {
    return medicineImages.value[medicineId] || 'https://placehold.co/80x80/EEE/999?text=Không+có+ảnh';
  };

  // Kiểm tra xem có thuốc nào được chọn để xóa không
  const isDeleteButtonDisabled = computed(() => {
    return selectedMedicines.value.length === 0;
  });
</script>
    
<template>
  <div class="card">
    <ConfirmDialog />
    <Toast />

    <DataTable 
      v-model:selection="selectedMedicines" 
      :value="medicines" 
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
          <span class="font-semibold text-xl">Danh sách Thuốc</span>
          <div class="flex gap-2">
            <Button 
              label="Xóa" 
              icon="pi pi-trash" 
              severity="danger" 
              :disabled="isDeleteButtonDisabled"
              @click="confirmDelete(selectedMedicines.map(m => m.id))" 
            />
            <Button label="Thêm Thuốc" icon="pi pi-plus" @click="openForm" />
          </div>
        </div>
      </template>

      <!-- Cột chọn nhiều dòng -->
      <Column selectionMode="multiple" style="width: 3rem"></Column>

      <!-- Duyệt qua tất cả các cột để hiển thị -->
      <Column v-for="col in columns.filter(c => c.visible)" :key="col.field" :field="col.field" :header="col.label" sortable>
        <template #body="{ data }">
          <div v-if="col.field === 'banner'" class="image-container">
            <img 
              :src="getMedicineImageUrl(data.id)" 
              alt="Hình ảnh thuốc" 
              class="medicine-image"
              @error="handleImageError"
            />
          </div>
          <span v-else>
            {{ data[col.field] || '---' }}
          </span>
        </template>
      </Column>

      <!-- Cột Tác vụ -->
      <Column header="Tác vụ" style="width: 10rem">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" class="mr-2" @click="openForm(data)" />
          <Button icon="pi pi-trash" outlined severity="danger" @click="confirmDelete(data.id)" />
        </template>
      </Column>
    </DataTable>

    <!-- Popup thêm thuốc -->
    <CreateForm v-model:modelValue="form.visible" :data="form.data" @refreshList="fetchMedicines" />
  </div>
</template>

<style scoped>
.card {
  padding: 1rem;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.medicine-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  transition: transform 0.2s;
}

.medicine-image:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
</style>