// src/services/admin/UserRole.js
import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';

export const UserRoleService = {
  // Lấy tất cả liên kết tài khoản-vai trò
  async getUserRoles() {
    return await sendGet("http://localhost:8080/api/user-roles");
  },

  // Lấy liên kết tài khoản-vai trò theo ID
  async getUserRoleById(id) {
    return await sendGet(`http://localhost:8080/api/user-roles/${id}`);
  },

  // Lấy tất cả vai trò của một người dùng
  async getUserRolesByUserId(userId) {
    return await sendGet(`http://localhost:8080/api/user-roles/by-user/${userId}`);
  },

  // Lấy tất cả người dùng có một vai trò
  async getUserRolesByRoleId(roleId) {
    return await sendGet(`http://localhost:8080/api/user-roles/by-role/${roleId}`);
  },

  // Thêm mới liên kết tài khoản-vai trò
  async saveUserRole(data) {
    return await sendPost("http://localhost:8080/api/user-roles/save", data);
  },

  // Xóa liên kết tài khoản-vai trò
  async deleteUserRole(id) {
    return await sendDelete(`http://localhost:8080/api/user-roles/${id}`);
  },

  // Xóa tất cả liên kết của một người dùng
  async deleteUserRolesByUserId(userId) {
    return await sendDelete(`http://localhost:8080/api/user-roles/by-user/${userId}`);
  },

  // Xóa tất cả liên kết của một vai trò
  async deleteUserRolesByRoleId(roleId) {
    return await sendDelete(`http://localhost:8080/api/user-roles/by-role/${roleId}`);
  }
};