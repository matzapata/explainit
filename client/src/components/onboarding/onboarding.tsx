'use client';

import { useState } from 'react';
import Logo from '../brand/logo';
import { Button } from '../ui/button';
import { GeneralInfoStep } from './general-info-step';
import { ChatMetadataDto } from '@/lib/services/chat-service';
import { AddResourcesStep } from './add-resources-step';
import { ShareStep } from './share-step';
import { ConversationStartersStep } from './conversation-starters-step';

export function Onboarding(props: { chat: ChatMetadataDto }) {
  const [step, setStep] = useState(
    props.chat.name && props.chat.description && props.chat.url
      ? props.chat.resources.length
        ? props.chat.conversationStarters.length
          ? 4
          : 3
        : 2
      : 1,
  );

  return (
    <div>
      <div className="flex justify-between items-center px-4 py-3">
        <Logo />

        <div className="flex items-center space-x-2">
          <p className="text-gray-500">I'll do this later</p>

          <Button variant={'link'}>Logout</Button>
        </div>
      </div>

      <div>
        <div className="max-w-3xl mx-auto py-10">
          <div className="mb-2">
            <p className="text-gray-300">{step}/4</p>
          </div>

          {step === 1 && <GeneralInfoStep next={() => setStep(s => s+1)} back={() => setStep(s => s-1)} chat={props.chat} />}
          {step === 2 && <AddResourcesStep next={() => setStep(s => s+1)} back={() => setStep(s => s-1)} chat={props.chat} />}
          {step === 3 && <ConversationStartersStep next={() => setStep(s => s+1)} back={() => setStep(s => s-1)} chat={props.chat} />}
          {step === 4 && <ShareStep next={() => setStep(s => s+1)} back={() => setStep(s => s-1)} chat={props.chat} />}
        </div>
      </div>
    </div>
  );
}
