'use client';

import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button } from '../ui/button';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { toast } from '../ui/use-toast';
import {
  generateInstallSnippet,
  launcherSrc,
  publicApiUrl,
} from '@/lib/install-snippet';

export default function CodeSnippet(props: {
  id: string;
  hostOrigins?: string[];
}) {
  const [codeSnippet, setCodeSnippet] = useState('');
  const origins = props.hostOrigins ?? [];
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  useEffect(() => {
    if (!origins.length) {
      setCodeSnippet('');
      return;
    }
    setCodeSnippet(
      generateInstallSnippet({
        scriptSrc: launcherSrc(),
        chatId: props.id,
        apiUrl: publicApiUrl(),
      }),
    );
  }, [props.id, origins.join('|')]);

  if (!origins.length) {
    return (
      <div className="max-w-xl">
        <h2 className="font-semibold mb-2">Install snippet</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add at least one Host origin in Settings first. Only browsers on those
          origins may call the visitor API.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-semibold mb-2">Install snippet</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Make sure your domain is allowlisted in Settings.
      </p>
      <pre className="text-xs overflow-x-auto mb-3">
        <SyntaxHighlighter
          language="html"
          style={coldarkDark}
          PreTag="div"
          customStyle={{
            margin: 0,
            width: '100%',
            background: 'transparent',
            padding: 0,
          }}
          codeTagProps={{
            style: {
              fontSize: '0.75rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }}
        >
          {codeSnippet}
        </SyntaxHighlighter>
      </pre>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!!isCopied || !codeSnippet}
        onClick={() => {
          copyToClipboard(codeSnippet);
          toast({ description: 'Install snippet copied' });
        }}
      >
        {isCopied ? 'Copied' : 'Copy snippet'}
      </Button>
    </div>
  );
}
