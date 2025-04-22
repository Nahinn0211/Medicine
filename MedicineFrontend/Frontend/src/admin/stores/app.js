import { defineStore } from "pinia";

export const useAppStore = defineStore('app', {
  state: () => {
    return {
      loading: false,
      toast: {
        summary: 'Thông báo',
        detail: '',
        severity: 'error', // success, error, warn, info
        life: 5000,
        visible: false,
      },
      screen: 'mobile',
    }
  },
  getters: {
    getToast: (state) => state.toast,
  },
  actions: {
    setScreenMode(screen) {
      this.screen = screen;
    },
  },
})