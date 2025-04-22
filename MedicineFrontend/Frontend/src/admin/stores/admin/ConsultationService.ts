import axios, { AxiosInstance } from 'axios';
import { io } from 'socket.io-client';
import { Client, IMessage } from '@stomp/stompjs';
import { Consultation } from '@models/Consultation';

// Các interface định nghĩa
export interface ConsultationDetail {
    id: number;
    patientId: number;
    doctorId: number;
    consultationCode: string;
    doctorName?: string;
    doctorAvatar?: string;
    doctorSpecialty?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startedAt?: Date;
    endedAt?: Date;
}

export interface ChatMessage {
    id?: number;
    consultationId: number;
    senderId: number;
    senderType: 'PATIENT' | 'DOCTOR' | 'SYSTEM';
    content: string;
    timestamp: Date;
    messageType?: 'TEXT' | 'VIDEO_START' | 'VIDEO_END' | 'AUDIO_TOGGLE' | 'JOIN' | 'LEAVE' | 'SYSTEM';
}

export interface WebSocketMessage {
    type: string;
    content: any;
    consultationCode?: string;
}

export class ConsultationService {
    private baseUrl = 'http://localhost:8080/api/consultations';
    private axiosInstance: AxiosInstance;
    private stompClient: Client | null = null;
    private subscriptions: { [key: string]: any } = {};
    private reconnectTimeout: number = 5000;
    private isConnecting: boolean = false;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            headers: this.getHeaders()
        });
    }

    // Lấy headers với token
    private getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Lấy thông tin cuộc tham vấn theo mã code
    async getConsultationByCode(code: string): Promise<ConsultationDetail | null> {
        try {
            const response = await this.axiosInstance.get(`/code/${code}`);
            return response.data;
        } catch (error) {
            console.error('Không thể lấy thông tin cuộc tư vấn:', error);
            return null;
        }
    }

    async getAppointmentByServiceId(id: number) {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/consultations/by-appointment/${id}`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy cuộc tư vấn:', error);
            throw error;
        }
    }

    // Bắt đầu phiên tư vấn  
    async startConsultationSession(data: {
        consultationId: number,
        initiatorId: number,
        initiatorType: string
    }) {
        try {
            const response = await this.axiosInstance.post('/start-session', data);
            return response.data;
        } catch (error) {
            console.error('Lỗi bắt đầu phiên tư vấn:', error);
            throw error;
        }
    }

    // Kết thúc phiên tư vấn
    async endConsultationSession(data: {
        consultationId: number,
        terminatorId: number,
        terminatorType: string,
        terminationReason: string
    }) {
        try {
            const response = await this.axiosInstance.post('/end-session', data);
            return response.data;
        } catch (error) {
            console.error('Lỗi kết thúc phiên tư vấn:', error);
            throw error;
        }
    }

    // Gửi tin nhắn
    async sendChatMessage(message: ChatMessage) {
        try {
            const response = await this.axiosInstance.post('/chat', message);
            return response.data;
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            throw error;
        }
    }

    // Điều khiển video  
    async toggleVideoStream(consultationId: number, userId: number, isEnabled: boolean) {
        try {
            await this.axiosInstance.post(`/${consultationId}/toggle-video`, null, {
                params: { userId, isEnabled }
            });
        } catch (error) {
            console.error('Lỗi điều khiển video:', error);
            throw error;
        }
    }

    // Lấy lịch sử tin nhắn
    async getChatHistory(consultationId: number, fromTime?: Date, limit = 50) {
        try {
            const response = await this.axiosInstance.post('/chat-history', {
                consultationId,
                fromTime,
                limit
            });
            return response.data;
        } catch (error) {
            console.error('Lỗi lấy lịch sử tin nhắn:', error);
            throw error;
        }
    }

    // Thiết lập kết nối WebSocket
    setupWebSocketConnection(
        consultationCode: string,
        onMessageCallback: (message: any) => void,
        onOpenCallback?: () => void,
        onCloseCallback?: () => void
    ): Client | null {
        // Nếu đang trong quá trình kết nối, trả về null
        if (this.isConnecting) return null;

        this.isConnecting = true;

        // Đóng kết nối cũ nếu tồn tại  
        this.closeWebSocketConnection();

        // Tạo kết nối socket.io
        const token = localStorage.getItem('token');
        const socket = io('http://localhost:8080', {
            path: '/ws-consultation',
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: this.reconnectTimeout,

            onConnect: () => {
                console.log('Kết nối WebSocket thành công');
                this.isConnecting = false;

                // Đăng ký các kênh
                const consultationSubscription = this.stompClient?.subscribe(
                    `/topic/consultation/${consultationCode}`,
                    (message: IMessage) => {
                        try {
                            const parsedMessage = JSON.parse(message.body);
                            onMessageCallback(parsedMessage);
                        } catch (error) {
                            console.error('Lỗi xử lý tin nhắn:', error);
                        }
                    }
                );

                // Lưu subscription để có thể hủy sau này
                if (consultationSubscription) {
                    this.subscriptions[consultationCode] = consultationSubscription;
                }

                // Gọi callback khi kết nối thành công
                onOpenCallback?.();
            },

            onStompError: (frame) => {
                console.error('Lỗi STOMP:', frame);
                this.isConnecting = false;
                onCloseCallback?.();
            },

            onWebSocketClose: () => {
                console.log('Kết nối WebSocket đã đóng');
                this.isConnecting = false;
                onCloseCallback?.();
            },

            onDisconnect: () => {
                console.log('Ngắt kết nối WebSocket');
                this.isConnecting = false;
            }
        });

        // Kích hoạt kết nối
        this.stompClient.activate();

        return this.stompClient;
    }

    // Gửi tin nhắn WebSocket
    sendWebSocketMessage(consultationCode: string, message: WebSocketMessage) {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.publish({
                destination: `/app/consultation/${consultationCode}`,
                body: JSON.stringify(message)
            });
        } else {
            console.warn('WebSocket chưa được kết nối');
        }
    }

    // Đóng kết nối WebSocket
    closeWebSocketConnection() {
        // Hủy đăng ký các kênh 
        Object.values(this.subscriptions).forEach(sub => sub.unsubscribe());
        this.subscriptions = {};

        // Ngừng kết nối
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
        }
    }

    // Kiểm tra trạng thái kết nối
    isWebSocketConnected(): boolean {
        return this.stompClient !== null && this.stompClient.connected;
    }
}

export const consultationService = new ConsultationService();