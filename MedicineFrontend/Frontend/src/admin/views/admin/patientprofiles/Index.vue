<script setup>
  import { ref, onMounted } from "vue";
  import DataTable from "primevue/datatable";
  import Column from "primevue/column";
  import Button from "primevue/button";
  import Toast from "primevue/toast";
  import ConfirmDialog from "primevue/confirmdialog";
  import Tag from "primevue/tag";
  import PatientProfileDetail from "./PatientProfileDetail.vue";
  import { UserService } from "@admin/stores/admin/User";
  import { 
    usePatientProfile,
    formatCurrency, 
    getUserAvatar 
  } from '@admin/stores/admin/PatientProfile';
 
  // Composables
  const {
    patientProfiles,
    selectedPatientProfiles,
    isLoading,
    usersWithProfiles,
    detailDialog,
    fetchPatientProfiles,
    openDetailDialog,
    toggleLockStatus
  } = usePatientProfile();
  
  // Danh sách người dùng
  const users = ref([]);
  
  // Fetch danh sách người dùng
  const fetchUsers = async () => {
    try {
      const response = await UserService.getUsers();
      if (Array.isArray(response.data)) {
        users.value = response.data.map((user) => ({
          id: user.id,
          name: user.fullName,
          email: user.email,
          avatar: user.avatar,
        }));
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    }
  };
  
  // Lifecycle hook
  onMounted(() => {
    fetchUsers();
    fetchPatientProfiles();
  });
  </script>
  
  <template>
    <div class="card">
      <Toast />
      <ConfirmDialog />
  
      <DataTable
        v-model:selection="selectedPatientProfiles"
        :value="patientProfiles"
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
            <span class="font-semibold text-xl">Quản lý hồ sơ bệnh nhân</span>
          </div>
        </template>
     
        <!-- Cột ID -->
        <Column field="id" header="ID" sortable style="min-width: 5rem"></Column>
  
        <!-- Cột bệnh nhân -->
        <Column
          field="userId"
          header="Bệnh nhân"
          sortable
          style="min-width: 14rem"
        >
          <template #body="{ data }">
            <div class="flex items-center" v-if="data.user">
              <img
                :src="getUserAvatar(data.user.avatar)"
                :alt="data.user.fullName"
                class="w-10 h-10 mr-2 object-cover rounded-full"
                @error="$event.target.src='https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'"
              />
              <div>
                <div class="font-semibold">{{ data.user.fullName }}</div>
                <div class="text-sm text-gray-500">{{ data.user.email }}</div>
              </div>
            </div>
            <div v-else>Không có thông tin</div>
          </template>
        </Column>
  
       
  
        <!-- Cột số dư tài khoản -->
        <Column
          field="accountBalance"
          header="Số dư tài khoản"
          sortable
          style="min-width: 12rem"
        >
          <template #body="{ data }">
            <span class="font-semibold">{{ formatCurrency(data.accountBalance) }}</span>
          </template>
        </Column>
        
        <!-- Cột trạng thái -->
        <Column
          field="isDeleted"
          header="Trạng thái"
          sortable
          style="min-width: 10rem"
        >
          <template #body="{ data }">
            <Tag
              :severity="data.isDeleted ? 'danger' : 'success'"
              :value="data.isDeleted ? 'Đã khóa' : 'Đang hoạt động'"
            />
          </template>
        </Column>
  
        <!-- Cột tác vụ -->
        <Column header="Tác vụ" :exportable="false" style="min-width: 12rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button 
                icon="pi pi-eye" 
                rounded
                outlined
                severity="info"
                tooltip="Xem chi tiết" 
                @click="openDetailDialog(data)"
              />
              
              <Button
                :icon="data.isDeleted ? 'pi pi-lock-open' : 'pi pi-lock'"
                rounded
                outlined
                :severity="data.isDeleted ? 'success' : 'warning'"
                @click="toggleLockStatus(data.id, data.isDeleted)"
                :title="data.isDeleted ? 'Mở khóa' : 'Khóa'"
              />
            </div>
          </template>
        </Column>
  
        <!-- Template khi không có dữ liệu -->
        <template #empty>
          <div class="text-center py-4">
            <i class="pi pi-search text-gray-400 text-3xl mb-2"></i>
            <p>Không tìm thấy hồ sơ bệnh nhân nào.</p>
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
  
      <!-- Dialog xem chi tiết hồ sơ bệnh nhân -->
      <PatientProfileDetail
        v-model:modelValue="detailDialog.visible"
        :data="detailDialog.data"
        @refreshList="fetchPatientProfiles"
      />
    </div>
  </template>
  
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
  </style>