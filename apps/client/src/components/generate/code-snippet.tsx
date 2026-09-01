'use client';

import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const generateCodeSnippet = (href: string) => `<html>
<head>
    <style>
      /* Style for the chat bubble */
      .chat-bubble {
          z-index: 1000;
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #007bff;
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 20px 20px 0px 20px;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
      }

      /* Style for the chat bubble when hovered */
      .chat-bubble:hover {
          background-color: #0056b3;
      }
    </style>
</head>
<body>
    <a 
      class="chat-bubble" 
      href="${href}"
    >
      ExplainIt with AI
    </a>
    <!-- ... -->
</body>
</html>`;

export default function CodeSnippet(props: { id: string }) {
  const [codeSnippet, setCodeSnippet] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCodeSnippet(generateCodeSnippet(`${window.location.origin}/chat/${props.id}`));
    }
  }, [props.id]);

  return (
    <div className="space-y-2 md:space-y-0 md:flex py-6">
      <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
        Code Snippet
      </p>
      <div className="flex md:flex-1">
        <SyntaxHighlighter
          language={'html'}
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
      </div>
    </div>
  );
}
