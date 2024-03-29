import axios, { AxiosInstance } from "axios"

export class ApiService {
    private readonly _client: AxiosInstance;

    constructor() {

        this._client = axios.create({
            // On server side we're using the nginx container as a proxy to the api
            baseURL: typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_SERVER_BASE_URL : process.env.NEXT_PUBLIC_API_CLIENT_BASE_URL,
        });
    }

    public get client() {
        return this._client;
    }
}

export const apiService = new ApiService()