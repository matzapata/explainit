import axios, { AxiosInstance } from 'axios';
import { apiBaseUrl } from '@/lib/auth/config';

export class ApiService {
  private readonly _client: AxiosInstance;

  constructor() {
    this._client = axios.create({
      baseURL: apiBaseUrl(),
    });
  }

  public get client() {
    return this._client;
  }
}

export const apiService = new ApiService();
