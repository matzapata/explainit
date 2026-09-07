import { apiService } from "@/lib/services/api-service"
import { AxiosInstance } from "axios"

export interface UserDto {
    id: string;
    email: string;
    name?: string;
    isAdmin?: boolean;
}

export class UserService {

    constructor(private readonly client: AxiosInstance) { }

    async get(accessToken: string): Promise<UserDto> {
        const res = await this.client.get('/api/users', { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }
}

export const userService = new UserService(apiService.client)