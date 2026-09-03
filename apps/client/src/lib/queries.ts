import { QueryClient } from '@tanstack/react-query';
import { chatService } from '@/lib/services/chat-service';
import { userService } from '@/lib/services/user-service';
import { getAccessToken } from '@/lib/auth/config';

export const queries = {
  user: () => ({
    queryKey: ['user'] as const,
    queryFn: () => userService.get(getAccessToken()),
  }),
  ownerChat: () => ({
    queryKey: ['owner-chat'] as const,
    queryFn: () => chatService.getOwnerChat(getAccessToken()),
  }),
  chat: (id: string) => ({
    queryKey: ['chat', id] as const,
    queryFn: () => chatService.getChat(id),
  }),
};

export function ensureOwnerWorkspace(queryClient: QueryClient) {
  return Promise.all([
    queryClient.ensureQueryData(queries.user()),
    queryClient.ensureQueryData(queries.ownerChat()),
  ]).then(([user, chat]) => ({ user, chat }));
}
