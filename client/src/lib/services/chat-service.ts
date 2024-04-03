import { apiService } from "@/lib/services/api-service"
import { AxiosInstance, AxiosProgressEvent } from "axios";

export interface ChatMetadataDto {
    id: string;
    name: string;
    logo: string;
    url: string;
    conversationStarters: string[];
    published: boolean;
    resources: ChatResource[];
}

export enum MessageRole {
    user = 'USER',
    ai = 'AI',
}

export interface ChatMessage {
    content: string;
    role: MessageRole;
    context: { pageContent: string, metadata: any }[];
}

export interface ChatResource {
    id: string;
    type: string;
    data: string;
}

export class ChatService {

    constructor(private readonly client: AxiosInstance) { }

    async getOwnerChat(accessToken: string): Promise<ChatMetadataDto> {
        const res = await this.client.get("/api/chat", { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }

    async updateOwnerChat(accessToken: string, data: { name?: string, url?: string, conversationStarters?: string[] }): Promise<ChatMetadataDto> {
        // name, website, conversation starters, published
        const res = await this.client.put("/api/chat", data, { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }

    async updateOwnerChatLogo(accessToken: string, file: File, onUploadProgress?: (progress: number) => void): Promise<ChatMetadataDto> {
        const formData = new FormData()
        formData.append("file", file)

        const res = await this.client.put("/api/chat/logo", formData, {
            headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${accessToken}` },
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent?.total ?? 1))
                onUploadProgress?.(percentCompleted)
            },
        })
        return { ...res.data, createdAt: new Date(res.data.createdAt) }
    }

    async getChat(id: string): Promise<ChatMetadataDto> {
        // get chat by id public
        throw new Error("Not implemented")
    }

    async postMessage(accessToken: string, id: string, message: string): Promise<ChatMessage> {
        const res = await this.client.post(`/api/chat/${id}`, { message }, { headers: { Authorization: `Bearer ${accessToken}` } })
        return {
            content: res.data.answer,
            role: MessageRole.ai,
            context: res.data.context
        }
    }

    async addResource(accessToken: string, data: string): Promise<ChatMetadataDto> {
        throw new Error("Not implemented")
    }


}

export const chatService = new ChatService(apiService.client)