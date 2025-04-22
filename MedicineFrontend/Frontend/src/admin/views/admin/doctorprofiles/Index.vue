<!-- src/views/admin/doctor-profiles/DoctorProfileList.vue -->
<script setup>
    import { ref, onMounted } from 'vue';
    import { useConfirm } from 'primevue/useconfirm';
    import { useToast } from 'primevue/usetoast';
    import DataTable from 'primevue/datatable';
    import Column from 'primevue/column';
    import Button from 'primevue/button';
    import Toast from 'primevue/toast';
    import ConfirmDialog from 'primevue/confirmdialog';
    import CreateDoctorProfile from './Create.vue';
    import { DoctorProfileService } from '@admin/stores/admin/DoctorProfile';
    import { UserService } from '@admin/stores/admin/User';
    
    const confirm = useConfirm();
    const toast = useToast();
    const doctorProfiles = ref([]);
    const selectedDoctorProfiles = ref([]);
    const isLoading = ref(false);
    const userMap = ref({}); // Map userId -> user info
    
    // Trạng thái form
    const form = ref({ 
      visible: false, 
      data: {
        id: 0,
        userId: 0,
        experience: '',
        specialization: '',
        workplace: '',
        accountBalance: 0
      } 
    });
    
    // Format tiền tệ
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    };
    
    // Hàm lấy danh sách người dùng
    const fetchUsers = async () => {
      try {
        const response = await UserService.getUsers();
        userMap.value = {};
        
        if (Array.isArray(response.data)) {
          response.data.forEach(user => {
            userMap.value[user.id] = {
              id: user.id,
              name: user.fullName,
              email: user.email,
              avatar: user.avatar
            };
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
      }
    };
    
    // Hàm lấy thông tin người dùng từ ID
    const getUserName = (userId) => {
      const user = userMap.value[userId];
      return user ? user.name : `ID: ${userId}`;
    };
    
    // Hàm lấy avatar của người dùng từ ID
    const getUserAvatar = (userId) => {
      const user = userMap.value[userId];
      if (user && user.avatar) {
        if (user.avatar.startsWith('http')) {
          return user.avatar;
        }
        return `http://localhost:8080/uploads/users/${user.avatar}`;
      }
      return 'https://placehold.co/100x100/EEE/999?text=No+Avatar';
    };
    
    // Hàm lấy email của người dùng từ ID
    const getUserEmail = (userId) => {
      const user = userMap.value[userId];
      return user ? user.email : '';
    };
    
    // Hàm lấy danh sách hồ sơ bác sĩ
    const fetchDoctorProfiles = async () => {
      try {
        isLoading.value = true;
        const response = await DoctorProfileService.getDoctorProfiles();
        
        if (Array.isArray(response.data)) {
          doctorProfiles.value = response.data;
        } else {
          console.error('Dữ liệu hồ sơ bác sĩ không phải là mảng:', response.data);
          doctorProfiles.value = [];
          toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Dữ liệu hồ sơ bác sĩ không đúng định dạng',
            life: 3000
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu hồ sơ bác sĩ:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách hồ sơ bác sĩ',
          life: 3000
        });
      } finally {
        isLoading.value = false;
      }
    };
    
    // Gọi API khi component được tạo
    onMounted(() => {
      fetchUsers();
      fetchDoctorProfiles();
    });
    
    // Mở form thêm hoặc sửa hồ sơ bác sĩ
    const openForm = async (data = null) => {
      if (data && data.id) {
        try {
          // Nếu có id, gọi API lấy chi tiết hồ sơ bác sĩ để edit
          const response = await DoctorProfileService.getDoctorProfileById(data.id);
          form.value = {
            visible: true,
            data: { ...response.data }
          };
        } catch (error) {
          console.error('Lỗi khi lấy thông tin hồ sơ bác sĩ:', error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải thông tin hồ sơ bác sĩ',
            life: 3000
          });
        }
      } else {
        form.value = {
          visible: true,
          data: {
            id: 0,
            userId: 0,
            experience: '',
            specialization: '',
            workplace: '',
            accountBalance: 0
          }
        };
      }
    };
    
    // Hàm xóa hồ sơ bác sĩ
    const deleteDoctorProfile = (id) => {
      confirm.require({
        message: 'Bạn có chắc chắn muốn xóa hồ sơ bác sĩ này không?',
        header: 'Xác nhận',
        icon: 'pi pi-info-circle',
        acceptLabel: 'Đồng ý',
        rejectLabel: 'Hủy',
        acceptClass: 'p-button-danger',
        accept: async () => {
          try {
            // Gọi API xóa hồ sơ bác sĩ
            await DoctorProfileService.deleteDoctorProfile(id);
            
            // Thông báo thành công
            toast.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã xóa hồ sơ bác sĩ',
              life: 3000
            });
            
            fetchDoctorProfiles();
          } catch (error) {
            console.error('Lỗi khi xóa hồ sơ bác sĩ:', error);
            toast.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể xóa hồ sơ bác sĩ',
              life: 3000
            });
          }
        }
      });
    };
    
    // Hàm xóa nhiều hồ sơ bác sĩ được chọn
    const deleteSelectedDoctorProfiles = () => {
      if (selectedDoctorProfiles.value.length === 0) {
        toast.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Chưa chọn hồ sơ bác sĩ để xóa',
          life: 3000
        });
        return;
      }
      
      confirm.require({
        message: 'Bạn có chắc chắn muốn xóa các hồ sơ bác sĩ đã chọn không?',
        header: 'Xác nhận',
        icon: 'pi pi-info-circle',
        acceptLabel: 'Đồng ý',
        rejectLabel: 'Hủy',
        acceptClass: 'p-button-danger',
        accept: async () => {
          try {
            // Sử dụng API xóa nhiều item
            const ids = selectedDoctorProfiles.value.map(profile => profile.id);
            await DoctorProfileService.deleteDoctorProfiles(ids);
            
            // Thông báo thành công
            toast.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã xóa ${selectedDoctorProfiles.value.length} hồ sơ bác sĩ`,
              life: 3000
            });
            
            fetchDoctorProfiles();
            selectedDoctorProfiles.value = [];
          } catch (error) {
            console.error('Lỗi khi xóa nhiều hồ sơ bác sĩ:', error);
            toast.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể xóa các hồ sơ bác sĩ đã chọn',
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
          v-model:selection="selectedDoctorProfiles"
          :value="doctorProfiles"
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
              <span class="font-semibold text-xl">Quản lý hồ sơ bác sĩ</span>
              <div class="flex gap-2">
                <Button
                  v-if="selectedDoctorProfiles.length > 0"
                  label="Xóa các mục đã chọn"
                  icon="pi pi-trash"
                  severity="danger"
                  @click="deleteSelectedDoctorProfiles"
                />
                <Button label="Thêm hồ sơ bác sĩ" icon="pi pi-plus" @click="openForm()" />
              </div>
            </div>
          </template>
          
          <!-- Cột chọn nhiều dòng -->
          <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
          
          <!-- Cột ID -->
          <Column field="id" header="ID" sortable style="min-width: 5rem"></Column>
          
          <!-- Cột bác sĩ -->
          <Column field="userId" header="Bác sĩ" sortable style="min-width: 14rem">
            <template #body="{ data }">
              <div class="flex items-center">
                <img 
                  :src="getUserAvatar(data.userId)" 
                  :alt="getUserName(data.userId)"
                  class="w-10 h-10 mr-2 object-cover rounded-full"
                  @error="$event.target.src='https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'"
                />
                <div>
                  <div class="font-semibold">{{ getUserName(data.userId) }}</div>
                  <div class="text-sm text-gray-500">{{ getUserEmail(data.userId) }}</div>
                </div>
              </div>
            </template>
          </Column>
          
          <!-- Cột chuyên khoa -->
          <Column field="specialization" header="Chuyên khoa" sortable style="min-width: 12rem"></Column>
          
          <!-- Cột kinh nghiệm -->
          <Column field="experience" header="Kinh nghiệm" sortable style="min-width: 12rem"></Column>
          
          <!-- Cột nơi làm việc -->
          <Column field="workplace" header="Nơi làm việc" sortable style="min-width: 12rem"></Column>
          
          <!-- Cột số dư tài khoản -->
          <Column field="accountBalance" header="Số dư tài khoản" sortable style="min-width: 12rem">
            <template #body="{ data }">
              <span class="font-semibold">{{ formatCurrency(data.accountBalance) }}</span>
            </template>
          </Column>
          
          <!-- Cột tác vụ -->
          <Column header="Tác vụ" :exportable="false" style="min-width: 8rem">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined @click="openForm(data)" />
                <Button icon="pi pi-trash" rounded outlined severity="danger" @click="deleteDoctorProfile(data.id)" />
              </div>
            </template>
          </Column>
          
          <!-- Template khi không có dữ liệu -->
          <template #empty>
            <div class="text-center py-4">
              <i class="pi pi-search text-gray-400 text-3xl mb-2"></i>
              <p>Không tìm thấy hồ sơ bác sĩ nào.</p>
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
        
        <CreateDoctorProfile v-model:modelValue="form.visible" :data="form.data" @refreshList="fetchDoctorProfiles" />
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