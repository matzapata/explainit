

import { apiService } from "@/lib/services/api-service"
import { AxiosInstance } from "axios"

export class ContactService {

    constructor(private readonly client: AxiosInstance) { }

    async createContact(accessToken: string, message: string, subject: string): Promise<"OK"> {
        const res = await this.client.post('/api/contact', { message, subject }, { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }
}

export const contactService = new ContactService(apiService.client)