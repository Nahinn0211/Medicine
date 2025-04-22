
import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

 export const VOUCHER_DEFAULTS = {
  id: 0,
  code: '',
  voucherPercentage: 0,
  stock: 0,
  startDate: new Date(),
  endDate: (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  })(),
  minimumOrderValue: 0,
  status: 'ACTIVE'
};

// Định nghĩa các trạng thái có thể có của voucher
export const VOUCHER_STATUS_OPTIONS = [
  { label: 'Hoạt động', value: 'ACTIVE' },
  { label: 'Hết hạn', value: 'EXPIRED' },
  { label: 'Vô hiệu hóa', value: 'DISABLED' }
];

// Hàm chuẩn hóa dữ liệu voucher (chuyển đổi định dạng ngày)
export const normalizeVoucherData = (voucher) => {
  const normalizedVoucher = { ...voucher };
  
  // Chuyển đổi chuỗi ngày thành đối tượng Date
  if (normalizedVoucher.startDate && typeof normalizedVoucher.startDate === 'string') {
    normalizedVoucher.startDate = new Date(normalizedVoucher.startDate);
  }
  
  if (normalizedVoucher.endDate && typeof normalizedVoucher.endDate === 'string') {
    normalizedVoucher.endDate = new Date(normalizedVoucher.endDate);
  }
  
  return normalizedVoucher;
};

// Hàm kiểm tra tính hợp lệ của dữ liệu voucher
export const validateVoucherData = (data) => {
  const errors = [];
  
  if (!data.code || data.code.trim() === '') {
    errors.push('Vui lòng nhập mã voucher');
  }
  
  if (data.voucherPercentage <= 0 || data.voucherPercentage > 100) {
    errors.push('Phần trăm giảm giá phải lớn hơn 0 và nhỏ hơn hoặc bằng 100');
  }
  
  if (data.stock < 0) {
    errors.push('Số lượng voucher không thể âm');
  }
  
  if (!data.startDate) {
    errors.push('Vui lòng chọn ngày bắt đầu');
  }
  
  if (!data.endDate) {
    errors.push('Vui lòng chọn ngày kết thúc');
  }
  
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    errors.push('Ngày bắt đầu phải trước ngày kết thúc');
  }
  
  if (data.minimumOrderValue < 0) {
    errors.push('Giá trị đơn hàng tối thiểu không thể âm');
  }
  
  if (!data.status) {
    errors.push('Vui lòng chọn trạng thái voucher');
  }
  
  return errors;
};

export const VoucherService = {
  // Lấy tất cả voucher
  async getVouchers() {
    return await sendGet(`${API_BASE_URL}/vouchers`);
  },

  // Lấy voucher theo ID
  async getVoucherById(id) {
    return await sendGet(`${API_BASE_URL}/vouchers/${id}`);
  },

  // Thêm mới hoặc cập nhật voucher
  async saveVoucher(data) {
    const payload = {
      id: data.id,
      code: data.code,
      voucherPercentage: data.voucherPercentage,
      stock: data.stock,
      startDate: data.startDate,
      endDate: data.endDate,
      minimumOrderValue: data.minimumOrderValue || 0, 
      status: data.status || 'ACTIVE' 
    };
    
    const response = await sendPost(`${API_BASE_URL}/vouchers/save`, payload);
    return response.data;
  },

  // Xóa một hoặc nhiều voucher
  async deleteVouchers(ids) {
    const response = await sendDelete(`${API_BASE_URL}/vouchers`, ids);
    return response.data;
  },

  // Tìm kiếm voucher theo mã
  async findByCode(code) {
    return await sendGet(`${API_BASE_URL}/vouchers/by-code/${encodeURIComponent(code)}`);
  }
};