import { sendPost } from '@admin/services/axios';
import localStorage from '@admin/services/localStorage';
import { defineStore, getActivePinia } from 'pinia';
import { useAppStore } from './app';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoading: false,
    message: '',
    errors: [],
    isAuthenticated: false,
    user: {},
    credential: {
      email: 'tiennd77@gmail.com',
      password: 'Tiennd@123',
      rememberMe: true
    },
    redirectUrl: '',
  }),
  getters: {
    getUser: (state) => state.user,
  },
  actions: {
    login(credential) {
      const appStore = useAppStore();
      this.isLoading = true;
      appStore.$patch({ loading: true });

      sendPost('auth/login', credential)
        .then((response) => {
          localStorage.saveToken(response.data);
          // localStorage.setUser(response.data.user);
          this.isAuthenticated = true;
          
          appStore.$patch({
            toast: { detail: 'Đăng nhập thành công', severity: 'success'},
            loading: false,
          })
        })
        .catch((error) => {
          this.errors = error.response.data;
          appStore.$patch({ toast: { detail: error.response.data?.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    logout() {
      const appStore = useAppStore();
      sendPost('auth/logout')
        .then((response) => {
          const activePinia = getActivePinia();
          appStore.$patch({ toast: { detail: response.message, severity: 'success' } });
          localStorage.destroy();
          activePinia._s.forEach((store) => store.$reset());
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error' } });
        });
    },
  },
});
