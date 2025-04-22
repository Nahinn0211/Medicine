<script setup>
  import { ref, computed, defineProps, defineEmits } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import FormDialog from '@admin/components/FormDialog.vue';
  import InputText from 'primevue/inputtext';
  import { 
    RoleService, 
    ROLE_DEFAULTS, 
    validateRoleData 
  } from '@admin/stores/admin/Role';
  
  const props = defineProps({
    modelValue: Boolean,
    data: {
      type: Object,
      default: () => ({ ...ROLE_DEFAULTS })
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
  
  // Helper function để hiển thị thông báo
  const showToast = (severity, summary, detail, life = 3000) => {
    toast.add({ severity, summary, detail, life });
  };
  
  // Hàm xác thực form
  const validateForm = () => {
    const errors = validateRoleData(props.data);
    
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
    formVisible.value = false;
  };
  
  // Lưu vai trò
  const saveRole = async () => {
    if (!validateForm()) return;
    
    try {
      isSubmitting.value = true;
      
      await RoleService.saveRole({
        id: props.data.id,
        name: props.data.name
      });
      
      showToast(
        'success',
        'Thành công',
        isEditMode.value
          ? 'Đã cập nhật vai trò thành công'
          : 'Đã thêm vai trò thành công'
      );
      
      emit('refreshList');
      closeForm();
    } catch (error) {
      console.error('Lỗi khi lưu vai trò:', error);
      showToast(
        'error',
        'Lỗi',
        'Không thể lưu vai trò: ' + 
        (error.response?.data?.message || error.message)
      );
    } finally {
      isSubmitting.value = false;
    }
  };
  </script>
  
  <template>
    <FormDialog
      :visible="formVisible"
      :title="isEditMode ? 'Cập nhật vai trò' : 'Thêm vai trò mới'"
      :loading="isSubmitting"
      @save="saveRole"
      @cancel="closeForm"
      @hide="closeForm"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1 w-full">
          <label for="roleName" class="font-semibold">Tên vai trò:</label>
          <InputText
            id="roleName"
            v-model="props.data.name"
            placeholder="Nhập tên vai trò"
            class="w-full"
          />
        </div>
      </div>
    </FormDialog>
  </template>