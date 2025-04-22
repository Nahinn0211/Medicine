<script setup>
  import { ref, onMounted } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import CreateForm from './Create.vue';
  import { ListService } from '@admin/stores/admin/ListService'; 
  import { useToast } from 'primevue/usetoast';
  
  const confirm = useConfirm();  
  const toast = useToast();
  const services = ref([]);
  const selectedServices = ref([]);
  const form = ref({ visible: false, data: {} });
  
  
  const columns = ref([
    { field: 'name', label: 'Tên dịch vụ' },
    { field: 'description', label: 'Mô tả' },
    { field: 'price', label: 'Giá' },
     { field: 'createdAt', label: 'Ngày tạo' }, 
    { field: 'updatedAt', label: 'Ngày cập nhật' }  
  ]);
  
  
  const fetchServices = async () => {
    try {
      const response = await ListService.getServices();
      services.value = response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.add({
        severity: 'error', 
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách dịch vụ',
        life: 3000
      });
    }  
  };
  
  onMounted(fetchServices);
  
  const openForm = async (data = null) => {
    if (data && data.id) {
      try {
        const response = await ListService.getServicesById(data.id);
        form.value = {
          visible: true,
          data: { ...response.data }
        };  
      } catch (error) {
        console.error('Error fetching service details:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi', 
          detail: 'Không thể tải thông tin dịch vụ',
          life: 3000
        });
      }
    } else {  
      form.value = {
        visible: true,
        data: { name: '', price: null, unit: '' }
      };
    }
  };
  
   const handleDelete = (ids) => {
    // Hiển thị thông báo xác nhận tùy thuộc vào số lượng dịch vụ cần xóa
    const isMultiple = Array.isArray(ids) && ids.length > 1;
    
    confirm.require({
      message: isMultiple
        ? 'Bạn có chắc chắn muốn xóa các dịch vụ đã chọn không?'
        : 'Bạn có chắc chắn muốn xóa dịch vụ này không?',
      header: 'Xác nhận',
      icon: 'pi pi-info-circle',
      accept: async () => {
        try {
           await ListService.deleteServices(ids);
  
          // Hiển thị thông báo thành công
          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: isMultiple 
              ? `Đã xóa ${ids.length} dịch vụ` 
              : 'Đã xóa dịch vụ thành công',
            life: 3000
          });
  
          // Cập nhật lại danh sách
          fetchServices();
          
          // Nếu là xóa nhiều, reset danh sách đã chọn
          if (isMultiple) {
            selectedServices.value = [];
          }
        } catch (error) {
          console.error('Error deleting services:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa dịch vụ',
            life: 3000
          });
        }
      }
    });
  };
  
  // Hàm xử lý nút xóa từng dịch vụ
  const confirmDelete = (id) => {
    handleDelete([id]); // Luôn truyền mảng chứa một phần tử
  };
  
  // Hàm xử lý nút xóa nhiều dịch vụ
  const deleteSelectedServices = () => {
    if (selectedServices.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Chưa chọn dịch vụ để xóa',
        life: 3000 
      });
      return;
    }
    
    const ids = selectedServices.value.map(service => service.id);
    handleDelete(ids);
  };
  
  
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
  </script>
  
  <template>
    <div class="card">
      <Toast />
      <ConfirmDialog /> 
      
      <DataTable
        v-model:selection="selectedServices" 
        :value="services"
        dataKey="id"
        :paginator="true"
        :rows="5"
        showCurrentPageReport 
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        :rowsPerPageOptions="[5, 10, 20, 50]"
      >
        <template #header>
          <div class="flex justify-between items-center"> 
            <span class="font-semibold text-xl">Danh sách dịch vụ</span>
            <div class="flex gap-2">
              <Button
                v-if="selectedServices.length > 0"
                label="Xóa các mục đã chọn"
                icon="pi pi-trash"
                severity="danger"  
                @click="deleteSelectedServices"
              />
              <Button label="Thêm dịch vụ" icon="pi pi-plus" @click="openForm()" />
            </div>  
          </div>
        </template>
        
        <Column selectionMode="multiple" style="width: 3rem"></Column>
        
        <Column field="id" header="ID" sortable style="width: 5rem"></Column>
        
        <Column v-for="col in columns" :key="col.field" :field="col.field" :header="col.label" sortable>
          <template #body="{ data }">  
            <span v-if="col.field === 'price'">
              {{ formatPrice(data[col.field]) }} 
            </span>
            <span v-else-if="col.field === 'createdAt' || col.field === 'updatedAt'">
              {{ formatDate(data[col.field]) }}
            </span> 
            <span v-else>
              {{ data[col.field] || '---' }}  
            </span>
          </template>
        </Column>
        
        <Column header="Tác vụ" style="width: 10rem">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" class="mr-2" @click="openForm(data)" />
            <Button icon="pi pi-trash" outlined severity="danger" @click="confirmDelete(data.id)" />   
          </template>
        </Column>
      </DataTable>
      
      <CreateForm v-model:modelValue="form.visible" :data="form.data" @refreshList="fetchServices" />
    </div>  
  </template>
  
  <style scoped>
  .card {
    padding: 1rem;
  }
  </style>