'use client';

import { Button } from '../ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from '@/lib/router';

export function ChatNavBar(props: {
  authenticated: boolean;
}) {
  const router = useRouter();

  return (
    <div
      className={`${props.authenticated ? 'justify-between' : 'justify-start'} sticky z-50 top-0 w-screen bg-white border-b border-gray-200 h-16 items-center dark:bg-gray-950 dark:border-white/10 flex px-4 md:px-8`}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-white">Ask AI</p>

      {props.authenticated && (
        <Button variant={'ghost'} className='px-0' onClick={() => router.back()}>
          <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        </Button>
      )}
    </div>
  );
}
