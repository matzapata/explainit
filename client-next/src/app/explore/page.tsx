import images from '@/assets/images';
import Navbar from '@/components/navbar/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function Explore() {
  return (
    <div>
      <Navbar items={[]} user={{}} />
      <div className="border-b border-b-gray-800 py-4 bg-gray-900 px-6 flex justify-between">
        <Input
          type="text"
          placeholder="Search..."
          className="hidden md:block w-96 py-2 text-sm"
        />
        <Button size="sm">Create yours</Button>
      </div>

      <div className="grid grid-cols-12">
        <div className="col-span-3 p-6">
          <p className="text-white mb-2 ml-1">Sort by</p>
          <div className="text-white">
            <ul className="space-y-1">
              <li className="px-4 py-2 rounded-md text-sm bg-gray-800">
                Popularity
              </li>
              <li className="px-4 py-2 rounded-md text-sm bg-gray-800">
                Recent
              </li>
            </ul>
          </div>
        </div>
        <div className="p-6 col-span-9">
          <div className='mb-4  divide-y'>
            <ChatCard />
            <ChatCard />
            <ChatCard />
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}

function ChatCard() {
  return (
    <div className="text-white py-6">
      <p className="hover:underline cursor-pointer">astral.js</p>
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
