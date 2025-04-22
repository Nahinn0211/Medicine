// src/services/admin/MedicineCategoryService.js
import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';

export const MedicineCategoryService = {
  // Lấy tất cả liên kết thuốc-danh mục
  // async getMedicineCategories() {
  //   return await sendGet("http://localhost:8080/api/medicine-categories");
  // },

  // Lấy liên kết thuốc-danh mục theo ID
  async getMedicineCategoryById(id) {
    return await sendGet(`http://localhost:8080/api/medicine-categories/${id}`);
  },

  // Thêm mới hoặc cập nhật liên kết thuốc-danh mục
  async saveMedicineCategory(data) {
    // Đảm bảo dữ liệu đúng định dạng khi gửi lên
    const payload = {
      medicineId: data.medicineId,
      categoryId: data.categoryId
    };
    
    // Thêm ID vào payload chỉ khi là cập nhật
    if (data.id) {
      payload.id = data.id;
    }
    
    const response = await sendPost("http://localhost:8080/api/medicine-categories/save", payload);
    return response.data;
  },

  // Xóa liên kết thuốc-danh mục
  async deleteMedicineCategory(id) {
    return await axios.delete(`http://localhost:8080/api/medicine-categories/${id}`);
  },
  
   async getMedicineCategoryByMedicineId(medicineId) {
    return await sendGet(`http://localhost:8080/api/medicine-categories/medicine/${medicineId}`);
  },
  // Trong MedicineCategoryService
async getMedicineCategories(medicineId) {
  return await sendGet(`http://localhost:8080/api/medicine-categories/by-medicine/${medicineId}`);
}

};