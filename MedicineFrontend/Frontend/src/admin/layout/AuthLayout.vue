<script setup>
import AppConfig from '@/layout/AppConfig.vue';
import { i18n } from '@/locales';
import { getLocale, setLocale } from '@admin/services/localStorage';
import { useAppStore } from '@admin/stores/app';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const currentLocale = ref(getLocale() ?? 'vi');

const appStore = useAppStore();
const toast = useToast();
appStore.$subscribe((mutation, state) => {
  const mutationToast = mutation.payload?.toast;
  if (mutationToast) {
    toast.add({
      severity: state.toast.severity,
      summary: state.toast.summary,
      detail: state.toast.detail,
      life: state.toast.life
    });
  }
});

// Related to this page
const backgroundImage = ref('url(/media/images/pages/login-bg.jpg)');
const backgroundStyle = ref({
  background: backgroundImage.value
});

const changeLocale = (locale) => {
  i18n.global.locale.value = locale;
  currentLocale.value = locale;
  setLocale(locale);
}

</script>

<template>
  <Toast />
  <div class="h-screen flex flex-col !bg-cover" :style="backgroundStyle">
    <div class="shadow bg-indigo-500 z-50 p-4 flex justify-between flex-row items-center">
      <div class="ml-4 flex" @click="$router.push('/')">
        <div>
          <img class="h-8" src="/demo/images/logo.svg" alt="" />
        </div>
      </div>
      <div class="mr-4 flex gap-2">
        <Button @click="$router.push('/')" class="!text-white" text plain>Trang chủ</Button>
        <Button v-if="currentLocale == 'vi'" @click="changeLocale('en')" text plain unstyled><span class="flag flag-uk"
            style="width: 54px; height: 36px" /></Button>
        <Button v-else @click="changeLocale('vi')" unstyled><span class="flag flag-vn"
            style="width: 54px; height: 36px" /></Button>
      </div>
    </div>

    <div class="self-center mt-auto mb-auto w-full max-w-xl">
      <div class="w-full text-center z-50 flex flex-col border rounded-md border-surface bg-surface-0 dark:bg-surface-900 px-4">
        <RouterView></RouterView>
      </div>
    </div>
  </div>
  <AppConfig simple />
</template>
