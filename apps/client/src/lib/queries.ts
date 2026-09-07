import { QueryClient } from '@tanstack/react-query';
import { chatService } from '@/lib/services/chat-service';
import { userService } from '@/lib/services/user-service';
import { getAccessToken } from '@/lib/auth/config';

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
