import { apiService } from "@/lib/services/api-service"
import { AxiosInstance } from "axios";

export interface ChatMetadataDto {
    id: string;
    name?: string;
    hostOrigins?: string[];
    conversationStarters: string[];
    published: boolean;
    description?: string;
    points: number;
    resources: ChatResource[];
}

export interface ChatResource {
    id: string;
    type: string;
    data: string;
    status?: 'pending' | 'processing' | 'ready' | 'failed';
    error?: string | null;
}

export class ChatService {

    constructor(private readonly client: AxiosInstance) { }

    async getOwnerChat(accessToken: string): Promise<ChatMetadataDto> {
        const res = await this.client.get("/api/chats", { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }

    async updateOwnerChat(accessToken: string, id: string, data: { name?: string, hostOrigins?: string[], conversationStarters?: string[], published?: boolean, description?: string }): Promise<ChatMetadataDto> {
        try {
            // name, host origins, conversation starters, published
            const res = await this.client.put(`/api/chats/${id}`, data, { headers: { Authorization: `Bearer ${accessToken}` } })
            return res.data
        } catch (error: any) {
            console.error(error)
            throw new Error("Failed to update chat. " + error?.response?.data?.message ?? "")
        }
    }

    async getChat(id: string): Promise<ChatMetadataDto> {
        const res = await this.client.get(`/api/chats/${id}`)
        return res.data
    }

    async addWebResource(accessToken: string, id: string, urls: string[]): Promise<ChatResource[]> {
        try {
            // name, website, conversation starters, published
            const res = await this.client.post(`/api/chats/${id}/resources/web`, { urls }, { headers: { Authorization: `Bearer ${accessToken}` } })
            return res.data
        } catch (error: any) {
            console.error(error)
            throw new Error(error?.response?.data?.message ?? "")
        }
    }

    async addTextResource(accessToken: string, id: string, text: string, title: string, source: string): Promise<ChatResource[]> {
        try {
            // name, website, conversation starters, published
            const res = await this.client.post(`/api/chats/${id}/resources/text`, { text, title, source }, { headers: { Authorization: `Bearer ${accessToken}` } })
            return res.data
        } catch (error: any) {
            console.error(error)
            throw new Error(error?.response?.data?.message ?? "")
        }
    }

    async inspectResource(accessToken: string, id: string, url: string): Promise<{ urls: string[] }> {
        const res = await this.client.post(`/api/chats/${id}/resources/web/inspect`, { url }, { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }

    async deleteResource(accessToken: string, id: string, resource_id: string): Promise<string> {
        await this.client.delete(`/api/chats/${id}/resources/${resource_id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        return id
    }
}

export const chatService = new ChatService(apiService.client)