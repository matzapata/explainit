'use client';

import { ChatMetadataDto } from '@/lib/services/chat-service';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export function ChatNavBar(props: {
  authenticated: boolean;
  chat: ChatMetadataDto;
}) {
  const router = useRouter();

  return (
    <div
      className={`${props.authenticated ? 'justify-between' : 'justify-center'} sticky z-50 top-0 w-screen bg-gray-950 border-b h-16 items-center dark:bg-gray-950 border-b-gray-200 dark:border-b-gray-800 flex `}
    >
      {/* Enterprise logo */}
      <Avatar className='mx-4 md:mx-8'>
        <AvatarImage src={props.chat.logo} alt={props.chat.name} />
        <AvatarFallback>
          {props.chat.name?.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {props.authenticated && (
        <Button variant={'ghost'} className='px-4 md:px-8' onClick={() => router.back()}>
          <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </Button>
      )}
    </div>
  );
}
