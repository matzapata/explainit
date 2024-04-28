import images from "@/assets/images";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import Image from "next/image";


export  function ChatCard() {
  return (
    <div className="text-white py-6">
      <p className="hover:underline cursor-pointer ">astral.js</p>
      <p>
        Astral.js is a lightweight UI toolkit designed to empower JavaScript
        developers with powerful tools for building modern user interfaces. With
        Astral.js, you gain access to a comprehensive set of features including
        context and state management, event-drive
      </p>

      <div className="flex items-center space-x-3 mt-2">
        <div className="flex items-center space-x-2">
          <Image
            className="rounded object-cover"
            width={20}
            height={16}
            alt="image"
            src={images.AvatarSticker01}
          />
          <p>Astral</p>
        </div>

        <p className="text-sm">Updated 1 day ago</p>

        <p className="text-sm">•</p>

        <div className="flex items-center space-x-1">
          <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
          <p className="text-sm">345</p>
        </div>
      </div>
    </div>
  );
}
