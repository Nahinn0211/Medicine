import { ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

/**
 * ======================================
 * API SERVICES
 * ======================================
 */
export const PatientProfileService = {
  // Lấy danh sách tất cả hồ sơ bệnh nhân
  async getPatientProfiles() {
    return await sendGet(`${API_BASE_URL}/patient-profiles`);
  },
  
  // Lấy chi tiết hồ sơ bệnh nhân theo ID
  async getPatientProfileById(id) {
    return await sendGet(`${API_BASE_URL}/patient-profiles/${id}`);
  },
  
  // Lấy hồ sơ bệnh nhân theo user ID
  async getPatientProfileByUserId(userId) {
    return await sendGet(`${API_BASE_URL}/patient-profiles/by-user/${userId}`);
  },
  
  // Lưu hoặc cập nhật hồ sơ bệnh nhân
  async savePatientProfile(profileData) {
    return await sendPost(`${API_BASE_URL}/patient-profiles/save`, profileData);
  },
  
  // Xóa hồ sơ bệnh nhân theo ID
  async deletePatientProfiles(ids) {
    return await sendDelete(`${API_BASE_URL}/patient-profiles`, { data: ids });
  },
  
  // Nạp tiền vào tài khoản bệnh nhân
  async updateAccountBalance(patientProfileId, balance) {
    return await sendPut(`${API_BASE_URL}/patient-profiles/update/balance/${patientProfileId}`, balance.toString());
  },
  
  // Lấy tổng số bệnh nhân
  async getTotalPatients() {
    return await sendGet(`${API_BASE_URL}/patient-profiles/total`);
  },
  
  // Khóa hoặc mở khóa hồ sơ bệnh nhân
  async toggleLockStatus(patientProfileId, isLocked) {
    return await sendPut(`${API_BASE_URL}/patient-profiles/toggle-lock/${patientProfileId}?isLocked=${isLocked}`);
  }
};

/**
 * ======================================
 * UTILITY FUNCTIONS
 * ======================================
 */

// Format tiền tệ theo định dạng Việt Nam
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value || 0);
};

// Format ngày giờ theo định dạng Việt Nam
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Lấy URL avatar người dùng
export const getUserAvatar = (avatar, defaultSize = 100) => {
  if (!avatar) return `https://placehold.co/${defaultSize}x${defaultSize}/EEE/999?text=No+Avatar`;
  
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  return `http://localhost:8080/uploads/users/${avatar}`;
};

// Ánh xạ nhóm máu từ mã sang nhãn hiển thị
export const getBloodTypeLabel = (bloodType) => {
  const bloodTypeMap = {
    'A_POSITIVE': 'A+',
    'A_NEGATIVE': 'A-',
    'B_POSITIVE': 'B+',
    'B_NEGATIVE': 'B-',
    'AB_POSITIVE': 'AB+',
    'AB_NEGATIVE': 'AB-',
    'O_POSITIVE': 'O+',
    'O_NEGATIVE': 'O-'
  };
  return bloodTypeMap[bloodType] || bloodType;
};

