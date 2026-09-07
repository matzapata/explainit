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
      <div className="space-y-2 md:space-y-0 md:flex py-6">
        <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
          Install snippet
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 md:flex-1">
          Add at least one Host origin above first. Only browsers on those
          origins may call the visitor API.
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
          Allowed Host origins:{' '}
          {origins.map((origin, i) => (
            <span key={origin}>
              {i > 0 ? ', ' : ''}
              <code>{origin}</code>
            </span>
          ))}
          . Paste the same snippet on each; the API rejects requests from other
          origins. Style or replace the Ask AI control — the Launcher does not
          create it.
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
