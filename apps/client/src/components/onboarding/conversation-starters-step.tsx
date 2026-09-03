"use client";

import { ChatMetadataDto } from '@/lib/services/chat-service';
import ConversationStartersTable from '../generate/conversation-starters-table';
import { Button } from '../ui/button';
import { useRouter } from '@/lib/router';

export function ConversationStartersStep(props: {
  chat: ChatMetadataDto;
}) {
  const router = useRouter();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-white text-lg font-medium">
          Conversation starters
        </h1>
        <p className="text-gray-300">
          Inspire your visitors to start a conversation with your documentation.
        </p>
      </div>

      <div className="border-t border-t-gray-800 divide-gray-800">
        <ConversationStartersTable chatId={props.chat.id} starters={props.chat.conversationStarters} />
      </div>

      <div className="justify-center space-x-2 flex w-full mt-6">
        <Button variant={'outline'} onClick={() => router.back()}>
          Back
        </Button>
        <Button variant={'outline'} onClick={() => router.push("/onboarding/share")}>
          Next
        </Button>
      </div>
    </>
  );
}
