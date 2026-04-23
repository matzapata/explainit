'use client';

import { ChatMetadataDto } from '@/lib/services/chat-service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatCard } from '../explore/chat-card';
import { useState } from 'react';
import Link from 'next/link';

export default function ExploreSection(props: { chats: ChatMetadataDto[] }) {
  const [chats, setChats] = useState<ChatMetadataDto[]>(props.chats);

  return (
    <div>
      <div className="px-4 mx-auto max-w-2xl py-10 mt-20 flex flex-col justify-center items-center sm:text-center">
        <h1 className="text-2xl text-gray-900 dark:text-white text-center font-semibold sm:text-3xl xl:text-[40px] relative">
          Explore the best documentation chats
        </h1>
        <p className="mt-6 text-sm md:text-base text-gray-600 dark:text-gray-300 text-center">
          Big companies are already integrating chatbots for their
          documentation. Aws with Amazon Q, Gcp with Gemini for cloud console,
          Supabase with Ask AI and many more. This is your 5 minute catch up.
          Don't stay behind.
        </p>
      </div>

      <div className="w-full border-y border-y-gray-800 py-4 bg-gray-900 md:px-6 flex justify-between">
        <div className="max-w-6xl mx-auto w-full px-4">
          <Input
            type="text"
            placeholder="Search..."
            className="w-full py-2 text-sm"
            onChange={(e) => {
              const filteredChats = props.chats.filter((c) =>
                c.name?.toLowerCase().includes(e.target.value.toLowerCase()),
              );
              setChats(filteredChats);
            }}
          />
        </div>
      </div>

      <div className=" bg-background w-screen border-b border-b-gray-800">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-4  divide-y">
            {chats.slice(0, 4).map((c) => (
              <ChatCard chat={c} />
            ))}

            {chats.length !== 0 ? null : (
              <div>
                <p className="text-gray-300 text-center">
                  No chats found. Create it yourself in 5 minutes! Or try
                  something else
                </p>
              </div>
            )}
          </div>

          {chats.length === 0 ? null :  (
            <Link href={'/explore'}>
              <Button variant={'secondary'}>Explore all</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
