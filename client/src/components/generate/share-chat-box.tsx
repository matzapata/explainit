'use client';

import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Button } from '../ui/button';

export default function ShareChatBox(props: { id: string }) {
  const { copyToClipboard, isCopied } = useCopyToClipboard({ timeout: 2000 });

  return (
    <div className="flex mt-6 border border-gray-700 rounded-lg items-center py-1 pl-4 pr-1">
        {/* TODO: use domain as variable here */}
      <p className="flex-1 text-white">https://explainit.com/{props.id}</p> 
      <Button
        disabled={!!isCopied}
        size="sm"
        onClick={() => copyToClipboard(`https://explainit.com/${props.id}`)}
      >
        {isCopied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  );
}
