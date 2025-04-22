import { sendDelete, sendGet, sendPost, sendPut, sendPatch } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

const SERVICE_BOOKINGS_ENDPOINT = `${API_BASE_URL}/service-bookings`;

export const ServiceBookingService = {
   
  async getServiceBookings() {
    return await sendGet(SERVICE_BOOKINGS_ENDPOINT);
  },

  async getUserServiceBookings() {
    return await sendGet(`${SERVICE_BOOKINGS_ENDPOINT}/getUserServiceBookings`);
  },
   
  async getServiceBookingById(id) {
    return await sendGet(`${SERVICE_BOOKINGS_ENDPOINT}/${id}`);
  },

  // Tạo mới một đặt lịch
  async createServiceBooking(bookingData) {
    return await sendPost(`${SERVICE_BOOKINGS_ENDPOINT}`, bookingData);
  },

  // Cập nhật một đặt lịch
  async updateServiceBooking(bookingData) {
    return await sendPut(`${SERVICE_BOOKINGS_ENDPOINT}/${bookingData.id}`, bookingData);
  },

  // API mới: Chỉ cập nhật status và totalPrice
  async updateStatusAndPrice(id, data) {
    return await sendPut(`${SERVICE_BOOKINGS_ENDPOINT}/${id}/status-price`, data);
  },

  // Xóa một hoặc nhiều đặt lịch
  async deleteServiceBookings(ids) {
    return await sendDelete(SERVICE_BOOKINGS_ENDPOINT, { data: ids });
  },

  // Lấy đặt lịch theo ID dịch vụ
  async getServiceBookingsByServiceId(serviceId) {
    return await sendGet(`${SERVICE_BOOKINGS_ENDPOINT}/service/${serviceId}`);
  },

  // Lấy đặt lịch theo ID bệnh nhân
  async getServiceBookingsByPatientId(patientId) {
    return await sendGet(`${SERVICE_BOOKINGS_ENDPOINT}/patient/${patientId}`);
  },

  // Lấy đặt lịch theo trạng thái
  async getServiceBookingsByStatus(status) {
    return await sendGet(`${SERVICE_BOOKINGS_ENDPOINT}/status/${status}`);
  },

  // Hủy đặt lịch
  async cancelServiceBooking(id) {
    return await sendPost(`${SERVICE_BOOKINGS_ENDPOINT}/${id}/cancel`);
  }
};