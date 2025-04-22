<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import { useToast } from 'primevue/usetoast';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import Toast from 'primevue/toast';
  import ConfirmDialog from 'primevue/confirmdialog';
  import CreateForm from './Create.vue';
  import { 
    RoleService, 
    ROLE_DEFAULTS 
  } from '@admin/stores/admin/Role';
  
   const confirm = useConfirm();
  const toast = useToast();
  
   const roles = ref([]);
  const selectedRoles = ref([]);
  const isLoading = ref(false);
  const form = ref({ 
    visible: false, 
    data: { ...ROLE_DEFAULTS } 
  });
  
   const hasSelectedRoles = computed(() => selectedRoles.value.length > 0);
  
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
  
   const fetchRoles = async () => {
    try {
      isLoading.value = true;
      const response = await RoleService.getRoles();
      
      if (Array.isArray(response.data)) {
        roles.value = response.data;
      } else {
        console.error('Dữ liệu vai trò không phải là mảng:', response.data);
        roles.value = [];
        showToast('warn', 'Cảnh báo', 'Dữ liệu vai trò không đúng định dạng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu vai trò:', error);
      showToast('error', 'Lỗi', 'Không thể tải danh sách vai trò');
    } finally {
      isLoading.value = false;
    }
  };
  
   const openForm = async (data = null) => {
    if (data && data.id) {
      try {
        // Nếu có id, gọi API lấy chi tiết vai trò để edit
        const response = await RoleService.getRoleById(data.id);
        form.value = {
          visible: true,
          data: { ...response.data }
        };
      } catch (error) {
        console.error('Lỗi khi lấy thông tin vai trò:', error);
        showToast('error', 'Lỗi', 'Không thể tải thông tin vai trò');
      }
    } else {
      form.value = {
        visible: true,
        data: { ...ROLE_DEFAULTS }
      };
    }
  };
  
  // Hàm xóa vai trò
  const deleteRole = (id) => {
    showConfirmDialog(
      'Bạn có chắc chắn muốn xóa vai trò này không?',
      async () => {
        try {
          await RoleService.deleteRoles([id]);
          showToast('success', 'Thành công', 'Đã xóa vai trò');
          fetchRoles();
        } catch (error) {
          console.error('Lỗi khi xóa vai trò:', error);
          showToast('error', 'Lỗi', 'Không thể xóa vai trò');
        }
      }
    );
  };
  
  // Hàm xóa nhiều vai trò được chọn
  const deleteSelectedRoles = () => {
    if (!hasSelectedRoles.value) {
      showToast('warn', 'Cảnh báo', 'Chưa chọn vai trò để xóa');
      return;
    }
    
    showConfirmDialog(
      'Bạn có chắc chắn muốn xóa các vai trò đã chọn không?',
      async () => {
        try {
          const ids = selectedRoles.value.map(role => role.id);
          await RoleService.deleteRoles(ids);
          
          showToast('success', 'Thành công', `Đã xóa ${selectedRoles.value.length} vai trò`);
          fetchRoles();
          selectedRoles.value = [];
        } catch (error) {
          console.error('Lỗi khi xóa nhiều vai trò:', error);
          showToast('error', 'Lỗi', 'Không thể xóa các vai trò đã chọn');
        }
      }
    );
  };
  
  // Lifecycle hooks
  onMounted(() => {
    fetchRoles();
  });
  </script>
  
  <template>
    <div class="card">
      <Toast />
      <ConfirmDialog />
      
      <DataTable
        v-model:selection="selectedRoles"
        :value="roles"
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
            <span class="font-semibold text-xl">Quản lý vai trò</span>
            <div class="flex gap-2">
              <Button
                v-if="hasSelectedRoles"
                label="Xóa các mục đã chọn"
                icon="pi pi-trash"
                severity="danger"
                @click="deleteSelectedRoles"
              />
              <Button label="Thêm vai trò" icon="pi pi-plus" @click="openForm()" />
            </div>
          </div>
        </template>
        
         <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        
         <Column field="id" header="ID" sortable style="min-width: 5rem"></Column>
        
         <Column field="name" header="Tên vai trò" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.name }}</span>
          </template>
        </Column>
        
         <Column header="Tác vụ" :exportable="false" style="min-width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" rounded outlined @click="openForm(data)" />
              <Button icon="pi pi-trash" rounded outlined severity="danger" @click="deleteRole(data.id)" />
            </div>
          </template>
        </Column>
        
         <template #empty>
          <div class="text-center py-4">
            <i class="pi pi-search text-gray-400 text-3xl mb-2"></i>
            <p>Không tìm thấy vai trò nào.</p>
          </div>
        </template>
        
         <template #loading>
          <div class="text-center py-4">
            <i class="pi pi-spin pi-spinner text-primary text-3xl mb-2"></i>
            <p>Đang tải dữ liệu...</p>
          </div>
        </template>
      </DataTable>
      
      <CreateForm v-model="form.visible" :data="form.data" @refreshList="fetchRoles" />
    </div>
  </template>