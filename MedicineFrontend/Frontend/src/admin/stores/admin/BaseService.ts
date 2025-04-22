import axios, { AxiosInstance } from 'axios';

export class BaseService {
    private static BASE_URL = 'http://localhost:8080/api';
    protected apiClient: AxiosInstance;
    protected endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
        this.apiClient = axios.create({
            baseURL: `${BaseService.BASE_URL}/${endpoint}`,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    protected async handleRequest<T>(
        requestFn: () => Promise<T>, 
        errorMessage: string
    ): Promise<T | null> {
        try {
            return await requestFn();
        } catch (error) {
            console.error(errorMessage, error);
            return null;
        }
    }
}