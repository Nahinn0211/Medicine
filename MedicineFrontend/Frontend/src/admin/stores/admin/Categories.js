import { sendDelete, sendGet, sendPost } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`;

export const Categories = {
  // Lấy toàn bộ danh mục
  async getCategories() {
    return await sendGet(CATEGORIES_ENDPOINT);
  },

  // Lấy danh mục theo ID
  async getCategoryById(id) {
    return await sendGet(`${CATEGORIES_ENDPOINT}/${id}`);
  },

  // Lưu danh mục (thêm mới hoặc cập nhật)
  async saveCategory(formData) {
    return await sendPost(`${CATEGORIES_ENDPOINT}/save`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Xóa một hoặc nhiều danh mục
  async deleteCategories(ids) {
    // Đảm bảo ids luôn là một mảng
    const idsArray = Array.isArray(ids) ? ids : [ids];
    
    // Truyền mảng trực tiếp cho sendDelete
    return await sendDelete(CATEGORIES_ENDPOINT, idsArray);
  },

  // Tìm kiếm danh mục theo tên
  async searchCategoryByName(name) {
    return await sendGet(`${CATEGORIES_ENDPOINT}/search/name?name=${encodeURIComponent(name)}`);
  }
};