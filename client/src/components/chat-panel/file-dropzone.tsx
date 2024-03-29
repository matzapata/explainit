"use client";

import FileCard from "@/components/chat-panel/file-card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { MimeType, chatService } from "@/lib/services/chat-service";
import { useState } from "react";
import Dropzone from "react-dropzone";
import { IconUploadCloud } from "@/components/ui/icons";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function FileDropZone() {
  const { accessTokenRaw } = useKindeBrowserClient();
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
            variant: "destructive",
            description: "File type not supported",
          });
        }
    
        // check if size is supported
        if (file.size > 1000000) {
          return toast({
            variant: "destructive",
            description: "File size too large",
          });
        }
    
        setUploadingFile({
          filename: file.name,
          size: Math.floor(file.size / 1000) + " KB",
          type: file.type,
          percentage: 0,
        });
    
        try {
          if (!accessTokenRaw) throw new Error("No access token");
          
          await chatService.createChat(accessTokenRaw, file, (progress: number) => {
            setUploadingFile((prev: any) => ({ ...prev, percentage: progress }));
          });
        //   queryClient.invalidateQueries({ queryKey: ["chats"] });
        } catch (error) {
          return toast({
            variant: "destructive",
            description: "Something went wrong. Please try again.",
          });
        } finally {
          setUploadingFile(null);
        }
      };

    return (
        <div className="px-4 md:px-8 space-y-8">
        {/* Upload file */}
        <Dropzone onDrop={uploadFile}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="pointer-cursor border rounded-xl px-6 py-4 space-y-3 text-center">
                  <div className="border shadow-sm rounded-lg p-[10px] inline-block">
                    <IconUploadCloud className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="space-x-1">
                      <Button variant="link-color">Click to upload</Button>
                      <span className="text-gray-600">or drag and drop</span>
                    </div>
                    <p className="text-gray-600">
                      PDF, TXT, or CSV (max. 1 MB)
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </Dropzone>

        {uploadingFile && (
          <FileCard
            name={uploadingFile.filename}
            size={uploadingFile.size}
            mimetype={uploadingFile.type}
            percentage={uploadingFile.percentage}
            uploading={true}
          />
        )}
        </div>
    )
}