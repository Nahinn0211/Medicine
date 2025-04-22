<script>
  import { i18n } from '@admin/locales';
  import { useAppStore } from '@admin/stores/app';
  import { useAuthStore } from '@admin/stores/auth';
  import { email, required } from '@admin/utils/validators';
  import { useVuelidate } from '@vuelidate/core';
  import { mapState } from 'pinia';
  import { ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  
  export default {
    setup: () => {
      const authStore = useAuthStore();
      const router = useRouter();
      const route = useRoute();
      const appStore = useAppStore();
      const { t } = i18n.global;
      const submitted = ref(false);
      appStore.$reset();
      
      // Kiểm tra token từ OAuth2 redirect
      onMounted(() => {
        // Kiểm tra nếu có token từ URL (sau khi redirect từ OAuth2)
        const token = route.query.token;
        if (token) {
          // Lưu token vào localStorage hoặc xử lý trong store
          authStore.setToken(token);
          // Lấy thông tin người dùng từ token
          authStore.fetchUserInfo(token);
        }
      });
      
      return {
        t,
        v$: useVuelidate(),
        authStore,
        router,
        appStore,
        submitted,
        route
      };
    },
  
    computed: {
      ...mapState(useAuthStore, ['isLoading', 'error', 'user', 'credential', 'isAuthenticated']),
    },
    watch: {
      isAuthenticated(newValue) {
        if (newValue) {
          this.router.push({ name: 'e-commerce' });
        }
      },
    },
    mounted() {
      this.authStore.$patch({ isAuthenticated: false });
    },
  
    methods: {
      emailChange() {
        this.credential.email = this.credential.email.trim();
      },
      async handleSubmit() {
        this.submitted = true;
        const isFormValid = await this.v$.$validate()
        if (!isFormValid) {
          this.appStore.$patch({ toast: { detail: 'Có lỗi dữ liệu nhập vào. Vui lòng kiểm tra lại!', visible: true } })
          return;
        }
        this.authStore.login(this.credential);
      },
      register(event) {
        event.preventDefault();
        this.$router.push('/auth/tenant-register');
      },
      forgotPass(event) {
        event.preventDefault();
        this.$router.push('/auth/forgot-password');
      },
      loginWithGoogle() {
        // Chuyển hướng người dùng đến endpoint đăng nhập Google của backend
        window.location.href = 'http://localhost:8080/oauth2/authorize/google';
      }
    },
    validations() {
      return {
        credential: {
          email: { required, email },
          password: { required },
        },
      };
    },
  };
  </script>
  
  <template>
    <div class="-mt-8 primary-contrast bg-cyan-700 rounded-md mx-auto px-4 py-2">
      <span class="!text-white text-3xl m-0">{{ $t('auth.login.labels.title') }}</span>
    </div>
  
    <span class="text-2xl font-semibold my-4">{{ $t('auth.login.labels.welcome') }}</span>
  
    <div class="w-full flex flex-col gap-4 px-4 pb-12">
      <div class="text-muted-color mb-6 px-12">{{ $t('auth.login.texts.welcome') }}</div>
      <div class="flex flex-col gap-1">
        <IconField>
          <InputText v-model="credential.email" :placeholder="$t('auth.login.labels.email')" fluid
            :invalid="v$.credential.email.$invalid && submitted" @change="emailChange" />
          <InputIcon class="pi pi-envelope" />
        </IconField>
        <Message v-if="v$.credential.email.$error && submitted" v-for="(error, index) of v$.credential.email.$errors"
          :key="index" severity="error" size="small" variant="simple">
          {{ error.$message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <Password v-model="credential.password" :placeholder="$t('auth.login.labels.password')"
          :promptLabel="$t('auth.login.labels.promptLabel')" :weakLabel="$t('auth.login.labels.weakLabel')"
          :mediumLabel="$t('auth.login.labels.mediumLabel')" :strongLabel="$t('auth.login.labels.strongLabel')"
          :feedback="false" fluid toggleMask :invalid="v$.credential.password.$invalid && submitted" />
        <Message v-if="v$.credential.password.$error && submitted"
          v-for="(error, index) of v$.credential.password.$errors" :key="index" severity="error" size="small"
          variant="simple">
          {{ error.$message }}
        </Message>
      </div>
      <Button @click="handleSubmit" class="w-full mt-4 px-4 uppercase" :label="$t('auth.login.buttons.login')"
        :loading="isLoading" />
        
      <!-- Nút đăng nhập bằng Google -->
      <div class="my-2 flex items-center justify-center">
        <div class="h-px bg-gray-300 flex-grow"></div>
        <span class="px-2 text-gray-500 text-sm">Hoặc</span>
        <div class="h-px bg-gray-300 flex-grow"></div>
      </div>
      
      <Button @click="loginWithGoogle" class="w-full px-4 flex align-items-center justify-content-center" 
        outlined>
        <i class="pi pi-google mr-2"></i>
        <span>Đăng nhập bằng Google</span>
      </Button>
      
      <Button @click="$router.push({ name: 'ForgotPassword' })" class="w-full text-primary-500" text
        :label="$t('auth.login.buttons.forgotPassword')"></Button>
    </div>
  </template>