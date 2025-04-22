<!-- src/views/admin/discounts/Create.vue -->
<script setup>
  import { ref, computed, defineProps, defineEmits, onMounted } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import FormDialog from '@admin/components/FormDialog.vue';
  import InputText from 'primevue/inputtext';
  import InputNumber from 'primevue/inputnumber';
  import Calendar from 'primevue/calendar';
  import Dropdown from 'primevue/dropdown';
  import { DiscountService } from '@admin/stores/admin/Discount';
  import { Medicines } from '@admin/stores/admin/Medicines';
  
  const props = defineProps({
    modelValue: Boolean,
    data: {
      type: Object,
      default: () => ({
        id: 0,
        code: '',
        name: '',
        medicineId: 0,
        discountPercentage: 0,
        startDate: null,
        endDate: null
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
  const medicines = ref([]);
  const isEditMode = computed(() => props.data.id !== 0);
  
  // Fetch danh sách thuốc để hiển thị dropdown
  const fetchMedicines = async () => {
    try {
      const response = await Medicines.getMedicines();
      
      // Xử lý dữ liệu thuốc theo định dạng JSON mới
      medicines.value = response.data.map(medicine => ({
        id: medicine.id,
        name: medicine.name || `Thuốc #${medicine.id}`,
        image: medicine.mediaUrl && medicine.mainImage ? medicine.mediaUrl : null
      }));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thuốc:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lấy danh sách thuốc',
        life: 3000
      });
    }
  };
  
  onMounted(() => {
    fetchMedicines();
    
    // Chuyển đổi chuỗi ngày thành đối tượng Date nếu đang ở chế độ sửa
    if (isEditMode.value) {
      if (props.data.startDate && typeof props.data.startDate === 'string') {
        props.data.startDate = new Date(props.data.startDate);
      }
      if (props.data.endDate && typeof props.data.endDate === 'string') {
        props.data.endDate = new Date(props.data.endDate);
      }
    } else {
      // Mặc định thời gian bắt đầu là hiện tại, kết thúc là 1 tháng sau
      if (!props.data.startDate) {
        props.data.startDate = new Date();
      }
      if (!props.data.endDate) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        props.data.endDate = endDate;
      }
    }
  });
  
  const validateForm = () => {
    const errors = [];
    
    if (!props.data.code || props.data.code.trim() === '') {
      errors.push('Vui lòng nhập mã giảm giá');
    }
    
    if (!props.data.name || props.data.name.trim() === '') {
      errors.push('Vui lòng nhập tên giảm giá');
    }
    
    if (!props.data.medicineId) {
      errors.push('Vui lòng chọn thuốc');
    }
    
    if (props.data.discountPercentage <= 0 || props.data.discountPercentage > 100) {
      errors.push('Phần trăm giảm giá phải lớn hơn 0 và nhỏ hơn hoặc bằng 100');
    }
    
    if (!props.data.startDate) {
      errors.push('Vui lòng chọn ngày bắt đầu');
    }
    
    if (!props.data.endDate) {
      errors.push('Vui lòng chọn ngày kết thúc');
    }
    
    if (props.data.startDate && props.data.endDate && props.data.startDate > props.data.endDate) {
      errors.push('Ngày bắt đầu phải trước ngày kết thúc');
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
  
  const saveDiscount = async () => {
    if (!validateForm()) return;
    
    try {
      isSubmitting.value = true;
      
      // Sử dụng định dạng API đã cung cấp
      await DiscountService.saveDiscount({
        id: props.data.id,
        code: props.data.code,
        name: props.data.name,
        medicineId: props.data.medicineId,
        discountPercentage: props.data.discountPercentage,
        startDate: props.data.startDate,
        endDate: props.data.endDate
      });
      
      toast.add({
        severity: 'success',
        summary: 'Thành Công',
        detail: isEditMode.value
          ? 'Đã cập nhật giảm giá thành công'
          : 'Đã thêm giảm giá thành công',
        life: 3000
      });
      
      emit('refreshList');
      closeForm();
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu giảm giá: ' + (error.response?.data?.message || error.message),
        life: 3000
      });
      console.error('Lỗi khi lưu giảm giá:', error);
    } finally {
      isSubmitting.value = false;
    }
  };
  </script>
  
  <template>
    <FormDialog
      :visible="formVisible"
      :title="isEditMode ? 'Cập nhật giảm giá' : 'Thêm giảm giá mới'"
      :loading="isSubmitting"
      @save="saveDiscount"
      @cancel="closeForm"
      @hide="closeForm"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1 w-full">
          <label for="discountCode" class="font-semibold">Mã giảm giá:</label>
          <InputText
            id="discountCode"
            v-model="props.data.code"
            placeholder="Nhập mã giảm giá"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="discountName" class="font-semibold">Tên giảm giá:</label>
          <InputText
            id="discountName"
            v-model="props.data.name"
            placeholder="Nhập tên giảm giá"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="medicine" class="font-semibold">Thuốc áp dụng:</label>
          <Dropdown
            id="medicine"
            v-model="props.data.medicineId"
            :options="medicines"
            optionLabel="name"
            optionValue="id"
            placeholder="Chọn thuốc"
            class="w-full"
          >
            <template #option="slotProps">
              <div class="flex items-center">
                <img 
                  v-if="slotProps.option.image" 
                  :src="slotProps.option.image" 
                  :alt="slotProps.option.name"
                  class="w-8 h-8 mr-2 object-cover rounded"
                  @error="$event.target.src='https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'"
                />
                <div v-else class="w-8 h-8 mr-2 bg-gray-200 rounded flex items-center justify-center">
                  <i class="pi pi-image text-gray-500"></i>
                </div>
                <div>{{ slotProps.option.name }}</div>
              </div>
            </template>
            <template #value="slotProps">
              <div class="flex items-center" v-if="slotProps.value">
                <img 
                  v-if="medicines.find(m => m.id === slotProps.value)?.image" 
                  :src="medicines.find(m => m.id === slotProps.value)?.image" 
                  :alt="medicines.find(m => m.id === slotProps.value)?.name"
                  class="w-6 h-6 mr-2 object-cover rounded"
                  @error="$event.target.src='https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'"
                />
                <div v-else class="w-6 h-6 mr-2 bg-gray-200 rounded flex items-center justify-center">
                  <i class="pi pi-image text-gray-500 text-xs"></i>
                </div>
                <div>{{ medicines.find(m => m.id === slotProps.value)?.name }}</div>
              </div>
              <span v-else>Chọn thuốc</span>
            </template>
          </Dropdown>
        </div>
        
        <div class="flex flex-col gap-1 w-full">
          <label for="discountPercent" class="font-semibold">Phần trăm giảm giá (%):</label>
          <InputNumber
            id="discountPercent"
            v-model="props.data.discountPercentage"
            placeholder="Nhập phần trăm giảm giá"
            suffix="%"
            :min="0"
            :max="100"
            class="w-full"
          />
        </div>
        
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex flex-col gap-1 w-full md:w-1/2">
            <label for="startDate" class="font-semibold">Ngày bắt đầu:</label>
            <Calendar
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
            <Calendar
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