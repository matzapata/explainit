import { useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer";
import { Button } from "../ui/button";


export function ResponseContextDrawer(props: {
    context: { pageContent: string; metadata: any }[];
  }) {
    const [page, setPage] = useState(0);
  
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <button className="text-xs text-gray-600 hover:underline">
            Show context
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-3xl">
            <DrawerHeader>
              <DrawerTitle className="text-left dark:text-white">Response context</DrawerTitle>
              <DrawerDescription className="text-left dark:text-gray-300">
                The response was generated with the following content from your
                file
              </DrawerDescription>
            </DrawerHeader>
  
            <div className="px-4 pb-10 max-h-44 overflow-scroll">
              <p className="dark:text-gray-300">{props.context[page].pageContent}</p>
            </div>
  
            <div className="px-4 py-4 space-x-2">
              <Button
                variant={'secondary-gray'}
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                variant={'secondary-gray'}
                size="sm"
                disabled={page === props.context.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  