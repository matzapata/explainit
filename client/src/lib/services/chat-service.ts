import { apiService } from "@/lib/services/api-service"
import { AxiosInstance, AxiosProgressEvent } from "axios";

export enum MimeType {
    pdf = 'application/pdf',
    text = 'text/plain',
    json = 'application/json',
    csv = 'text/csv',
}

export interface ChatMetadataDto {
    id: string;
    filename: string;
    mimetype: MimeType;
    filesize: number;
    createdAt: Date;
    owner: string;
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

export interface ChatDto extends ChatMetadataDto {
    messages: ChatMessage[];
}

export class ChatService {

    constructor(private readonly client: AxiosInstance) { }

    async getAllChats(accessToken: string): Promise<ChatMetadataDto[]> {
        const res = await this.client.get("/api/chats", { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) }))
    }

    async createChat(accessToken: string, file: File, onUploadProgress?: (progress: number) => void): Promise<ChatMetadataDto> {
        const formData = new FormData()
        formData.append("file", file)

        const res = await this.client.post("/api/chats", formData, {
            headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${accessToken}` },
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent?.total ?? 1))
                onUploadProgress?.(percentCompleted)
            },
        })
        return { ...res.data, createdAt: new Date(res.data.createdAt) }
    }

    async getChat(accessToken: string, id: string): Promise<ChatDto> {
        const res = await this.client.get(`/api/chats/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        return {
            ...res.data, messages: res.data.messages.map((m: { id: string, message: string, createdAt: string, agent: "USER" | "AI" }) => ({
                content: m.message,
                role: m.agent === 'USER' ? MessageRole.user : MessageRole.ai,
                context: []
            })), createdAt: new Date(res.data.createdAt)
        }
    }

    async postMessage(accessToken: string,  id: string, message: string): Promise<ChatMessage> {
        const res = await this.client.post(`/api/chats/${id}`, { message }, { headers: { Authorization: `Bearer ${accessToken}` } })
        return {
            content: res.data.answer,
            role: MessageRole.ai,
            context: res.data.context
        }
    }

    clearMessages(accessToken: string, id: string): Promise<void> {
        return this.client.delete(`/api/chats/${id}/messages`, { headers: { Authorization: `Bearer ${accessToken}` } })
    }

    deleteChat(accessToken: string, id: string): Promise<void> {
        return this.client.delete(`/api/chats/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    }


}

export const chatService = new ChatService(apiService.client)