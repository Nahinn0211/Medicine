import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

// Định nghĩa mẫu dữ liệu mặc định cho vai trò mới
export const ROLE_DEFAULTS = {
  id: 0,
  name: ''
};

// Hàm kiểm tra tính hợp lệ của dữ liệu vai trò
export const validateRoleData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Vui lòng nhập tên vai trò');
  }
  
  return errors;
};

export const RoleService = {
  // Lấy tất cả vai trò
  async getRoles() {
    return await sendGet(`${API_BASE_URL}/roles`);
  },

  // Lấy vai trò theo ID
  async getRoleById(id) {
    return await sendGet(`${API_BASE_URL}/roles/${id}`);
  },

  // Lấy vai trò theo tên
  async getRoleByName(name) {
    return await sendGet(`${API_BASE_URL}/roles/by-name/${encodeURIComponent(name)}`);
  },

  // Thêm mới hoặc cập nhật vai trò
  async saveRole(data) {
    // Đảm bảo dữ liệu đúng định dạng khi gửi lên
    const payload = {
      id: data.id,
      name: data.name
    };
    
    const response = await sendPost(`${API_BASE_URL}/roles/save`, payload);
    return response.data;
  },

  // Xóa một hoặc nhiều vai trò
  async deleteRoles(ids) {
    const response = await sendDelete(`${API_BASE_URL}/roles`, ids);
    return response.data;
  }
};