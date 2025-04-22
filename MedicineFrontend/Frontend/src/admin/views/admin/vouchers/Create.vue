<script setup>
  import { ref, computed, defineProps, defineEmits, onMounted } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import FormDialog from '@admin/components/FormDialog.vue';
  import InputText from 'primevue/inputtext';
  import InputNumber from 'primevue/inputnumber';
   import DatePicker from 'primevue/datepicker';
   import Select from 'primevue/select';
  import { 
    VoucherService, 
    VOUCHER_DEFAULTS, 
    VOUCHER_STATUS_OPTIONS, 
    normalizeVoucherData, 
    validateVoucherData 
  } from '@admin/stores/admin/Voucher';
  
  const props = defineProps({
    modelValue: Boolean,
    data: {
      type: Object,
      default: () => ({ ...VOUCHER_DEFAULTS })
    }
  });
  
  const emit = defineEmits(['update:modelValue', 'refreshList']);
  
  const formVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });
  
  const isSubmitting = ref(false);
  const toast = useToast();
  const isEditMode = computed(() => props.data.id !== 0);
  const statusOptions = VOUCHER_STATUS_OPTIONS;
  
  onMounted(() => {
    // Nếu là chế độ chỉnh sửa, chuẩn hóa dữ liệu
    if (isEditMode.value) {
      Object.assign(props.data, normalizeVoucherData(props.data));
    }
  });
  
  const showErrors = (errors) => {
    errors.forEach(error => {
      toast.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: error,
        life: 3000
      });
    });
  };
  
  const closeForm = () => {
    formVisible.value = false;
  };
  
  const saveVoucher = async () => {
    // Kiểm tra tính hợp lệ của dữ liệu
    const errors = validateVoucherData(props.data);
    if (errors.length > 0) {
      showErrors(errors);
      return;
    }
    
    try {
      isSubmitting.value = true;
      
      await VoucherService.saveVoucher({ ...props.data });
      
      toast.add({
        severity: 'success',
        summary: 'Thành Công',
        detail: isEditMode.value
          ? 'Đã cập nhật voucher thành công'
          : 'Đã thêm voucher thành công',
        life: 3000
      });
      
      emit('refreshList');
      closeForm();
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu voucher: ' + (error.response?.data?.message || error.message),
        life: 3000
      });
      console.error('Lỗi khi lưu voucher:', error);
    } finally {
      isSubmitting.value = false;
    }
  };
  </script>
  
  <template>
    <FormDialog
      :visible="formVisible"
      :title="isEditMode ? 'Cập nhật voucher' : 'Thêm voucher mới'"
      :loading="isSubmitting"
      @save="saveVoucher"
      @cancel="closeForm"
      @hide="closeForm"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1 w-full">
          <label for="voucherCode" class="font-semibold">Mã voucher:</label>
          <InputText
            id="voucherCode"
            v-model="props.data.code"
            placeholder="Nhập mã voucher"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="voucherPercent" class="font-semibold">Phần trăm giảm giá (%):</label>
          <InputNumber
            id="voucherPercent"
            v-model="props.data.voucherPercentage"
            placeholder="Nhập phần trăm giảm giá"
            suffix="%"
            :min="0"
            :max="100"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="voucherStock" class="font-semibold">Số lượng:</label>
          <InputNumber
            id="voucherStock"
            v-model="props.data.stock"
            placeholder="Nhập số lượng voucher"
            :min="0"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="minimumOrderValue" class="font-semibold">Giá trị đơn hàng tối thiểu:</label>
          <InputNumber
            id="minimumOrderValue"
            v-model="props.data.minimumOrderValue"
            placeholder="Nhập giá trị đơn hàng tối thiểu"
            :min="0"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="status" class="font-semibold">Trạng thái:</label>
          <!-- Đổi từ Dropdown sang Select -->
          <Select
            id="status"
            v-model="props.data.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Chọn trạng thái"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex flex-col gap-1 w-full md:w-1/2">
            <label for="startDate" class="font-semibold">Ngày bắt đầu:</label>
            <!-- Đổi từ Calendar sang DatePicker -->
            <DatePicker
              id="startDate"
              v-model="props.data.startDate"
              dateFormat="dd/mm/yy"
              showTime
              hourFormat="24"
              class="w-full"
            />
          </div>
          
          <div class="flex flex-col gap-1 w-full md:w-1/2">
            <label for="endDate" class="font-semibold">Ngày kết thúc:</label>
            <!-- Đổi từ Calendar sang DatePicker -->
            <DatePicker
              id="endDate"
              v-model="props.data.endDate"
              dateFormat="dd/mm/yy"
              showTime
              hourFormat="24"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </FormDialog>
  </template>