"use client";

import Logo from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { LogoutLink } from '@/lib/auth/links';
import Link from 'next/link';

interface ChatLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
}

export function OnboardingLayout(props: ChatLayoutProps) {
  return (
    <div>
      <div className="flex justify-between items-center px-4 py-3">
        <Logo />

        <div className="flex items-center space-x-2">
          <Link href={'/generate'} className="text-gray-500 hover:underline">
            Skip
          </Link>

          <LogoutLink>
            <Button variant={'link'}>Logout</Button>
          </LogoutLink>
        </div>
      </div>

      <div>
        <div className="max-w-3xl mx-auto py-10">
          <div className="mb-2">
            <p className="text-gray-300">
              {props.step}/{props.totalSteps}
            </p>
          </div>
          {props.children}
        </div>
      </div>
    </div>
  );
}