// Xử lý dữ liệu từ response API
export const processApiResponse = (response) => {
  // Trường hợp response là mảng dữ liệu
  if (Array.isArray(response)) {
    return response;
  }
  
  // Trường hợp response có cấu trúc { data: [...] }
  if (response && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Trường hợp response là một đối tượng
  if (response && typeof response === 'object') {
    // Đối tượng đơn lẻ có thuộc tính id
    if (response.id !== undefined) {
      return [response];
    }
    
    // Đối tượng chứa mảng
    if (Array.isArray(Object.values(response)[0])) {
      return Object.values(response)[0];
    }
  }
  
  // Mặc định trả về mảng rỗng
  return [];
};

// Xử lý dữ liệu từ response API cho đối tượng đơn
export const processDetailResponse = (response) => {
  if (response && response.data) {
    return response.data;
  }
  
  if (response && !response.data) {
    return response;
  }
  
  return null;
};

/**
 * ======================================
 * PATIENT PROFILE LIST HOOK
 * ======================================
 */
export function usePatientProfile() {
  const toast = useToast();
  const confirm = useConfirm();
  
  // State
  const patientProfiles = ref([]);
  const selectedPatientProfiles = ref([]);
  const isLoading = ref(false);
  const usersWithProfiles = ref(new Set());
  
  // Dialog state
  const detailDialog = ref({
    visible: false,
    data: { id: 0, userId: 0 }
  });
  
  /**
   * Lấy danh sách hồ sơ bệnh nhân
   */
  const fetchPatientProfiles = async () => {
    try {
      isLoading.value = true;
      const response = await PatientProfileService.getPatientProfiles();
      
      // Xử lý dữ liệu từ API
      const profiles = processApiResponse(response);
      
      // Cập nhật state
      patientProfiles.value = profiles;
      
      // Cập nhật danh sách người dùng đã có hồ sơ
      usersWithProfiles.value = new Set(profiles.map(profile => profile.userId));
      
      console.log('Đã tải hồ sơ bệnh nhân:', profiles);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu hồ sơ bệnh nhân:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách hồ sơ bệnh nhân',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Mở dialog xem chi tiết
   */
  const openDetailDialog = (data) => {
    detailDialog.value = {
      visible: true,
      data: { id: data.id, userId: data.userId }
    };
  };
  
  /**
   * Khóa/mở khóa hồ sơ bệnh nhân
   */
  const toggleLockStatus = (id, currentStatus) => {
    const newLockStatus = !currentStatus;
    const action = newLockStatus ? 'khóa' : 'mở khóa';
    
    confirm.require({
      message: `Bạn có chắc chắn muốn ${action} hồ sơ bệnh nhân này không?`,
      header: 'Xác nhận',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptClass: 'p-button-warning',
      accept: async () => {
        try {
          await PatientProfileService.toggleLockStatus(id, newLockStatus);
          
          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${action} hồ sơ bệnh nhân`,
            life: 3000
          });
          
          fetchPatientProfiles();
        } catch (error) {
          console.error(`Lỗi khi ${action} hồ sơ bệnh nhân:`, error);
          toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Không thể ${action} hồ sơ bệnh nhân`,
            life: 3000
          });
        }
      }
    });
  };
  
  return {
    // State
    patientProfiles,
    selectedPatientProfiles,
    isLoading,
    usersWithProfiles,
    detailDialog,
    
    // Methods
    fetchPatientProfiles,
    openDetailDialog,
    toggleLockStatus
  };
}

/**
 * ======================================
 * PATIENT PROFILE DETAIL HOOK
 * ======================================
 */
export function usePatientProfileDetail(props, emit) {
  const toast = useToast();
  const isLoading = ref(false);
  const patientProfile = ref(null);
  
  /**
   * Tải thông tin chi tiết hồ sơ bệnh nhân
   */
  const loadProfileDetails = async (profileId) => {
    if (!profileId) return;
    
    try {
      isLoading.value = true;
      const response = await PatientProfileService.getPatientProfileById(profileId);
      patientProfile.value = processDetailResponse(response);
      console.log('Chi tiết hồ sơ bệnh nhân:', patientProfile.value);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết hồ sơ bệnh nhân:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải thông tin hồ sơ bệnh nhân',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Đóng dialog
   */
  const closeDialog = () => {
    emit('update:modelValue', false);
  };
  
  // Theo dõi sự thay đổi của ID và trạng thái hiển thị
  watch(() => props.data.id, (newId) => {
    if (newId && props.modelValue) {
      loadProfileDetails(newId);
    }
  });
  
  watch(() => props.modelValue, (isVisible) => {
    if (isVisible && props.data.id) {
      loadProfileDetails(props.data.id);
    }
  });
  
  return {
    isLoading,
    patientProfile,
    loadProfileDetails,
    closeDialog
  };
}