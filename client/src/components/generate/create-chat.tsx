'use client';

import FileCard from '@/components/generate/file-card';
import FileIcon from '@/components/generate/file-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import {
  ChatMetadataDto,
  MimeType,
  chatService,
} from '@/lib/services/chat-service';
import {
  EllipsisVerticalIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Dropzone from 'react-dropzone';
import { IconUploadCloud } from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import GoProBanner from '../billing/go-pro-banner';

export default function CreateChat(props: { initialResources: any[] }) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatMetadataDto[]>(props.initialResources);
  const [uploadingFile, setUploadingFile] = useState<{
    filename: string;
    size: string;
    type: MimeType;
    percentage: number;
  } | null>(null);

  const uploadFile = async (files: any[]) => {
    const file = files[0];

    // check if type is supported
    if (Object.values(MimeType).indexOf(file.type) === -1) {
      return toast({
        variant: 'destructive',
        description: 'File type not supported',
      });
    }

    // check if size is supported
    if (file.size > 1000000) {
      return toast({
        variant: 'destructive',
        description: 'File size too large',
      });
    }

    setUploadingFile({
      filename: file.name,
      size: Math.floor(file.size / 1000) + ' KB',
      type: file.type,
      percentage: 0,
    });

    try {
      if (!accessTokenRaw) throw new Error('No access token');

      const newChat = await chatService.createChat(
        accessTokenRaw,
        file,
        (progress: number) => {
          setUploadingFile((prev: any) => ({ ...prev, percentage: progress }));
        },
      );
      setChats((c) => [...c, newChat]);
    } catch (error: any) {
      return toast({
        variant: 'destructive',
        description:
          'Something went wrong. Please try again. ' +
          error?.response.data.message,
      });
    } finally {
      setUploadingFile(null);
    }
  };

  const deleteFile = async (id: string) => {
    try {
      if (!accessTokenRaw) throw new Error('No access token');

      await chatService.deleteChat(accessTokenRaw, id);
      setChats((c) => c.filter((chat) => chat.id !== id));
    } catch (error: any) {
      return toast({
        variant: 'destructive',
        description:
          'Something went wrong. Please try again. ' +
          error?.response.data.message,
      });
    }
  };

  return (
    <main>
      <div className="pt-12 pb-24 max-w-6xl mx-auto">
        <GoProBanner />

        {/* Heading */}
        <div className="px-4 md:px-8 space-y-8 mt-8">
          <h1 className="font-semibold text-2xl md:3xl text-gray-900 dark:text-white">
            Resources
          </h1>

          <div className=" space-y-1 pb-5 border-b dark:border-b-gray-700">
            <h2 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
              Add data sources to your chat
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Your chatbot will respond only with the information you provide,
              the better the information the better the response we can
              generate. You can load public github repositories, websites,
              documentation sites, and more.
            </p>
          </div>
        </div>

        {/* loaded table */}
        <div className="px-4 md:px-8 divide-y divide-gray-200 dark:divide-gray-800">
          <div className="flex md:flex-1 justify-between py-6 space-x-2">
            <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300 break-all flex-1">
              https://js.langchain.com/docs/integrations/document_loaders/web_loaders/recursive_url_loader
            </p>

            <Button className="text-sm dark:text-red-600" variant="link-color">
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex md:flex-1 py-6">
            <Button className="text-sm" variant="link-color">
              Add new
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
