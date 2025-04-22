import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

export const DoctorProfileService = {
  // Lấy tất cả hồ sơ bác sĩ
  async getDoctorProfiles() {
    try {
      const response = await sendGet(`${API_BASE_URL}/doctor-profiles`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách hồ sơ bác sĩ:', error);
      throw error;
    }
  },

  // Lấy hồ sơ bác sĩ theo ID
  async getDoctorProfileById(id) {
    if (!id) {
      throw new Error('ID bác sĩ không hợp lệ');
    }
    try {
      const response = await sendGet(`${API_BASE_URL}/doctor-profiles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy hồ sơ bác sĩ với ID ${id}:`, error);
      throw error;
    }
  },
  async getDoctorProfileByUserId(id) {
    if (!id) {
      throw new Error('ID bác sĩ không hợp lệ');
    }
    try {
      const response = await sendGet(`${API_BASE_URL}/doctor-profiles/by-user/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy hồ sơ bác sĩ với ID ${id}:`, error);
      throw error;
    }
  },

  // Thêm mới hoặc cập nhật hồ sơ bác sĩ
  async saveDoctorProfile(data) {
    // Kiểm tra dữ liệu đầu vào
    if (!data || !data.userId) {
      throw new Error('Dữ liệu bác sĩ không hợp lệ');
    }

    // Chuẩn bị payload
    const payload = {
      userId: data.userId,
      experience: data.experience || '',
      specialization: data.specialization || '',
      workplace: data.workplace || '',
      accountBalance: data.accountBalance || 0,
      certifications: data.certifications || '',
      biography: data.biography || '',
      availableFrom: data.availableFrom,
      availableTo: data.availableTo,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true
    };

    // Thêm ID vào payload chỉ khi là cập nhật (ID > 0)
    if (data.id) {
      payload.id = data.id;
    }

    try {
      const response = await sendPost(`${API_BASE_URL}/doctor-profiles/save`, payload);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lưu hồ sơ bác sĩ:', error);
      throw error;
    }
  },

  // Xóa hồ sơ bác sĩ
  async deleteDoctorProfile(id) {
    if (!id) {
      throw new Error('ID bác sĩ không hợp lệ');
    }
    try {
      const response = await sendDelete(`${API_BASE_URL}/doctor-profiles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi xóa hồ sơ bác sĩ với ID ${id}:`, error);
      throw error;
    }
  },

  // Xóa nhiều hồ sơ bác sĩ
  async deleteDoctorProfiles(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('Danh sách ID không hợp lệ');
    }
    try {
      const response = await sendPost(`${API_BASE_URL}/doctor-profiles/delete-multiple`, ids);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa nhiều hồ sơ bác sĩ:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái hoạt động của bác sĩ
  async updateAvailabilityStatus(id, isAvailable) {
    if (!id) {
      throw new Error('ID bác sĩ không hợp lệ');
    }
    try {
      const response = await sendPut(`${API_BASE_URL}/doctor-profiles/${id}/availability`, {
        isAvailable
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật trạng thái hoạt động của bác sĩ ${id}:`, error);
      throw error;
    }
  },

  // Tìm kiếm hồ sơ bác sĩ
  async searchDoctorProfiles(params) {
    try {
      const response = await sendGet(`${API_BASE_URL}/doctor-profiles/search`, { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm hồ sơ bác sĩ:', error);
      throw error;
    }
  }
};

export default DoctorProfileService;