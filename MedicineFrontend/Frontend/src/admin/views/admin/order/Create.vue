<script setup>
import { ref, computed, defineProps, defineEmits } from "vue";
import { useToast } from "primevue/usetoast";
import FormDialog from "@admin/components/FormDialog.vue";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import Textarea from "primevue/textarea";
import { OrderService } from "@admin/stores/admin/Order";

const props = defineProps({
  modelValue: Boolean,
  data: {
    type: Object,
    default: () => ({
      id: 0,
      orderCode: "",
      patientId: null,
      totalPrice: 0,
      paymentMethod: "",
      status: "",
      voucherCode: "",
      discountAmount: 0,
      note: "",
      createdAt: "",
      updatedAt: "",
      orderDetails: [],
      patientName: "",
    }),
  },
});

const emit = defineEmits(["update:modelValue", "refreshList"]);

const formVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isSubmitting = ref(false);
const toast = useToast();
const isEditMode = computed(() => props.data.id !== 0);
 
const paymentMethods = ref([
  { label: "Tiền mặt", value: "CASH" },
  { label: "Ví MoMo", value: "BALANCEACCOUNT" },
  { label: "Chuyển khoản", value: "PAYPAL" },
]);
const orderStatuses = ref([
 { label: "Đang chờ", value: "PENDING" },
 { label: "Đã xác nhận", value: "PROCESSING" },
 { label: "Đang giao hàng", value: "COMPLETED" },
 { label: "Đã hủy", value: "CANCELLED" },
]);

const validateForm = () => {
  const errors = [];

  if (!props.data.totalPrice || props.data.totalPrice <= 0) {
    errors.push("Vui lòng nhập tổng giá trị đơn hàng");
  }

  if (!props.data.paymentMethod) {
    errors.push("Vui lòng chọn phương thức thanh toán");
  }

  if (!props.data.status) {
    errors.push("Vui lòng chọn trạng thái đơn hàng");
  }

  if (errors.length > 0) {
    errors.forEach((error) => {
      toast.add({
        severity: "warn",
        summary: "Cảnh báo",
        detail: error,
        life: 3000,
      });
    });
    return false;
  }

  return true;
};

const closeForm = () => {
  formVisible.value = false;
};
const saveOrder = async () => {
  if (!validateForm()) return;

  try {
    isSubmitting.value = true;

    const orderData = {
      id: props.data.id || 0,
      orderCode: props.data.orderCode || "",
      patientId: props.data.patientId || 0,
      totalPrice: props.data.totalPrice || 0,
      paymentMethod: props.data.paymentMethod || "PAYPAL",
      status: props.data.status || "PENDING",
      voucherCode: props.data.voucherCode || "",
      discountAmount: props.data.discountAmount || 0,
      note: props.data.note || ""
    };

    await OrderService.saveOrder(orderData);

    toast.add({
      severity: "success",
      summary: "Thành Công",
      detail: isEditMode.value
        ? "Đã cập nhật đơn hàng thành công"
        : "Đã thêm đơn hàng thành công",
      life: 3000,
    });

    emit("refreshList");
    closeForm();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail:
        "Không thể lưu đơn hàng: " +
        (error.response?.data?.message || error.message),
      life: 3000,
    });
    console.error("Lỗi khi lưu đơn hàng:", error);
  } finally {
    isSubmitting.value = false;
  }
};


</script>

<template>
  <FormDialog
    :visible="formVisible"
    :title="isEditMode ? 'Cập nhật đơn hàng' : 'Thêm đơn hàng mới'"
    :loading="isSubmitting"
    @save="saveOrder"
    @cancel="closeForm"
    @hide="closeForm"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1 w-full">
        <label for="orderCode" class="font-semibold text-gray-700"
          >Mã đơn hàng:</label
        >
        <InputText
          id="orderCode"
          :value="props.data.orderCode"
          readonly
          class="w-full border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          style="pointer-events: none"
        />
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="patientName" class="font-semibold text-gray-700"
          >Bệnh nhân:</label
        >
        <InputText
          id="patientName"
          :value="props.data.patientName"
          readonly
          class="w-full border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          style="pointer-events: none"
        />
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="totalPrice" class="font-semibold">Tổng giá trị:</label>
        <InputNumber
          id="totalPrice"
          v-model="props.data.totalPrice"
          mode="currency"
          currency="VND"
          locale="vi-VN"
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="paymentMethod" class="font-semibold"
          >Phương thức thanh toán:</label
        >
        <Dropdown
          id="paymentMethod"
          v-model="props.data.paymentMethod"
          :options="paymentMethods"
          optionLabel="label"
          optionValue="value"
          placeholder="Chọn phương thức thanh toán"
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="status" class="font-semibold">Trạng thái:</label>
        <Dropdown
          id="status"
          v-model="props.data.status"
          :options="orderStatuses"
          optionLabel="label"
          optionValue="value"
          placeholder="Chọn trạng thái đơn hàng"
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="voucherCode" class="font-semibold text-gray-700"
          >Mã giảm giá:</label
        >
        <InputText
          id="voucherCode"
          :value="props.data.voucherCode"
          readonly
          class="w-full border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          style="pointer-events: none"
        />
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="discountAmount" class="font-semibold text-gray-700"
          >Số tiền giảm giá:</label
        >
        <InputNumber
          id="discountAmount"
          :value="props.data.discountAmount"
          readonly
          mode="currency"
          currency="VND"
          locale="vi-VN"
          class="w-full border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          style="pointer-events: none"
        />
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="note" class="font-semibold text-gray-700">Ghi chú:</label>
        <Textarea
          id="note"
          :value="props.data.note"
          readonly
          placeholder="Nhập ghi chú"
          class="w-full border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          style="pointer-events: none"
          rows="3"
        />
      </div>
    </div>
  </FormDialog>
</template>
