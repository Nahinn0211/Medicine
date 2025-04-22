import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios'; 
import { API_BASE_URL } from '@/config/apiConfig';
import axios from 'axios';

export const USER_DEFAULTS = {
  id: 0,
  fullName: '',
  phone: '',
  address: '',
  email: '',
  password: '',
  enabled: true,
  locked: false,
  countLock: 0,
  avatar: null,
  createdAt: null,
  updatedAt: null
};

// Hàm chuẩn hóa dữ liệu người dùng
export const normalizeUserData = (user) => {
  const normalizedUser = { ...user };

  // Chuyển đổi chuỗi ngày thành đối tượng Date nếu cần
  if (normalizedUser.createdAt && typeof normalizedUser.createdAt === 'string') {
    normalizedUser.createdAt = new Date(normalizedUser.createdAt);
  }

  if (normalizedUser.updatedAt && typeof normalizedUser.updatedAt === 'string') {
    normalizedUser.updatedAt = new Date(normalizedUser.updatedAt);
  }

  return normalizedUser;
};

// Hàm kiểm tra tính hợp lệ của dữ liệu người dùng
export const validateUserData = (data, isEditMode = false) => {
  const errors = [];

  if (!data.fullName || data.fullName.trim() === '') {
    errors.push('Vui lòng nhập họ tên');
  }

  if (!data.email || data.email.trim() === '') {
    errors.push('Vui lòng nhập email');
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Email không hợp lệ');
  }

  if (!isEditMode && (!data.password || data.password.trim() === '')) {
    errors.push('Vui lòng nhập mật khẩu');
  } else if (!isEditMode && data.password && data.password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  }

  if (data.phone && !/^\d{10,11}$/.test(data.phone)) {
    errors.push('Số điện thoại không hợp lệ');
  }

  return errors;
};

// Hàm format ngày tháng
export const formatDate = (dateString) => {
  if (!dateString) return '---';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Hàm xử lý URL avatar
export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;

  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }

  return `${API_BASE_URL}/uploads/users/${avatar}`;
};

// Hàm chuẩn hóa dữ liệu người dùng theo định dạng SaveUserDTO
// Loại bỏ createdAt và updatedAt khi gửi lên server
const prepareUserData = (userData) => {
  // Đảm bảo dữ liệu đúng định dạng SaveUserDTO và loại bỏ createdAt, updatedAt
  return {
    id: userData.id || 0,
    fullName: userData.fullName || '',
    email: userData.email || '',
    password: userData.password || null,
    phone: userData.phone || '',
    address: userData.address || '',
    avatar: userData.avatar || null,
    enabled: userData.enabled === undefined ? true : userData.enabled,
    locked: userData.locked === undefined ? false : userData.locked,
    countLock: userData.countLock || 0
    // Không thêm createdAt và updatedAt
  };
};

export const UserService = {
  // Get all users
  async getUsers() {
    return await sendGet(`${API_BASE_URL}/users`);
  },

  // Get user by ID
  async getUserById(id) {
    return await sendGet(`${API_BASE_URL}/users/${id}`);
  },

  // Create or update user (JSON data)
  async saveUser(data) {
    // Khi gửi trong định dạng JSON, cần tách riêng user và roleIds
    const { user, roleIds } = data;
    
    // Chuẩn bị payload đúng định dạng
    const payload = {
      user: prepareUserData(user || data), // Hỗ trợ cả 2 cách truyền dữ liệu
      roleIds: roleIds || (data.roleIds || [])
    };
    
    return await sendPost(`${API_BASE_URL}/users`, payload);
  },

  // Save user with avatar
  async saveUserWithAvatar(formData) {
    // Kiểm tra xem formData đã có dữ liệu user dưới dạng JSON string chưa
    let hasUserJson = false;
    for (let [key] of formData.entries()) {
      if (key === 'user') {
        hasUserJson = true;
        break;
      }
    }
    
    // Nếu chưa có, tạo formData mới với định dạng đúng
    if (!hasUserJson) {
      const newFormData = new FormData();
      
      // Lấy dữ liệu user từ formData cũ
      let userData = {};
      let fileData = null;
      let roleIds = [];
      
      for (let [key, value] of formData.entries()) {
        if (key === 'file') {
          fileData = value;
        } else if (key.includes('roleIds')) {
          roleIds.push(value);
        } else if (key !== 'createdAt' && key !== 'updatedAt') { // Loại bỏ createdAt và updatedAt
          // Các trường khác thuộc về user
          userData[key] = value;
        }
      }
      
      // Thêm dữ liệu user dưới dạng JSON string
      newFormData.append('user', JSON.stringify(prepareUserData(userData)));
      
      // Thêm file nếu có
      if (fileData) {
        newFormData.append('file', fileData);
      }
      
      // Thêm roleIds nếu có
      roleIds.forEach(roleId => {
        newFormData.append('roleIds[]', roleId);
      });
      
      formData = newFormData;
    }
    
    // Sử dụng custom config để đặt đúng Content-Type
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    // Đảm bảo axios interceptor vẫn thêm token vào header
    const token = localStorage.getItem('access-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return await sendPost(`${API_BASE_URL}/users/save`, formData, config);
  },

  // Xóa người dùng - một hàm duy nhất để xóa một hoặc nhiều người dùng
  async deleteUsers(ids) {
    // Đảm bảo ids luôn là mảng
    const idArray = Array.isArray(ids) ? ids : [ids];
    // Gửi danh sách id trong request body
    return await sendDelete(`${API_BASE_URL}/users`, idArray);
  },

  // Find user by email
  async findByEmail(email) {
    return await sendGet(`${API_BASE_URL}/users/by-email`, { email });
  },

  // Search users by different criteria
  async searchUsers(params) {
    return await sendGet(`${API_BASE_URL}/users/search`, params);
  },

  // Get users by enabled status
  async getUsersByEnabled(enabled) {
    return await sendGet(`${API_BASE_URL}/users/by-enabled`, { enabled });
  },

  // Get users by locked status
  async getUsersByLocked(locked) {
    return await sendGet(`${API_BASE_URL}/users/by-locked`, { locked });
  },

  // Change user password
  async changePassword(userId, oldPassword, newPassword) {
    // Sử dụng params trong config thay vì chuỗi query
    const config = {
      params: {
        oldPassword,
        newPassword
      }
    };
    return await sendPut(`${API_BASE_URL}/users/change-password/${userId}`, null, config);
  },

  // Get user profiles (doctors, patients, etc.)
  async getUserProfiles() {
    return await sendGet(`${API_BASE_URL}/users/listUserProfiles`);
  },

  // Get all doctors
  async getAllUsersRoleDoctor() {
    return await sendGet(`${API_BASE_URL}/users/listUserDoctor`);
  },

  // Get all patients
  async getAllUsersRoleUser() {
    return await sendGet(`${API_BASE_URL}/users/listUserByUser`);
  },

  // Register new user
  async registerUser(data) {
    try {
      // Prepare user data according to API requirements
      const payload = prepareUserData(data);
      
      // Call register API
      const response = await sendPost(`${API_BASE_URL}/auth/register`, payload);
      
      // Save token if provided
      if (response.data && response.data.token) {
        localStorage.setItem('access-token', response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
};