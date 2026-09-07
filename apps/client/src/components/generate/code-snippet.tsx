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

function originFromWebsite(website?: string): string | null {
  if (!website?.trim()) return null;
  try {
    return new URL(website.trim()).origin;
  } catch {
    return null;
  }
}

export default function CodeSnippet(props: {
  id: string;
  website?: string;
}) {
  const [codeSnippet, setCodeSnippet] = useState('');
  const hostOrigin = originFromWebsite(props.website);
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  useEffect(() => {
    if (!hostOrigin) {
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
  }, [props.id, hostOrigin]);

  if (!hostOrigin) {
    return (
      <div className="space-y-2 md:space-y-0 md:flex py-6">
        <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
          Install snippet
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 md:flex-1">
          Set your Website above first. That origin is the Host site whitelist:
          only browsers on that origin may call the visitor API.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-0 md:flex py-6">
      <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
        Install snippet
      </p>
      <div className="flex md:flex-1 flex-col gap-2">
        <SyntaxHighlighter
          language="html"
          style={coldarkDark}
          PreTag="div"
          showLineNumbers
          customStyle={{
            margin: 0,
            width: '100%',
            background: '#131316',
            padding: '1.5rem 1rem',
            border: '1px solid #7B39ED',
            borderRadius: '0.5rem',
          }}
          codeTagProps={{
            style: {
              fontSize: '0.9rem',
              fontFamily: 'var(--font-mono)',
            },
          }}
        >
          {codeSnippet}
        </SyntaxHighlighter>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Host origin (from Website): <code>{hostOrigin}</code>. The API rejects
          requests from other origins. Style or replace the Ask AI control — the
          Launcher does not create it.
        </p>
        <div>
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
      </div>
    </div>
  );
}
