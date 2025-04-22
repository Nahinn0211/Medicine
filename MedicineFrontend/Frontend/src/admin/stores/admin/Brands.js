import { sendDelete, sendGet, sendPost } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

const BRANDS_ENDPOINT = `${API_BASE_URL}/brands`;

/**
 * Service quản lý thương hiệu
 */
export const Brands = {
  /**
   * Lấy danh sách tất cả thương hiệu
   * @returns {Promise<Object>} Danh sách thương hiệu
   */
  async getBrands() {
    try {
      return await sendGet(BRANDS_ENDPOINT);
    } catch (error) {
      console.error('Error in getBrands:', error);
      throw error;
    }
  },
  
  /**
   * Lấy thông tin thương hiệu theo ID
   * @param {number} id - ID của thương hiệu
   * @returns {Promise<Object>} Thông tin thương hiệu
   */
  async getBrandById(id) {
    try {
      return await sendGet(`${BRANDS_ENDPOINT}/${id}`);
    } catch (error) {
      console.error(`Error in getBrandById(${id}):`, error);
      throw error;
    }
  },
  
  /**
   * Lưu hoặc cập nhật thương hiệu
   * @param {FormData} formData - Dữ liệu thương hiệu dạng FormData
   * @returns {Promise<Object>} Thông tin thương hiệu đã lưu
   */
  async saveBrand(formData) {
    try {
      return await sendPost(`${BRANDS_ENDPOINT}/save`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Error in saveBrand:', error);
      throw error;
    }
  },
  
  /**
   * Xóa một hoặc nhiều thương hiệu
   * @param {Array|number} ids - ID hoặc mảng ID thương hiệu cần xóa
   * @returns {Promise<Object>} Kết quả xóa
   */
  async deleteBrands(ids) {
    try {
      // Đảm bảo ids luôn là một mảng
      const idsArray = Array.isArray(ids) ? ids : [ids];
      
      // Gọi API xóa
      return await sendDelete(BRANDS_ENDPOINT, { data: idsArray });
    } catch (error) {
      console.error(`Error in deleteBrands(${ids}):`, error);
      throw error;
    }
  },
  
  /**
   * Tìm kiếm thương hiệu theo tên
   * @param {string} name - Tên thương hiệu cần tìm
   * @returns {Promise<Object>} Danh sách thương hiệu phù hợp
   */
  async searchBrandByName(name) {
    try {
      return await sendGet(`${BRANDS_ENDPOINT}/search/name?name=${encodeURIComponent(name)}`);
    } catch (error) {
      console.error(`Error in searchBrandByName(${name}):`, error);
      throw error;
    }
  }
};