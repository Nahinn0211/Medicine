<!-- src/views/admin/doctor-profiles/CreateDoctorProfile.vue -->
<script setup>
  import { ref, computed, defineProps, defineEmits, onMounted } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import FormDialog from '@admin/components/FormDialog.vue';
  import InputText from 'primevue/inputtext';
  import InputNumber from 'primevue/inputnumber';
  import Dropdown from 'primevue/dropdown';
  import { DoctorProfileService } from '@admin/stores/admin/DoctorProfile';
  import { UserService } from '@admin/stores/admin/User';
  
  const props = defineProps({
    modelValue: Boolean,
    data: {
      type: Object,
      default: () => ({
        id: 0,
        userId: 0,
        experience: '',
        specialization: '',
        workplace: '',
        accountBalance: 0
      })
    }
  });
  
  const emit = defineEmits(['update:modelValue', 'refreshList']);
  
  const formVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });
  
  const isSubmitting = ref(false);
  const toast = useToast();
  const users = ref([]);
  const isEditMode = computed(() => props.data.id !== 0);
  
  // Fetch danh sách người dùng
  const fetchUsers = async () => {
    try {
      const response = await UserService.getUsers();
      users.value = response.data.map(user => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        avatar: user.avatar
      }));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lấy danh sách người dùng',
        life: 3000
      });
    }
  };
  
  onMounted(() => {
    fetchUsers();
  });
  
  const validateForm = () => {
    const errors = [];
    
    if (!props.data.userId) {
      errors.push('Vui lòng chọn bác sĩ');
    }
    
    if (!props.data.specialization || props.data.specialization.trim() === '') {
      errors.push('Vui lòng nhập chuyên khoa');
    }
    
    if (errors.length > 0) {
      errors.forEach(error => {
        toast.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: error,
          life: 3000
        });
      });
      return false;
    }
    
    return true;
  };
  
  const closeForm = () => {
    formVisible.value = false;
  };
  
  const saveDoctorProfile = async () => {
    if (!validateForm()) return;
    
    try {
      isSubmitting.value = true;
      
      await DoctorProfileService.saveDoctorProfile({
        id: isEditMode.value ? props.data.id : undefined,
        userId: props.data.userId,
        experience: props.data.experience,
        specialization: props.data.specialization,
        workplace: props.data.workplace,
        accountBalance: props.data.accountBalance
      });
      
      toast.add({
        severity: 'success',
        summary: 'Thành Công',
        detail: isEditMode.value
          ? 'Đã cập nhật hồ sơ bác sĩ thành công'
          : 'Đã thêm hồ sơ bác sĩ thành công',
        life: 3000
      });
      
      emit('refreshList');
      closeForm();
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu hồ sơ bác sĩ: ' + (error.response?.data?.message || error.message),
        life: 3000
      });
      console.error('Lỗi khi lưu hồ sơ bác sĩ:', error);
    } finally {
      isSubmitting.value = false;
    }
  };
  
  // Xử lý URL avatar
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    
    return `http://localhost:8080/uploads/users/${avatar}`;
  };
  </script>
  
  <template>
    <FormDialog
      :visible="formVisible"
      :title="isEditMode ? 'Cập nhật hồ sơ bác sĩ' : 'Thêm hồ sơ bác sĩ mới'"
      :loading="isSubmitting"
      @save="saveDoctorProfile"
      @cancel="closeForm"
      @hide="closeForm"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1 w-full">
          <label for="userId" class="font-semibold">Bác sĩ:</label>
          <Dropdown
            id="userId"
            v-model="props.data.userId"
            :options="users"
            optionLabel="name"
            optionValue="id"
            placeholder="Chọn bác sĩ"
            class="w-full"
          >
            <template #option="slotProps">
              <div class="flex items-center">
                <img 
                  :src="getAvatarUrl(slotProps.option.avatar) || 'https://placehold.co/100x100/EEE/999?text=No+Avatar'" 
                  :alt="slotProps.option.name"
                  class="w-8 h-8 mr-2 object-cover rounded-full"
                  @error="$event.target.src='https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'"
                />
                <div>
                  <div>{{ slotProps.option.name }}</div>
                  <div class="text-sm text-gray-500">{{ slotProps.option.email }}</div>
                </div>
              </div>
            </template>
            <template #value="slotProps">
              <div class="flex items-center" v-if="slotProps.value">
                <img 
                  :src="getAvatarUrl(users.find(u => u.id === slotProps.value)?.avatar) || 'https://placehold.co/100x100/EEE/999?text=No+Avatar'" 
                  :alt="users.find(u => u.id === slotProps.value)?.name"
                  class="w-6 h-6 mr-2 object-cover rounded-full"
                  @error="$event.target.src='https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'"
                />
                <div>{{ users.find(u => u.id === slotProps.value)?.name }}</div>
              </div>
              <span v-else>Chọn bác sĩ</span>
            </template>
          </Dropdown>
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="specialization" class="font-semibold">Chuyên khoa:</label>
          <InputText
            id="specialization"
            v-model="props.data.specialization"
            placeholder="Nhập chuyên khoa"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="experience" class="font-semibold">Kinh nghiệm:</label>
          <InputText
            id="experience"
            v-model="props.data.experience"
            placeholder="Nhập kinh nghiệm"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="workplace" class="font-semibold">Nơi làm việc:</label>
          <InputText
            id="workplace"
            v-model="props.data.workplace"
            placeholder="Nhập nơi làm việc"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="accountBalance" class="font-semibold">Số dư tài khoản:</label>
          <InputNumber
            id="accountBalance"
            v-model="props.data.accountBalance"
            placeholder="Nhập số dư tài khoản"
            mode="currency"
            currency="VND"
            locale="vi-VN"
            class="w-full"
          />
        </div>
      </div>
    </FormDialog>
  </template>