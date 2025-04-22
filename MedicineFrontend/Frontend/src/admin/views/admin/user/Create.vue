<script setup>
  import { ref, computed, defineProps, defineEmits, watch, onMounted } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import FormDialog from '@admin/components/FormDialog.vue';
  import InputText from 'primevue/inputtext';
  import Dropdown from 'primevue/dropdown';
  import Password from 'primevue/password';
  import Checkbox from 'primevue/checkbox';
  import FileUpload from 'primevue/fileupload';
  import MultiSelect from 'primevue/multiselect';
  import { 
    UserService, 
    USER_DEFAULTS, 
    validateUserData,
    normalizeUserData
  } from '@admin/stores/admin/User';
  import { RoleService } from '@admin/stores/admin/Role';
  import { UserRoleService } from '@admin/stores/admin/UserRole';
  import { API_BASE_URL } from '@/config/apiConfig';
  
  const props = defineProps({
    modelValue: Boolean,
    data: {
      type: Object,
      default: () => ({ ...USER_DEFAULTS })
    }
  });
  
  const emit = defineEmits(['update:modelValue', 'refreshList']);
  
  // Computed properties
  const formVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });
  const isEditMode = computed(() => props.data.id !== 0);
  
  // Reactive state
  const isSubmitting = ref(false);
  const toast = useToast();
  const roles = ref([]);
  const selectedRoles = ref([]);
  const uploadedFile = ref(null);
  const uploadedFilePath = ref(null);
  const fileUpload = ref(null);
  const isDataLoaded = ref(false);
  
  // Fetch danh sách vai trò
  const fetchRoles = async () => {
    try {
      const response = await RoleService.getRoles();
      roles.value = response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vai trò:', error);
      showToast('error', 'Lỗi', 'Không thể lấy danh sách vai trò');
    }
  };
  
  // Fetch vai trò của người dùng
  const fetchUserRoles = async () => {
    if (isEditMode.value) {
      try {
        const response = await UserRoleService.getUserRolesByUserId(props.data.id);
        selectedRoles.value = response.data.map(userRole => userRole.roleId);
      } catch (error) {
        console.error('Lỗi khi lấy vai trò của người dùng:', error);
        showToast('error', 'Lỗi', 'Không thể lấy vai trò của người dùng');
      }
    } else {
      // Đặt vai trò mặc định cho người dùng mới (có thể là "USER")
      const defaultRoleId = await getDefaultRoleId();
      if (defaultRoleId) {
        selectedRoles.value = [defaultRoleId];
      }
    }
  };
  
  // Lấy ID của vai trò mặc định
  const getDefaultRoleId = async () => {
    try {
      const response = await RoleService.getRoleByName("USER");
      return response.data.id;
    } catch (error) {
      console.error('Lỗi khi lấy vai trò mặc định:', error);
      return null;
    }
  };
  
  // Thay đổi phần watch formVisible
  watch(formVisible, async (newVal) => {
    if (newVal) {
      // Reset trạng thái khi mở form
      isDataLoaded.value = false;
      
      // Load danh sách vai trò
      await fetchRoles();
      
      // Thiết lập vai trò đã chọn
      if (isEditMode.value) {
        if (props.data.roles && props.data.roles.length > 0) {
          // Lấy danh sách ID vai trò từ dữ liệu người dùng đã có
          selectedRoles.value = props.data.roles.map(role => role.id);
        } else {
          // Trường hợp không có dữ liệu vai trò trong props.data, gọi API
          await fetchUserRoles();
        }
      } else {
        // Đặt vai trò mặc định cho người dùng mới
        const defaultRoleId = await getDefaultRoleId();
        if (defaultRoleId) {
          selectedRoles.value = [defaultRoleId];
        }
      }
      
      isDataLoaded.value = true;
      
      // Xử lý hiển thị avatar nếu có
      if (isEditMode.value && props.data.avatar) {
        if (props.data.avatar.startsWith('http')) {
          uploadedFilePath.value = props.data.avatar;
        } else {
          uploadedFilePath.value = `${API_BASE_URL}/uploads/users/${props.data.avatar}`;
        }
      } else {
        uploadedFilePath.value = null;
      }
    } else {
      // Reset khi đóng form
      selectedRoles.value = [];
      uploadedFile.value = null;
      uploadedFilePath.value = null;
    }
  });
  
  // Cập nhật hàm loadAllData để phù hợp với logic mới
  const loadAllData = async () => {
    if (!isDataLoaded.value) {
      await fetchRoles();
      
      if (isEditMode.value && (!props.data.roles || props.data.roles.length === 0)) {
        await fetchUserRoles();
      } else if (isEditMode.value && props.data.roles && props.data.roles.length > 0) {
        selectedRoles.value = props.data.roles.map(role => role.id);
      } else {
        // Người dùng mới, đặt vai trò mặc định
        const defaultRoleId = await getDefaultRoleId();
        if (defaultRoleId) {
          selectedRoles.value = [defaultRoleId];
        }
      }
      
      isDataLoaded.value = true;
    }
  };
  
  // Helper function để hiển thị thông báo
  const showToast = (severity, summary, detail, life = 3000) => {
    toast.add({ severity, summary, detail, life });
  };
  
  // Hàm xác thực form
  const validateForm = () => {
    const errors = validateUserData(props.data, isEditMode.value);
    
    // Thêm kiểm tra riêng cho vai trò
    if (selectedRoles.value.length === 0) {
      errors.push('Vui lòng chọn ít nhất một vai trò');
    }
    
    if (errors.length > 0) {
      errors.forEach(error => {
        showToast('warn', 'Cảnh báo', error);
      });
      return false;
    }
    
    return true;
  };
  
  // Đóng form
  const closeForm = () => {
    uploadedFile.value = null;
    uploadedFilePath.value = null;
    formVisible.value = false;
  };
  
  // Xử lý file upload
  const onSelect = (event) => {
    if (event.files && event.files.length > 0) {
      uploadedFile.value = event.files[0];
      
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedFilePath.value = e.target.result;
      };
      reader.readAsDataURL(uploadedFile.value);
    }
  };
  
  const onUpload = (event) => {
    const [file] = event.files;
    uploadedFile.value = file;
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedFilePath.value = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    
    showToast('info', 'Thành công', 'Đã tải ảnh lên');
  };
  
  const onClear = () => {
    uploadedFilePath.value = null;
    uploadedFile.value = null;
  };
  
  // Lưu người dùng
  const saveUser = async () => {
    if (!validateForm()) return;
    
    try {
      isSubmitting.value = true;
      
      // Chuẩn bị dữ liệu người dùng theo UserDTO.SaveUserDTO format
      // Không bao gồm createdAt và updatedAt
      const userData = {
        id: props.data.id || 0,
        fullName: props.data.fullName,
        phone: props.data.phone || '',
        address: props.data.address || '',
        email: props.data.email,
        enabled: props.data.enabled === undefined ? true : props.data.enabled,
        locked: props.data.locked === undefined ? false : props.data.locked,
        countLock: props.data.countLock || 0
        // Không thêm createdAt và updatedAt
      };
      
      // Xử lý mật khẩu khác nhau cho người dùng mới và cập nhật
      if (!isEditMode.value) {
        userData.password = props.data.password;
      } else if (props.data.password && props.data.password.trim() !== '') {
        userData.password = props.data.password;
      }
      
      let response;
      
      if (uploadedFile.value) {
        // Với avatar file - Chuẩn bị FormData đúng định dạng theo API
        const formData = new FormData();
        
        // Chuyển đổi user object thành JSON string
        formData.append('user', JSON.stringify(userData));
        
        // Thêm file
        formData.append('file', uploadedFile.value);
        
        // Thêm danh sách vai trò
        selectedRoles.value.forEach(roleId => {
          formData.append('roleIds[]', roleId);
        });
        
        response = await UserService.saveUserWithAvatar(formData);
      } else {
        // Không có avatar file - Gửi dữ liệu JSON
        const payload = {
          user: userData,
          roleIds: selectedRoles.value
        };
        
        response = await UserService.saveUser(payload);
      }
      
      showToast(
        'success',
        'Thành công',
        isEditMode.value
          ? 'Cập nhật người dùng thành công'
          : 'Thêm người dùng mới thành công'
      );
      
      emit('refreshList');
      closeForm();
    } catch (error) {
      console.error('Lỗi khi lưu người dùng:', error);
      showToast(
        'error',
        'Lỗi',
        'Không thể lưu người dùng: ' + 
        (error.response?.data?.error || error.response?.data?.message || error.message)
      );
    } finally {
      isSubmitting.value = false;
    }
  };
  </script>
  
  <template>
    <FormDialog
      :visible="formVisible"
      :title="isEditMode ? 'Cập nhật người dùng' : 'Thêm người dùng mới'"
      :loading="isSubmitting"
      @save="saveUser"
      @cancel="closeForm"
      @hide="closeForm"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-4 md:flex-row">
          <div class="flex flex-col gap-1 w-full md:w-1/2">
            <label for="fullName" class="font-semibold">Họ và tên: <span class="text-red-500">*</span></label>
            <InputText
              id="fullName"
              v-model="props.data.fullName"
              placeholder="Nhập họ và tên"
              class="w-full"
            />
          </div>
          
          <div class="flex flex-col gap-1 w-full md:w-1/2">
            <label for="email" class="font-semibold">Email: <span class="text-red-500">*</span></label>
            <InputText
              id="email"
              v-model="props.data.email"
              placeholder="Nhập địa chỉ email"
              type="email"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="flex flex-col gap-4 md:flex-row">
          <div class="flex flex-col gap-1 w-full md:w-1/2">
            <label for="phone" class="font-semibold">Số điện thoại:</label>
            <InputText
              id="phone"
              v-model="props.data.phone"
              placeholder="Nhập số điện thoại"
              class="w-full"
            />
          </div>
          
          <div class="flex flex-col gap-1 w-full md:w-1/2">
            <label for="password" class="font-semibold">
              Mật khẩu: <span v-if="!isEditMode" class="text-red-500">*</span>
              <span v-if="isEditMode" class="text-sm text-gray-500">(Để trống nếu không thay đổi)</span>
            </label>
            <Password
              id="password"
              v-model="props.data.password"
              placeholder="Nhập mật khẩu"
              :feedback="false"
              toggleMask
              class="w-full"
            />
          </div>
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="address" class="font-semibold">Địa chỉ:</label>
          <InputText
            id="address"
            v-model="props.data.address"
            placeholder="Nhập địa chỉ"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="roles" class="font-semibold">Vai trò: <span class="text-red-500">*</span></label>
          <MultiSelect
            id="roles"
            v-model="selectedRoles"
            :options="roles"
            optionLabel="name"
            optionValue="id"
            placeholder="Chọn vai trò"
            class="w-full"
            :loading="!isDataLoaded"
            :disabled="!isDataLoaded"
          />
        </div>
        
        <div class="flex gap-4">
          <div class="flex items-center gap-2">
            <Checkbox
              id="enabled"
              v-model="props.data.enabled"
              :binary="true"
            />
            <label for="enabled" class="cursor-pointer">Kích hoạt</label>
          </div>
          
          <div class="flex items-center gap-2">
            <Checkbox
              id="locked"
              v-model="props.data.locked"
              :binary="true"
            />
            <label for="locked" class="cursor-pointer">Khóa</label>
          </div>
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="avatar" class="font-semibold">Ảnh đại diện:</label>
          <FileUpload 
            ref="fileUpload" 
            mode="basic" 
            name="file" 
            accept="image/*" 
            :maxFileSize="1000000" 
            @upload="onUpload" 
            @select="onSelect" 
            @clear="onClear" 
            :auto="false" 
            chooseLabel="Chọn ảnh" 
            class="w-full"
          />
  
          <div v-if="uploadedFilePath" class="mt-2">
            <img 
              :src="uploadedFilePath" 
              alt="Ảnh xem trước" 
              class="max-w-full h-auto max-h-40 rounded border" 
              @error="$event.target.src = 'https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'" 
            />
          </div>
        </div>
      </div>
    </FormDialog>
  </template>