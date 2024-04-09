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
    user = 'user',
    ai = 'ai',
}

export interface ChatMessage {
    content: string;
    role: MessageRole;
    context: { content: string, metadata: { source: string, title: string } }[];
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

    async updateOwnerChat(accessToken: string, data: { name?: string, url?: string, conversationStarters?: string[], published?: boolean }): Promise<ChatMetadataDto> {
        try {
            // name, website, conversation starters, published
            const res = await this.client.put("/api/chat", data, { headers: { Authorization: `Bearer ${accessToken}` } })
            return res.data
        } catch (error: any) {
            console.error(error)
            throw new Error("Failed to update chat. " + error?.response?.data?.message ?? "")
        }
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
        const res = await this.client.get(`/api/chat/${id}`)
        return res.data
    }

    async postMessage(id: string, question: string, chatHistory?: { message: string, agent: MessageRole }[] ): Promise<ChatMessage> {
        const res = await this.client.post(`/api/chat/${id}`, { question, chatHistory: chatHistory ?? [] })
        return {
            content: res.data.answer,
            role: MessageRole.ai,
            context: res.data.context
        }
    }

    async addWebResource(accessToken: string, urls: string[]): Promise<ChatResource[]> {
        try {
            // name, website, conversation starters, published
            const res = await this.client.post("/api/chat/resources/web", { urls }, { headers: { Authorization: `Bearer ${accessToken}` } })
            return res.data
        } catch (error: any) {
            console.error(error)
            throw new Error(error?.response?.data?.message ?? "")
        }
    }

    async addTextResource(accessToken: string, text: string, title: string, source: string): Promise<ChatResource[]> {
        try {
            // name, website, conversation starters, published
            const res = await this.client.post("/api/chat/resources/text", { text, title, source }, { headers: { Authorization: `Bearer ${accessToken}` } })
            return res.data
        } catch (error: any) {
            console.error(error)
            throw new Error(error?.response?.data?.message ?? "")
        }
    }


    async inspectResource(accessToken: string, url: string): Promise<{ urls: string[] }> {
        const res = await this.client.post("/api/chat/resources/web/inspect", { url }, { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }

    async deleteResource(accessToken: string, id: string): Promise<string> {
        await this.client.delete(`/api/chat/resources/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        return id
    }
}

export const chatService = new ChatService(apiService.client)