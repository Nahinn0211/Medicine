import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios'; 
import { API_BASE_URL } from '@/config/apiConfig';  

export const Medicines = {
   async getMedicines() {
    return await sendGet(`${API_BASE_URL}/medicines`);
  },
  
  async getMedicineById(id) {
    return await sendGet(`${API_BASE_URL}/medicines/${id}`);
  },
  
  async getMedicineDetails(id) {
    return await sendGet(`${API_BASE_URL}/medicines/${id}/details`);
  },
  
  async deleteMedicines(ids) {
    return await sendPost(`${API_BASE_URL}/medicines/delete`, ids);
  },
  
  async searchMedicines(params) {
    return await sendGet(`${API_BASE_URL}/medicines/search`, { params });
  },
  
  async getBestSellingMedicines() {
    return await sendGet(`${API_BASE_URL}/medicines/best-selling`);
  },
  
  async getNewestMedicines() {
    return await sendGet(`${API_BASE_URL}/medicines/newest`);
  },
  
  // Phương thức chính để lưu thuốc và mọi thông tin liên quan
  async save(medicineData, files = [], categoryIds = [], mainImageIndex = 0) {
    // Tạo FormData để gửi multipart/form-data
    const formData = new FormData();
    
    // Chuẩn bị dữ liệu thuốc
    const medicinePayload = {
      id: medicineData.id,
      code: medicineData.code,
      name: medicineData.name,
      description: medicineData.description || '',
      brandId: medicineData.brandId,
      origin: medicineData.origin || '',
      isPrescriptionRequired: medicineData.isPrescriptionRequired || false,
      usageInstruction: medicineData.usageInstruction || '',
      dosageInstruction: medicineData.dosageInstruction || '',
      // Đảm bảo thuộc tính đúng định dạng
      attributes: Array.isArray(medicineData.attributes) ? 
        medicineData.attributes.map(attr => ({
          id: attr.id || null,
          name: attr.name,
          priceIn: attr.priceIn,
          priceOut: attr.priceOut,
          stock: attr.stock,
          expiryDate: attr.expiryDate,
          medicineId: medicineData.id || null
        })) : []
    };
    
    // Thêm thông tin thuốc dưới dạng JSON
    formData.append('medicineJson', JSON.stringify(medicinePayload));
    
    // Thêm danh sách categoryIds
    if (categoryIds && categoryIds.length > 0) {
      formData.append('categoryIds', JSON.stringify(categoryIds));
    }
    
    // Thêm chỉ số ảnh chính
    if (mainImageIndex >= 0) {
      formData.append('mainImageIndex', mainImageIndex.toString());
    }
    
    // Thêm các file ảnh
    if (files && files.length > 0) {
      files.forEach(file => {
        if (file instanceof File) {
          formData.append('images', file);
        }
      });
    }
    
    // Gửi request đến API endpoint
    try {
      const response = await sendPost(`${API_BASE_URL}/medicines/save`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response;
    } catch (error) {
      console.error('Lỗi khi lưu thuốc:', error);
      throw error;
    }
  }
};