<script setup>
import { useTicketPriceStore } from '@admin/stores/ticketprice';
import { required } from '@admin/utils/validators';
import { useVuelidate } from '@vuelidate/core';
import { storeToRefs } from 'pinia';
import {onMounted, computed, ref, watch } from "vue";
import { useAppStore } from '@admin/stores/app';
const props = defineProps({ visible: Boolean });

const ticketPriceStore = useTicketPriceStore();
const appStore = useAppStore();
const { giaVe, form, errors , loaiChoItems, gaDiItems, gaDenItems} = storeToRefs(ticketPriceStore);
console.log(giaVe.value);
const title = computed(()=>giaVe.value && giaVe.value.id?'Cập nhật bảng giá vé' : 'Tạo mới bảng giá vé');
const formVisible = computed(()=> props.visible);
// Computed property để hiển thị cả mã và tên loại chỗ
const loaiChoOpitions = computed(() =>
loaiChoItems.value.map(item => ({
    ...item,
    dienGiai: `${item.loaiCho} - ${item.dienGiai}` // Tạo optionLabel theo format mong muốn
  }))
);
const optionsGa = ref([
  { label: "Hà Nội", value: "HN" },
  { label: "Đà Nẵng", value: "DN" },
  { label: "Sài Gòn", value: "SG" },
]);

const optionsLoaiCho = ref([
  { label: "Ngồi mềm", value: "NGOI_MEM" },
  { label: "Ngồi cứng", value: "NGOI_CUNG" },
  { label: "Nằm khoang 4", value: "NAM_K4" },
]);
// Danh sách bản ghi
const records = ref([
  { id: 1, giaVeId: 0, ngayDiTu: null, ngayDiDen: null, isEditing: true },
]);
const rules = {
    giaVe: {
        tenBangGia: { required },
    }
};
const v$ = useVuelidate(rules, {giaVe}, { $autoDirty: true, $externalResults: errors});
function onCancel() {
    ticketPriceStore.$patch({ form: { visible: false } })
}
function onHide() {
    ticketPriceStore.resetForm();
  v$.value.$reset()
}
function onShow() {
  if (giaVe.value.id) {
    ticketPriceStore.edit(1, giaVe.value.id)
  }
}
async function onSave(event) {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) {
    const elms = document.querySelectorAll('.p-invalid');
    elms[0].scrollIntoView({ behavior: 'smooth' });
    return;
  }
var input = {giaVe: {
    tenBangGia:giaVe.value.tenBangGia,
    giaVeDetails: giaVe.value.giaVeDetails,
    giaVeApDungs: giaVe.value.giaVeApDungs
}};
  const payload = {
    ...input,
    //permissions: []
  };
console.log(input);
  if (!giaVe.value.id) ticketPriceStore.store(payload);
  else ticketPriceStore.update(payload);
}
function validateNgayDiTu(index){
    const record = records.value[index];

  if (!record.ngayDiTu) {
    appStore.$patch({ toast: { detail: "Ngày Đi Từ không được để trống!", severity: 'error', visible: true } });
   
    return;
  }

  if (index > 0) {
    const prevNgayDiDen = records.value[index - 1].ngayDiDen;
    if (prevNgayDiDen && record.ngayDiTu <= prevNgayDiDen) {
        appStore.$patch({ toast: { detail: "Ngày Đi Từ phải lớn hơn Ngày Đi Đến của dòng trước!", severity: 'error', visible: true } });
     
      //record.ngayDiTu = null;
    }
  }
}
function validateNgayDiDen(index){
    const record = records.value[index];

  if (!record.ngayDiDen) {
    appStore.$patch({ toast: { detail: "Ngày Đi Đến không được để trống!", severity: 'error', visible: true } });
    
    return;
  }

  if (record.ngayDiTu && record.ngayDiDen) {
    if (record.ngayDiDen <= record.ngayDiTu) {
        appStore.$patch({ toast: { detail: "Ngày Đi Đến phải lớn hơn Ngày Đi Từ!", severity: 'error', visible: true } });
     
      //record.ngayDiDen = null;
    }
  }
}
function addDetail(){
    ticketPriceStore.addDetail();
}
function addApDung(){
    ticketPriceStore.addApDung();
}
function saveRowApDung (index){
    const record = records.value[index];
    if (!record.ngayDiTu || !record.ngayDiDen) {
        appStore.$patch({ toast: { detail: "Bạn phải nhập cả Ngày Đi Từ và Ngày Đi Đến!", severity: 'error', visible: true } });
   
    return;
  }

  records.value[index].isEditing = false;
}
function editRowApDung(index){
    records.value[index].isEditing = true;
}
function deleteRowApDung(index) {
    records.value.splice(index, 1);
}
const customFilter = (option, filterValue) => {
  if (!filterValue) return true; // Nếu không nhập gì, hiển thị tất cả

  const searchText = filterValue.toLowerCase().trim(); // Chuẩn hóa từ khóa tìm kiếm

  // Chuyển đổi sKeys thành danh sách từ khóa
  const keywords = option.sKeys
    ? option.sKeys.toLowerCase().split(",").map(kw => kw.trim())
    : [];
console.log(keywords);
  // Kiểm tra từ khóa trong maGa, tenGa và danh sách từ khóa sKeys
  return (
    option.maGa.toLowerCase().includes(searchText) ||
    option.tenGa.toLowerCase().includes(searchText) ||
    keywords.some((keyword) => keyword.includes(searchText))
  );
};

