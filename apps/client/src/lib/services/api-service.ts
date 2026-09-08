import axios, { type AxiosInstance } from 'axios';
import { apiBaseUrl } from '@/lib/auth/config';

export class ApiService {
  private readonly _client: AxiosInstance;

  constructor() {
    this._client = axios.create();
    this._client.interceptors.request.use((config) => {
      config.baseURL = apiBaseUrl();
      return config;
    });
  }

  public get client() {
    return this._client;
  }
}

export const apiService = new ApiService();
