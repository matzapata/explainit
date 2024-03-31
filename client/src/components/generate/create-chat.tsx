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
import { EllipsisVerticalIcon, PlusIcon } from '@heroicons/react/24/solid';
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
      <div className="pt-12 pb-24 max-w-6xl mx-auto space-y-6">
        {/* Heading */}
        <div className="px-4 md:px-8 space-y-8 ">
          <h1 className="font-semibold text-2xl md:3xl text-gray-900 dark:text-white">
            Resources
          </h1>

          <div className=" space-y-1 pb-5 border-b dark:border-b-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add data sources to your chat
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your chatbot will respond only with the information you provide,
              the better the information the better the response
            </p>
          </div>
        </div>

        <div className="px-4 md:px-8 space-y-8">
          <div className="bg-gray-950 border border-gray-800 rounded p-4 space-y-4">
            <div className="flex space-x-2">
              <Input
                className="py-2"
                placeholder="https://github.com/langchain-ai/langchain"
              />
              <button className="border rounded-md border-gray-800 w-11 flex items-center justify-center">
                <PlusIcon className="h-6 w-6 dark:text-gray-300" />
              </button>
            </div>
            <Button
              className='w-full'
              variant={"tertiary-gray"}
              size={'sm'}
            >
              Add resource
            </Button>
            <Button variant={'secondary-gray'} size={'sm'} className="w-full">
              Generate chat
            </Button>
          </div>

          {/* Upload file */}
          {/* <Dropzone onDrop={uploadFile}>
            {({ getRootProps, getInputProps }) => (
              <section>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <div className="pointer-cursor border dark:border-gray-800 rounded-xl px-6 py-4 space-y-3 text-center">
                    <div className="border dark:border-gray-800  shadow-sm rounded-lg p-[10px] inline-block">
                      <IconUploadCloud className="h-6 w-6 dark:text-gray-300" />
                    </div>

                    <div>
                      <div className="space-x-1">
                        <Button variant="link-color">Click to upload</Button>
                        <span className="text-gray-600 dark:text-gray-300">or drag and drop</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        PDF, TXT, or CSV (max. 1 MB)
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </Dropzone> */}

          {uploadingFile && (
            <FileCard
              name={uploadingFile.filename}
              size={uploadingFile.size}
              mimetype={uploadingFile.type}
              percentage={uploadingFile.percentage}
              uploading={true}
            />
          )}

          {chats.length !== 0 && (
            <div>
              <Input
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="max-w-sm px-3 py-2 mb-1"
              />

              {/* List of files and chats */}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-white">
                    <TableHead className="pl-1 text-sm font-medium text-gray-600 flex-1">
                      Filename
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-600 text-center">
                      Created at
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chats
                    .filter((c) => {
                      if (search === '') return true;
                      return c.filename
                        .toLowerCase()
                        .includes(search.toLowerCase());
                    })
                    .map((chat) => (
                      <TableRow key={chat.id}>
                        <TableCell
                          className="pl-1 flex items-center space-x-3 cursor-pointer"
                          onClick={() => {
                            router.push(`/app/chat/${chat.id}`);
                          }}
                        >
                          <FileIcon
                            mimetype={chat.mimetype}
                            className="h-10 w-10"
                          />
                          <div className="">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {chat.filename}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {Math.floor(chat.filesize / 1000)} MB
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center dark:text-white">
                          {chat.createdAt.toDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <EllipsisVerticalIcon className="h-5 w-5 dark:text-white" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {/* <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => alert("Download")}
                              >
                                Download
                              </DropdownMenuItem> */}
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      'Are you sure you want to delete this chat?',
                                    )
                                  ) {
                                    deleteFile(chat.id);
                                  }
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
