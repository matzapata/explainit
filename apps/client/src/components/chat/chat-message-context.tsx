import { BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '../ui/tooltip';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '../ui/drawer';

export function ResponseContextDrawer(props: {
  context: { content: string; metadata: { source: string; title: string } }[];
}) {
  const uniqueUrls = Array.from(new Set(props.context.map((item) => item.metadata.source)));

  return (
    <Drawer>
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            >
              <BookOpen className="h-4 w-4" />
              <span className="sr-only">Sources</span>
            </Button>
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent>Sources</TooltipContent>
      </Tooltip>
      <DrawerContent>
        <div className="mx-auto w-full max-w-3xl">
          <DrawerHeader>
            <DrawerTitle className="text-left dark:text-white">
              Response sources
            </DrawerTitle>
            <DrawerDescription className="text-left dark:text-gray-300">
              The response was generated with the content of the following pages
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-14 max-h-44 overflow-scroll">
            {uniqueUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-400 hover:underline block"
              >
                {url}
              </a>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
