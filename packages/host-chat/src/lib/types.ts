export type ChatMetadata = {
  id: string;
  name?: string;
  conversationStarters: string[];
};

export enum MessageRole {
  user = 'user',
  ai = 'ai',
}

export interface ChatMessage {
  content: string;
  role: MessageRole;
  context: { content: string; metadata: { source: string; title: string } }[];
}
