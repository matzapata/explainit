'use client';

import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';

export default function ShareLinkForm(props: { id: string }) {
  const [sharableLink, setSharableLink] = useState<string>('');
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSharableLink(`https://${window.location.host}/chat/${props.id}`);
    }
  }, [props.id]);

  return (
    <div className="space-y-2 md:space-y-0 md:flex py-6">
      <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
        Sharable link
      </p>
      <div className="flex md:flex-1 justify-between">
        <p className="text-sm text-gray-900 dark:text-gray-300">
          {sharableLink}
        </p>
        <Button
          disabled={!!isCopied}
          onClick={() => copyToClipboard(sharableLink)}
          className="text-sm"
          variant="link-color"
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
