import type { AxiosInstance } from 'axios';
import { apiService } from '@/lib/services/api-service';

export interface ChatMetadataDto {
  id: string;
  name?: string;
  color?: string;
  hostOrigins?: string[];
  conversationStarters: string[];
  published: boolean;
  description?: string;
  points: number;
  updatedAt?: string;
  lastUsedAt?: string | null;
  resources?: ChatResource[];
}

export interface ChatResource {
  id: string;
  type: string;
  data: string;
  title?: string | null;
  status?: 'pending' | 'processing' | 'ready' | 'failed';
  error?: string | null;
  updatedAt?: string;
}

export class ChatService {
  constructor(private readonly client: AxiosInstance) {}

  async listOwnerChats(accessToken: string): Promise<ChatMetadataDto[]> {
    const res = await this.client.get('/api/chats', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  }

  async createChat(
    accessToken: string,
    data: { name?: string; description?: string; color?: string } = {},
  ): Promise<ChatMetadataDto> {
    const res = await this.client.post('/api/chats/admin', data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  }

  async deleteChat(accessToken: string, id: string): Promise<ChatMetadataDto> {
    const res = await this.client.delete(`/api/chats/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  }

  async getOwnerChatById(
    accessToken: string,
    id: string,
  ): Promise<ChatMetadataDto> {
    const res = await this.client.get(`/api/chats/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  }

  async updateOwnerChat(
    accessToken: string,
    id: string,
    data: {
      name?: string;
      color?: string;
      hostOrigins?: string[];
      conversationStarters?: string[];
      published?: boolean;
      description?: string;
    },
  ): Promise<ChatMetadataDto> {
    try {
      const res = await this.client.put(`/api/chats/${id}`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    } catch (error: any) {
      console.error(error);
      throw new Error(
        `Failed to update chat. ${error?.response?.data?.message ?? ''}`,
      );
    }
  }

  async getChat(id: string): Promise<ChatMetadataDto> {
    const res = await this.client.get(`/api/chats/${id}`);
    return res.data;
  }

  async addWebResource(
    accessToken: string,
    id: string,
    urls: string[],
  ): Promise<ChatResource[]> {
    try {
      const res = await this.client.post(
        `/api/chats/${id}/resources/web`,
        { urls },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      throw new Error(error?.response?.data?.message ?? '');
    }
  }

  async addTextResource(
    accessToken: string,
    id: string,
    text: string,
    title: string,
  ): Promise<ChatResource[]> {
    try {
      const res = await this.client.post(
        `/api/chats/${id}/resources/text`,
        { text, title },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      throw new Error(error?.response?.data?.message ?? '');
    }
  }

  async inspectResource(
    accessToken: string,
    id: string,
    url: string,
  ): Promise<{ urls: string[] }> {
    const res = await this.client.post(
      `/api/chats/${id}/resources/web/inspect`,
      { url },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.data;
  }

  async deleteResource(
    accessToken: string,
    id: string,
    resource_id: string,
  ): Promise<string> {
    await this.client.delete(`/api/chats/${id}/resources/${resource_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return id;
  }
}

export const chatService = new ChatService(apiService.client);
