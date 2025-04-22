import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

export const DiscountService = {
  async getDiscounts() {
    return await sendGet(`${API_BASE_URL}/discounts`);  
  },

  async getDiscountById(id) {
    return await sendGet(`${API_BASE_URL}/discounts/${id}`);
  },

  async saveDiscount(data) {
    const payload = {
      id: data.id,
      code: data.code,
      name: data.name,
      medicineId: data.medicineId,
      discountPercentage: data.discountPercentage,
      startDate: data.startDate,
      endDate: data.endDate
    };
    
    const response = await sendPost(`${API_BASE_URL}/discounts/save`, payload);  
    return response.data;
  },

  async deleteDiscounts(ids) {
    const response = await sendDelete(`${API_BASE_URL}/discounts/delete`, ids);  
    return response.data;
  },

  async findByCode(code) {
    return await sendGet(`${API_BASE_URL}/discounts/search/code/${code}`);
  },

  async findByMedicineId(medicineId) {
    return await sendGet(`${API_BASE_URL}/discounts/search/medicine/${medicineId}`);
  },

  async searchDiscounts(params) {
    return await sendGet(`${API_BASE_URL}/discounts/search`, { params }); 
  }
};