onMounted(()=>{
   // initDirectory();
    
  
})
</script>
<template>
    <FormDialog :visible="formVisible" :title="title" :loading="form.isLoading" @save="onSave" @cancel="onCancel"
    @hide="onHide" @show="onShow" :style="{ width: '85rem' }">
    <div class="flex flex-col md:flex-col gap-4">
        <div class="flex flex-col gap-1 w-full">
            <label for="name">Tên bảng giá</label>
            <div class="flex flex-col gap-1">
          <InputText autoFocus id="tenBangGia" v-model="giaVe.tenBangGia" placeholder="Nhập tên bảng giá" class="w-full"
            :invalid="v$.giaVe.tenBangGia.$error" />
          <Message v-if="v$.giaVe.tenBangGia.$error"
            v-for="(error, index) of v$.giaVe.tenBangGia.$errors" :key="index" severity="error" size="small"
            variant="simple">
            {{ error.$message }}
          </Message>
        </div>
        </div>
    </div>
    <div class="flex flex-col md:flex-col gap-4">
        <DataTable showGridlines scrollable  :value="giaVe.giaVeDetails" responsiveLayout="scroll" class="shadow-md">
        <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xl font-bold">Giá vé</span>
            <Button icon="pi pi-plus-circle" rounded raised class="mb-3" @click="addDetail" />
        </div>
    </template>

    <Column field="macTau" header="Mác Tàu" style="min-width: 14rem;">
        <template #body="slotProps">
          <InputText v-if="slotProps.data.isEditing" v-model="slotProps.data.macTau" class="w-full" />
          <span v-else>{{ slotProps.data.macTau }}</span>
          <small v-if="slotProps.data.errors?.macTau" class="p-error">{{ slotProps.data.errors.macTau }}</small>
        </template>
      </Column>
      <Column field="maGaDi" header="Ga Đi" style="min-width: 13rem;">
        <template #body="slotProps">
          <Dropdown
            v-if="slotProps.data.isEditing"
            v-model="slotProps.data.maGaDi"
            :options="gaDiItems"
            optionLabel="tenGa"
            optionValue="maGa"
            class="w-full"
            filter
            
  :filterFunction="customFilter"
  filterPlaceholder="Nhập từ khóa tìm ga"
  
          />
          <span v-else>{{ slotProps.data.maGaDi }}</span>
          <small v-if="slotProps.data.errors?.maGaDi" class="p-error">{{ slotProps.data.errors.maGaDi }}</small>
        </template>
      </Column>
      <Column field="maGaDen" header="Ga Đến" style="min-width: 13rem;">
        <template #body="slotProps">
          <Dropdown
            v-if="slotProps.data.isEditing"
            v-model="slotProps.data.maGaDen"
            :options="gaDenItems"
            optionLabel="tenGa"
            optionValue="maGa"
            class="w-full"
            filter
  :filterFunction="customFilter"
  filterPlaceholder="Nhập từ khóa tìm ga"
          />
          <span v-else>{{ slotProps.data.maGaDen }}</span>
          <small v-if="slotProps.data.errors?.maGaDen" class="p-error">{{ slotProps.data.errors.maGaDen }}</small>
        </template>
      </Column>

      <Column field="loaiCho" header="Loại Chỗ" style="min-width: 18rem;">
        <template #body="slotProps">
          <Dropdown
            v-if="slotProps.data.isEditing"
            v-model="slotProps.data.loaiCho"
            :options="loaiChoOpitions"
            optionLabel="dienGiai"
            optionValue="loaiCho"
            class="w-full"
            filter
              filterBy="loaiCho"
  filterPlaceholder="Nhập mã loại chỗ để tìm kiếm"
          />
          <span v-else>{{ slotProps.data.loaiCho }}</span>
          <small v-if="slotProps.data.errors?.loaiCho" class="p-error">{{ slotProps.data.errors.loaiCho }}</small>
        </template>
      </Column>
      <Column field="giaVe" header="Giá Vé" style="min-width: 10rem;">
        <template #body="slotProps">
          <InputNumber
            v-if="slotProps.data.isEditing"
            v-model="slotProps.data.giaVe"
            :min="0"
            mode="decimal"
            class="w-full"
          />
          <span v-else>{{ slotProps.data.giaVe?.toLocaleString('vi-VN') }} đ</span>
          <small v-if="slotProps.data.errors?.giaVe" class="p-error">{{ slotProps.data.errors.giaVe }}</small>
        </template>
      </Column>

      <Column header="Hành động" style="min-width: 8rem;">
        <template #body="slotProps">
          <Button
            v-if="slotProps.data.isEditing"
            icon="pi pi-check"
            class="p-button-success p-button-sm mr-2"
            @click="ticketPriceStore.saveDetail(slotProps.index)"
          />
          <Button
            v-else
            icon="pi pi-pencil"
            class="p-button-warning p-button-sm mr-2"
            @click="slotProps.data.isEditing = true"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-danger p-button-sm"
            @click="ticketPriceStore.giaVe.giaVeDetails.splice(slotProps.index, 1)"
          />
        </template>
      </Column>
    </DataTable>    
    </div>
    <div class="flex flex-col md:flex-col gap-4">
    
    

    <DataTable showGridlines scrollable  :value="giaVe.giaVeApDungs" responsiveLayout="scroll" class="shadow-md">
        <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xl font-bold">Giá vé áp dụng</span>
            <Button icon="pi pi-plus-circle" rounded raised @click="addApDung"/>
        </div>
    </template>

      <Column field="ngayDiTu" header="Ngày đi từ" headerClass="bg-white">
        <template #body="slotProps">
          <Calendar
            v-if="slotProps.data.isEditing"
            v-model="slotProps.data.ngayDiTu"
            dateFormat="dd/mm/yy"
            class="w-full"
           
          />
          <span v-else>{{ new Date(slotProps.data.ngayDiTu).toLocaleDateString('vi-VN') }}</span>
        </template>
      </Column>

      <Column field="ngayDiDen" header="Ngày đi đến" headerClass="bg-white">
        <template #body="slotProps">
          <Calendar
            v-if="slotProps.data.isEditing"
            v-model="slotProps.data.ngayDiDen"
            dateFormat="dd/mm/yy"
            class="w-full"
          />
          <span v-else>{{ new Date(slotProps.data.ngayDiDen).toLocaleDateString('vi-VN') }}</span>
        </template>
      </Column>

      <Column header="Hành động" headerClass="bg-white">
        <template #body="slotProps">
          <Button
            v-if="slotProps.data.isEditing"
            icon="pi pi-check"
            class="p-button-success p-button-sm mr-2"
            @click="ticketPriceStore.saveApDung(slotProps.index)"
          />
          <Button
            v-else
            icon="pi pi-pencil"
            class="p-button-warning p-button-sm mr-2"
             @click="slotProps.data.isEditing = true"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-danger p-button-sm"
            @click="giaVe.giaVeApDungs.splice(slotProps.index, 1)"
          />
        </template>
      </Column>
    </DataTable>    
  </div>
</FormDialog>
   
</template>