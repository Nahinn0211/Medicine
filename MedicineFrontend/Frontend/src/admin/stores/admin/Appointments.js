  import { sendDelete, sendGet, sendPost, sendPut } from "@admin/services/axios";
  import { API_BASE_URL } from '@/config/apiConfig';

  export const AppointmentService = {
   

    // Lấy thông tin cuộc hẹn theo ID service booking
    async getAppointmentByServiceBookingId(serviceBookingId) {
      return await sendGet(`${API_BASE_URL}/appointments/service-bookings/${serviceBookingId}`);
    },

    // Lấy danh sách cuộc hẹn theo ID bác sĩ
    async getAppointmentsByDoctorId(doctorId) {
      return await sendGet(`${API_BASE_URL}/appointments/doctor/${doctorId}`);
    },

    // Lấy danh sách cuộc hẹn theo ID bệnh nhân
    async getAppointmentsByPatientId(patientId) {
      return await sendGet(`${API_BASE_URL}/appointments/patient/${patientId}`);
    },

    // Lấy danh sách tất cả cuộc hẹn
    async getAllAppointments() {
      return await sendGet(`${API_BASE_URL}/appointments`);
    },

    // Lấy chi tiết cuộc hẹn theo ID
    async getAppointmentById(id) {
      return await sendGet(`${API_BASE_URL}/appointments/${id}`);
    },

    // Lưu hoặc cập nhật cuộc hẹn
    async saveOrUpdateAppointment(appointmentData) {
      return await sendPost(`${API_BASE_URL}/appointments/save`, appointmentData);
    },

    // Xóa cuộc hẹn
    async deleteAppointments(ids) {
      return await sendDelete(`${API_BASE_URL}/appointments/delete`, { data: ids });
    },

    // Kiểm tra khả dụng của bác sĩ
    async checkAvailability(doctorId, date, timeSlot) {
      return await sendGet(`${API_BASE_URL}/appointments/check-availability`, {
        params: { doctorId, date, timeSlot }
      });
    },

    // Lấy các khung giờ đã được đặt
    async getBookedSlots(doctorId, date) {
      return await sendGet(`${API_BASE_URL}/appointments/booked-slots`, {
        params: { doctorId, date }
      });
    }
  };

  /**
   * Utility functions for appointments
   */

  // Format tiền tệ theo định dạng Việt Nam
  export const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  // Format ngày giờ theo định dạng Việt Nam
  export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date only
  export const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format time only
  export const formatTimeOnly = (timeObj) => {
    if (!timeObj) return 'N/A';
    
    // Xử lý trường hợp timeObj là đối tượng với hour, minute
    if (timeObj.hour !== undefined && timeObj.minute !== undefined) {
      const hour = String(timeObj.hour).padStart(2, '0');
      const minute = String(timeObj.minute).padStart(2, '0');
      return `${hour}:${minute}`;
    }
    
    // Xử lý trường hợp timeObj là chuỗi thời gian
    if (typeof timeObj === 'string') {
      if (timeObj.includes('T')) {
        // ISO string format
        const date = new Date(timeObj);
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        // Assuming HH:MM format
        return timeObj;
      }
    }
    
    return 'N/A';
  };

  // Lấy URL avatar người dùng
  export const getUserAvatar = (avatar, defaultSize = 100) => {
    if (!avatar) return `https://placehold.co/${defaultSize}x${defaultSize}/EEE/999?text=No+Avatar`;
    
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    
    return `${API_BASE_URL}/../uploads/users/${avatar}`;
  };

  // Ánh xạ nhóm máu từ mã sang nhãn hiển thị
  export const getBloodTypeLabel = (bloodType) => {
    const bloodTypeMap = {
      'A_POSITIVE': 'A+',
      'A_NEGATIVE': 'A-',
      'B_POSITIVE': 'B+',
      'B_NEGATIVE': 'B-',
      'AB_POSITIVE': 'AB+',
      'AB_NEGATIVE': 'AB-',
      'O_POSITIVE': 'O+',
      'O_NEGATIVE': 'O-'
    };
    return bloodTypeMap[bloodType] || bloodType;
  };

  // Format trạng thái cuộc hẹn
  export const getAppointmentStatusLabel = (status) => {
    const statusMap = {
      'SCHEDULED': 'Đã lên lịch',
      'CONFIRMED': 'Đã xác nhận',
      'CANCELLED': 'Đã hủy',
      'COMPLETED': 'Hoàn thành',
      'NO_SHOW': 'Không đến',
      'PENDING': 'Đang chờ'
    };
    return statusMap[status] || status;
  };

  // Lấy class CSS cho trạng thái cuộc hẹn
  export const getAppointmentStatusClass = (status) => {
    const classMap = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-purple-100 text-purple-800',
      'NO_SHOW': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800'
    };
    return classMap[status] || '';
  };