<script setup>
  import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import FormDialog from '@admin/components/FormDialog.vue';
  import InputNumber from 'primevue/inputnumber';
  import Dropdown from 'primevue/dropdown';
  import { ServiceBookingService } from '@admin/stores/admin/ServiceBooking';
  
  const props = defineProps({
    modelValue: Boolean,
    data: {
      type: Object,
      default: () => ({
        id: 0,
        serviceId: 0,
        patientId: 0,
        doctorId: 0,
        totalPrice: 0,
        paymentMethod: 'PAYPAL',
        status: 'PENDING'
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
  const isEditMode = computed(() => props.data && props.data.id);
  
  // Create a local copy of the data to prevent direct mutation of props
  const formData = ref({
    id: 0,
    totalPrice: 0,
    status: 'PENDING',
  });
  
  // Sync form data when props data changes
  watch(() => props.data, (newVal) => {
    if (newVal) {
      formData.value = {
        id: newVal.id || 0,
        totalPrice: newVal.totalPrice || 0,
        status: newVal.status || 'PENDING',
      };
    }
  }, { immediate: true, deep: true });
  
  // Options for status dropdown
  const statusOptions = ref([
    { label: 'Đang chờ', value: 'PENDING' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
    { label: 'Hoàn thành', value: 'COMPLETED' },
    { label: 'Thất bại', value: 'FAILED' }
  ]);
  
  const closeForm = () => {
    formVisible.value = false;
  };
  
  const saveServiceBooking = async () => {
    try {
      // Validate total price
      if (formData.value.totalPrice <= 0) {
        toast.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Tổng giá phải lớn hơn 0',
          life: 3000
        });
        return;
      }

      isSubmitting.value = true;

      // Prepare data for the API call - only send status and totalPrice
      const updateData = {
        status: formData.value.status,
        totalPrice: formData.value.totalPrice
      };

      // Call the new API to update only status and price
      await ServiceBookingService.updateStatusAndPrice(formData.value.id, updateData);

      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã cập nhật đặt lịch',
        life: 3000
      });

      emit('refreshList');
      closeForm();
    } catch (error) {
      console.error('Error updating service booking:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể cập nhật đặt lịch: ' + (error.response?.data || error.message || 'Đã có lỗi xảy ra'),
        life: 3000
      });
    } finally {
      isSubmitting.value = false;
    }
  };
</script>

<template>
  <FormDialog
    :visible="formVisible"
    title="Cập nhật trạng thái và giá"
    :loading="isSubmitting"
    @save="saveServiceBooking"
    @cancel="closeForm"
    @hide="closeForm"
  >
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Service Info - Read Only -->
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Dịch vụ:</label>
          <div class="p-2 border rounded bg-gray-50">
            {{ props.data.service?.name || '---' }}
          </div>
        </div>
        
        <!-- Patient Info - Read Only -->
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Bệnh nhân:</label>
          <div class="p-2 border rounded bg-gray-50">
            {{ props.data.patient?.user?.fullName || '---' }}
          </div>
        </div>
      </div>
      
      <!-- Total Price - Editable -->
      <div class="flex flex-col gap-1 w-full">
        <label for="totalPrice" class="font-semibold">Tổng giá:</label>
        <InputNumber
          id="totalPrice"
          v-model="formData.totalPrice"
          placeholder="Tổng giá"
          class="w-full"
          mode="currency"
          currency="VND"
        />
      </div>
      
      <!-- Status - Editable -->
      <div class="flex flex-col gap-1 w-full">
        <label for="status" class="font-semibold">Trạng thái:</label>
        <Dropdown
          id="status"
          v-model="formData.status"
          :options="statusOptions"
          optionValue="value"
          optionLabel="label"
          placeholder="Chọn trạng thái"
          class="w-full"
        />
      </div>
    </div>
  </FormDialog>
</template>