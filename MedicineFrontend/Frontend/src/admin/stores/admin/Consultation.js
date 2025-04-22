import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

 
export const ConsultationService = {
   async getConsultations() {
    return await sendGet(`${API_BASE_URL}/consultations`);
  },

  // Lấy chi tiết buổi tư vấn theo ID
  async getConsultationById(id) {
    return await sendGet(`${API_BASE_URL}/consultations/${id}`);
  },

  // Tạo hoặc cập nhật buổi tư vấn
  async saveConsultation(consultationData) {
    return await sendPost(`${API_BASE_URL}/consultations`, consultationData);
  },

  // Xóa buổi tư vấn
  async deleteConsultation(id) {
    return await sendDelete(`${API_BASE_URL}/consultations/${id}`);
  },

  // Lấy danh sách buổi tư vấn theo ID bệnh nhân
  async getConsultationsByPatientId(patientId) {
    return await sendGet(`${API_BASE_URL}/consultations/patient/${patientId}`);
  },

  // Bắt đầu buổi tư vấn
  async startConsultationSession(sessionData) {
    return await sendPost(`${API_BASE_URL}/consultations/start-session`, sessionData);
  },

  // Kết thúc buổi tư vấn
  async endConsultationSession(sessionData) {
    return await sendPost(`${API_BASE_URL}/consultations/end-session`, sessionData);
  },

  // Bật/tắt video stream
  async toggleVideoStream(consultationId, userId, isEnabled) {
    return await sendPost(`${API_BASE_URL}/consultations/${consultationId}/toggle-video?userId=${userId}&isEnabled=${isEnabled}`);
  },

  // Lấy phiên đang hoạt động
  async getActiveSession(consultationId) {
    return await sendGet(`${API_BASE_URL}/consultations/${consultationId}/active-session`);
  },

  // Gửi tin nhắn chat
  async sendChatMessage(messageData) {
    return await sendPost(`${API_BASE_URL}/consultations/chat`, messageData);
  },

  // Lấy lịch sử chat
  async getChatHistory(historyData) {
    return await sendPost(`${API_BASE_URL}/consultations/chat-history`, historyData);
  },

  // Đánh dấu tin nhắn đã đọc
  async markMessagesAsRead(consultationId, userId) {
    return await sendPost(`${API_BASE_URL}/consultations/${consultationId}/mark-read?userId=${userId}`);
  },

  // Các hàm tiện ích
  
  // Format thời gian
  formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Lấy label trạng thái
  getStatusLabel(status) {
    const statusMap = {
      'PENDING': 'Đang chờ',
      'ACTIVE': 'Đang diễn ra',
      'COMPLETED': 'Đã hoàn thành',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
  },

  // Lấy class CSS theo trạng thái
  getStatusClass(status) {
    const statusClasses = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'ACTIVE': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || '';
  },

  // Kiểm tra xem buổi tư vấn có thể bắt đầu được không
  canStartSession(consultation) {
    return consultation.status === 'PENDING';
  },

  // Kiểm tra xem buổi tư vấn có thể kết thúc được không
  canEndSession(consultation) {
    return consultation.status === 'ACTIVE';
  }
};