import { User } from "@models/User";
import { BaseService } from "./BaseService";
import axios from 'axios';
import { PatientProfile } from "@models/PatientProfile";
import { DoctorProfile } from "@models/DoctorProfile";

export interface Credentials {
    email: string
    password: string
}

export interface AuthState {
    user: User | null
    token: string | null
    role: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

export class AuthService extends BaseService {
    constructor() {
        super('auth');
    }

    state: AuthState = {
        user: null,
        token: null,
        role: "PATIENT",
        isAuthenticated: false,
        isLoading: false,
        error: null
    }

    async login(credentials: Credentials) {
        this.state.isLoading = true;
        this.state.error = null;

        try {
            const response = await axios.post<string>('auth/login', credentials,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    transformResponse: [data => data]
                }
            );

            if (response.data && typeof response.data === 'string') {
                const token = response.data;

                this.state.token = token;
                localStorage.setItem('token', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                await this.fetchUserInfo();

                return {
                    success: true,
                    message: 'Đăng nhập thành công'
                };
            }

            throw new Error('Không nhận được token');
        } catch (error: any) {
            console.error('Login Error:', error);

            this.state.isAuthenticated = false;
            if (error.response) {
                this.state.error = error.response.data.message || 'Đăng nhập thất bại';
            } else if (error.request) {
                this.state.error = 'Không nhận được phản hồi từ máy chủ';
            } else {
                this.state.error = error.message || 'Đăng nhập thất bại';
            }

            this.state.token = null;
            this.state.user = null;
            localStorage.removeItem('token');

            return {
                success: false,
                message: this.state.error
            };
        } finally {
            this.state.isLoading = false;
        }
    }

    async fetchUserInfo() {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<User>('auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            this.state.user = response.data;
            this.state.role = response.data.roles[0];
            this.state.isAuthenticated = true;
            localStorage.setItem('role', this.state.role);

            if (this.state.role === 'PATIENT') {
                window.location.href = '/';
            } else if (this.state.role === 'ADMIN') {
                window.location.href = '/admin';
            }else if (this.state.role === 'DOCTOR') {
                window.location.href = '/admin/doctor';
            }
        } catch (error: any) {
            this.logout();
            throw error;
        }
    }
    async getDataUser(userId: string): Promise<User | null> {
        try {
            const response = await axios.get<User>(`users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data; // Trả về dữ liệu người dùng
        }
        catch (error: any) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    async updateUserProfile(data: any, file: File | null): Promise<User | null> {
        console.log(data);

        // Create FormData to send both the user JSON and the file
        const formData = new FormData();

        // Append user data as JSON string
        formData.append("user", JSON.stringify({
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
            address: data.address,
            id: data.id,
        }));

        // Append the file if provided
        if (file) {
            formData.append("file", file);
        }

        try {
            const response = await axios.post<User>(`users/save`, formData, {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            return response.data;
        }
        catch (error: any) {
            console.error('Error updating user profile:', error);
            return null;
        }
    }

    async changePassword(data: any): Promise<User | null> {
        console.log(data);
        try {
            const response = await axios.put<User>(`users/change-password/${data.id}`, {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
        catch (error: any) {
            console.error('Error changing password:', error);
            return null;
        }
    }


    async updatePatientProfile(data: any): Promise<PatientProfile | null> {
        try {
            const response = await axios.post<User>(`patient-profiles/save`, {
                ...data,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error: any) {
            console.error('Error updating patient profile:', error);
            return null;
        }
    }

    async getDataPatient(userId: string): Promise<PatientProfile | null> {
        try {
            const response = await axios.get<User>(`patient-profiles/by-user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data; // Trả về dữ liệu người dùng
        }
        catch (error: any) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    async getDataDoctor(userId: string): Promise<DoctorProfile | null> {
        try {
            const response = await axios.get<User>(`doctor-profiles/by-user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error: any) {
            console.error('Error fetching doctor data:', error);
            return null;
        }
    }

    async updateBalance(id: number, balance: string): Promise<PatientProfile | null> {
        console.log(id, balance);
        try {
            const response = await axios.put<PatientProfile>(`patient-profiles/update/balance/${id}`, { balance }, {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error updating balance:', error);
            return null;
        }
    }

    async initializeAuth() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token) {
            this.state.token = token;
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            try {
                const response = await axios.get<User>('auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                this.state.user = response.data;
                this.state.isAuthenticated = true;

            } catch (error: any) {
                this.logout();
            }
        } else {
            this.logout();
        }
    }

    logout() {
        this.state.token = null;
        this.state.user = null;
        this.state.role = null;
        this.state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        delete axios.defaults.headers.common['Authorization'];
    }

    getUserInfo(): User | null {
        return this.state.user;
    }

    getAuthStatus(): boolean {
        return this.state.isAuthenticated;
    }

    getToken(): String {
        return this.state.token;
    }

    isAuthenticated(): boolean {
        return this.state.isAuthenticated;
    }
}

export const authService = new AuthService();