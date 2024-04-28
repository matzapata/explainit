import { apiService } from "@/lib/services/api-service"
import { AxiosInstance } from "axios"

interface UserDto {
    id: string;
    email: string;
    name?: string;
}

export class UserService {

    constructor(private readonly client: AxiosInstance) { }

    async get(accessToken: string): Promise<UserDto> {
        const res = await this.client.get('/api/users', { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }

    async updateName(accessToken: string, name: string, surname: string): Promise<UserDto> {
        const res = await this.client.put('/api/users', { name: name + ' ' + surname }, { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }
}

export const userService = new UserService(apiService.client)