import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';

export const DoctorService = {
  // Lấy tất cả các dịch vụ bác sĩ
  async getAllDoctorServices() {
    return await sendGet("http://localhost:8080/api/doctor-services");
  },

  // Lấy dịch vụ bác sĩ theo ID
  async getDoctorServiceById(id) {
    return await sendGet(`http://localhost:8080/api/doctor-services/${id}`);
  },

  // Lấy dịch vụ theo ID bác sĩ
  async getDoctorServicesByDoctorId(doctorId) {
    return await sendGet(`http://localhost:8080/api/doctor-services/doctor/${doctorId}`);
  },
  async getDoctorServicesByServiceId(serviceId) {
    return await sendGet(`http://localhost:8080/api/doctor-services/service/${serviceId}`);
  },
  // Tạo mới dịch vụ bác sĩ
  async createDoctorService(doctorServiceData) {
    return await sendPost("http://localhost:8080/api/doctor-services", doctorServiceData);
  },

  // Cập nhật dịch vụ bác sĩ
  async updateDoctorService(id, doctorServiceData) {
    return await sendPut(`http://localhost:8080/api/doctor-services/${id}`, doctorServiceData);
  },

  // Xóa dịch vụ bác sĩ
  async deleteDoctorService(id) {
    return await sendDelete(`http://localhost:8080/api/doctor-services/${id}`);
  }
};