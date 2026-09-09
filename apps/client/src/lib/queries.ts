import type { QueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/auth/config';
import { chatService } from '@/lib/services/chat-service';
import { userService } from '@/lib/services/user-service';

export const queries = {
  user: () => ({
    queryKey: ['user'] as const,
    queryFn: () => userService.get(getAccessToken()),
  }),
  chats: () => ({
    queryKey: ['chats'] as const,
    queryFn: () => chatService.listOwnerChats(getAccessToken()),
  }),
  ownerChat: (id: string) => ({
    queryKey: ['owner-chat', id] as const,
    queryFn: () => chatService.getOwnerChatById(getAccessToken(), id),
  }),
  ownerChatOverview: (id: string) => ({
    queryKey: ['owner-chat-overview', id] as const,
    queryFn: () => chatService.getOwnerChatOverview(getAccessToken(), id),
  }),
  chat: (id: string) => ({
    queryKey: ['chat', id] as const,
    queryFn: () => chatService.getChat(id),
  }),
};

export function ensureOwnerWorkspace(queryClient: QueryClient, chatId: string) {
  return Promise.all([
    queryClient.ensureQueryData(queries.user()),
    queryClient.ensureQueryData(queries.ownerChat(chatId)),
  ]).then(([user, chat]) => ({ user, chat }));
}

export function ensureOwnerOverview(queryClient: QueryClient, chatId: string) {
  return Promise.all([
    ensureOwnerWorkspace(queryClient, chatId),
    queryClient.ensureQueryData(queries.ownerChatOverview(chatId)),
  ]).then(([{ user, chat }, overview]) => ({ user, chat, overview }));
}
