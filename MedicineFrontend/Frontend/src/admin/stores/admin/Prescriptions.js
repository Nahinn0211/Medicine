import { sendDelete, sendGet, sendPost, sendPut } from "@admin/services/axios";
import { API_BASE_URL } from '@/config/apiConfig';

export const PrescriptionService = {
    // Lấy thông tin cuộc tư vấn theo mã code
    async getConsultationByCode(code) {
        try {
            console.log(`Fetching consultation with code: ${code}`);
            const response = await sendGet(`${API_BASE_URL}/consultations/code/${code}`);
            console.log("Consultation response:", response);
            return response;
        } catch (error) {
            console.error("Error fetching consultation:", error);
            throw error;
        }
    },
    
    // Lấy thông tin cuộc hẹn theo ID
    async getAppointmentById(id) {
        try {
            console.log(`Fetching appointment with ID: ${id}`);
            const response = await sendGet(`${API_BASE_URL}/appointments/${id}`);
            console.log("Appointment response:", response);
            return response;
        } catch (error) {
            console.error("Error fetching appointment:", error);
            throw error;
        }
    },
    
    // Lấy danh sách thuốc
    async getMedicines() {
        try {
            console.log("Fetching medicines");
            const response = await sendGet(`${API_BASE_URL}/medicines`);
            console.log("Medicines response:", response);
            
            // Xử lý và chuyển đổi dữ liệu thuốc để phù hợp với giao diện
            const formattedMedicines = response.data.map(medicine => ({
                id: medicine.id,
                name: medicine.name,
                dosageForm: medicine.attributes && medicine.attributes[0] ? medicine.attributes[0].name : "Viên",
                strength: medicine.dosageInstruction || "N/A",
                manufacturer: medicine.brand ? medicine.brand.name : "Không xác định",
                category: medicine.categories && medicine.categories[0] ? medicine.categories[0].name : "Khác",
                price: medicine.attributes && medicine.attributes[0] ? medicine.attributes[0].priceOut : medicine.minPrice,
                unit: "Viên"
            }));
            
            return { data: formattedMedicines };
        } catch (error) {
            console.error("Error fetching medicines:", error);
            throw error;
        }
    },
    
    // Lưu đơn thuốc
    async savePrescription(prescriptionData) {
        try {
            console.log("Saving prescription data:", prescriptionData);
            const response = await sendPost(`${API_BASE_URL}/prescriptions/save`, prescriptionData);
            console.log("Prescription save response:", response);
            return response;
        } catch (error) {
            console.error("Error saving prescription:", error);
            throw error;
        }
    }
};

/**
 * Utility functions for formatting and display
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