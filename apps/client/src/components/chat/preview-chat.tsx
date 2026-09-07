'use client';

import { AskAiOverlay } from '@explainit/host-chat';
import { getAccessToken } from '@/lib/auth/config';
import { Button, type ButtonProps } from '@/components/ui/button';
import { ChatMetadataDto } from '@/lib/services/chat-service';
import { useState } from 'react';

export function PreviewChat(props: {
  chat: ChatMetadataDto;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={props.variant ?? 'default'}
        size={props.size ?? 'xs'}
        className={props.className}
        onClick={() => setOpen(true)}
      >
        Preview
      </Button>
      {/* Always mounted so the transcript survives close/reopen in this tab. */}
      <AskAiOverlay
        chat={props.chat}
        open={open}
        onOpenChange={setOpen}
        accessToken={getAccessToken() || undefined}
      />
    </>
  );
}
