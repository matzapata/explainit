import { apiService } from "@/lib/services/api-service"
import { apiBaseUrl } from "@/lib/auth/config";
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

    async streamMessage(
        id: string,
        question: string,
        chatHistory: { message: string, agent: MessageRole }[] | undefined,
        options: {
            onToken: (text: string) => void;
            signal?: AbortSignal;
            pageUrl?: string;
            selectedText?: string;
            accessToken?: string;
            conversationId?: string;
            onConversationId?: (id: string) => void;
        },
    ): Promise<ChatMessage> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
        };
        if (options.accessToken) {
            headers.Authorization = `Bearer ${options.accessToken}`;
        }

        const res = await fetch(`${apiBaseUrl()}/api/chats/${id}/messages`, {
            method: "POST",
            headers,
            credentials: "omit",
            body: JSON.stringify({
                question,
                chatHistory: chatHistory ?? [],
                ...(options.pageUrl ? { pageUrl: options.pageUrl } : {}),
                ...(options.selectedText
                    ? { selectedText: options.selectedText }
                    : {}),
                ...(options.conversationId
                    ? { conversationId: options.conversationId }
                    : {}),
            }),
            signal: options.signal,
        })

        if (!res.ok) {
            let message = `Failed to send message (${res.status})`
            try {
                const body = (await res.json()) as { message?: string }
                if (body.message) {
                    message = body.message
                }
            } catch {
                // ignore non-JSON error bodies
            }
            throw new Error(message)
        }

        if (!res.body) {
            throw new Error("Failed to send message")
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let donePayload: { answer: string; context: ChatMessage["context"] } | null = null

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    break
                }

                buffer += decoder.decode(value, { stream: true })
                const consumed = consumeSse(buffer)
                buffer = consumed.rest

                for (const event of consumed.events) {
                    if (event.name === "token") {
                        const text = (event.data as { text?: string }).text
                        if (text) {
                            options.onToken(text)
                        }
                    } else if (event.name === "done") {
                        const data = event.data as {
                            answer?: string
                            context?: ChatMessage["context"]
                            conversationId?: string
                        }
                        if (data.conversationId) {
                            options.onConversationId?.(data.conversationId)
                        }
                        donePayload = {
                            answer: data.answer ?? "",
                            context: data.context ?? [],
                        }
                    } else if (event.name === "error") {
                        throw new Error(
                            (event.data as { message?: string }).message ??
                                "Failed to generate answer",
                        )
                    }
                }
            }
        } finally {
            try {
                await reader.cancel()
            } catch {
                // already closed
            }
        }

        if (!donePayload) {
            throw new Error("Stream ended without a response")
        }

        return {
            content: donePayload.answer,
            role: MessageRole.ai,
            context: donePayload.context,
        }
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

type SseEvent = { name: string; data: unknown }

function consumeSse(buffer: string): { events: SseEvent[]; rest: string } {
    const normalized = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const events: SseEvent[] = []
    const parts = normalized.split("\n\n")
    const rest = parts.pop() ?? ""

    for (const block of parts) {
        if (!block.trim() || block.startsWith(":")) {
            continue
        }

        let name = "message"
        const dataLines: string[] = []
        for (const line of block.split("\n")) {
            if (line.startsWith("event:")) {
                name = line.slice(6).trim()
            } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trimStart())
            }
        }

        if (!dataLines.length) {
            continue
        }

        events.push({ name, data: JSON.parse(dataLines.join("\n")) })
    }

    return { events, rest }
}

export const chatService = new ChatService(apiService.client)