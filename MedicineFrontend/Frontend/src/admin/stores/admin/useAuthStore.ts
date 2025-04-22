import { authService } from '@admin/stores/admin/AuthService';  
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    patientData: null,
    doctorData: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),

  getters: {
    getAuthStatus: (state) => state.isAuthenticated,
    getUserInfo: (state) => state.user,
    getPatientData: (state) => state.patientData,
    getToken: (state) => state.token,
    getDoctorData: (state) => state.doctorData,
  },

  actions: {
    async login(credentials) {
      try {
        this.isLoading = true;
        this.error = null;

        const response = await authService.login(credentials);
        if (response.success) {
          this.user = authService.getUserInfo();
          this.token = authService.getToken();
          this.isAuthenticated = true;

          // Fetch patient data after successful login
          if (this.user) {
            try {
              const patientData = await this.fetchPatientData(this.user.id);
              console.log('Login with patient');
            }catch (err) {
              console.log('Login with doctor');
              const doctorData = await this.fetchDoctorData(this.user.id);
            }
          }

          return true;
        } else {
          this.error = response.message;
          return false;
        }
      } catch (error) {
        this.error = error.message || 'Lỗi đăng nhập';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPatientData(userId) {
      try {
        const patientData = await authService.getDataPatient(userId);
        this.patientData = patientData;
        return patientData;
      } catch (error) {
        console.error('Error fetching patient data:', error);
        this.patientData = null;
        return null;
      }
    },

    async fetchDoctorData(userId) {
      try {
        const doctorData = await authService.getDataDoctor(userId);
        this.doctorData = doctorData;
        return doctorData;
      } catch (error) {
        console.error('Error fetching doctor data:', error);
        this.doctorData = null;
        return null;
      }
    },

    async initializeAuth() {
      try {
        await authService.initializeAuth();
        this.user = authService.getUserInfo();
        this.token = authService.getToken();
        this.isAuthenticated = authService.isAuthenticated();

        // Fetch patient data after initialization if user exists
        if (this.user) {
          await this.fetchPatientData(this.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    },

    logout() {
      authService.logout();
      this.user = null;
      this.patientData = null;
      this.token = null;
      this.isAuthenticated = false;
    },
  },
});