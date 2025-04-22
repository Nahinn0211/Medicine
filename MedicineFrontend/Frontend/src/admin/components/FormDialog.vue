<script>
import CustomBlockUI from '@admin/components/CustomBlockUI.vue';

export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: ''
    },
  },
  components: { CustomBlockUI },
  emits: ['save', 'hide', 'cancel', 'show'],
  computed: {
    formVisible() {
      return this.visible;
    },
    isLoading() {
      return this.loading;
    }
  },
  methods: {
    onCancel(event) {
      this.$emit('cancel', event);
    },
    onHide() {
      this.$emit('hide', event);
    },
    onShow() {
      this.$emit('show', event);
    },
    onSave(event) {
      this.$emit('save', event);
    },
  }
}

</script>
<template>
  <Dialog v-model:visible="formVisible" modal :closable="false" :style="{ width: '60rem' }"
    pt:header:class="border-b mb-6" pt:footer:class="border-t !pt-6" @hide="onHide" @show="onShow">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="font-semibold text-xl whitespace-nowrap">{{ title }}</span>
        <Button class="content-end" icon="pi pi-times" text severity="secondary" @click="onCancel" autofocus></Button>
      </div>
    </template>
    <CustomBlockUI :blocked="isLoading">
      <div class="flex flex-col md:flex-col gap-4 p-4">
        <slot />
      </div>
    </CustomBlockUI>
    <template #footer>
      <Button label="Huỷ" icon="pi pi-times" text severity="secondary" @click="onCancel" autofocus />
      <Button label="Lưu" icon="pi pi-check" @click="onSave" autofocus :loading="isLoading"/>
    </template>
  </Dialog>
</template>