'use client';

import { ChatMetadataDto } from '@/lib/services/chat-service';
import ResourcesTable from '../generate/resources-table';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

export function ResourcesStep(props: { chat: ChatMetadataDto }) {
  const router = useRouter();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-white text-lg font-medium">Load up knowledge</h1>
        <p className="text-gray-300">
          Your chat will only answer questions based on the resources you
          provide. Add more resources to improve the chat's performance. Don't
          worry, you can always add more resources later.
        </p>
      </div>

      <div className="border-t border-t-gray-800 divide-gray-800">
        <ResourcesTable
          chatId={props.chat.id}
          initialUrl={props.chat.url}
          initialResources={props.chat.resources}
        />
      </div>

      <div className="justify-center space-x-2 flex w-full mt-6">
        <Button variant={'outline'} onClick={() => router.back()}>
          Back
        </Button>
        <Button
          variant={'outline'}
          onClick={() => router.push('/onboarding/starters')}
        >
          Next
        </Button>
      </div>
    </>
  );
}
