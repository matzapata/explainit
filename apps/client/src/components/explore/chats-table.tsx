'use client';

import { RegisterLink } from '@/lib/auth/links';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChatMetadataDto } from '@/lib/services/chat-service';
import { ChatCard } from './chat-card';
import { useState } from 'react';

export function ChatsTable(props: { chats: ChatMetadataDto[] }) {
  const [chats, setChats] = useState<ChatMetadataDto[]>(props.chats);

  return (
    <div>
      {/* Search bar */}
      <div className="border-b sticky top-0 z-50 border-b-gray-800 py-4 bg-gray-900 px-6 flex justify-between">
        <Input
          type="text"
          placeholder="Search..."
          className="hidden md:block w-96 py-2 text-sm"
          onChange={(e) => {
            const filteredChats = props.chats.filter((c) =>
              c.name?.toLowerCase().includes(e.target.value.toLowerCase()),
            );
            setChats(filteredChats);
          }}
        />
        <RegisterLink postLoginRedirectURL="/onboarding">
          <Button size="sm">Create yours</Button>
        </RegisterLink>
      </div>

      {/* Chats */}
      <div className="p-8">
        <div className="mb-4  divide-y divide-gray-800">
          {chats.map((c) => (
            <ChatCard chat={c} />
          ))}

          {chats.length !== 0 ? null : (
            <div>
              <p className="text-gray-300 text-center">
                No chats found. Create it yourself in 5 minutes! Or try something else
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
