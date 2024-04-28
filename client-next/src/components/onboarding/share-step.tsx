import { ChatMetadataDto } from '@/lib/services/chat-service';
import { Button } from '../ui/button';
import { ChatCard } from '../explore/chat-card';

export function ShareStep(props: {
  chat: ChatMetadataDto;
  back: () => void;
  next: () => void;
}) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-center text-white text-lg font-medium">
          Almost there!
        </h1>
        <p className="text-center text-gray-300">
          Share your documentation with the world!
        </p>
      </div>

      <div className="border-y border-y-gray-800 divide-gray-800">
        <ChatCard />
      </div>

      {/* Only last step */}
      <div className="flex justify-between w-full items-center mt-6">
        <Button variant={'outline'} onClick={props.back}>
          Back
        </Button>

        <div className="space-x-4 flex">
          <Button variant={'outline'}>Preview</Button>
          <Button>Publish</Button>
        </div>
      </div>
    </>
  );
}
