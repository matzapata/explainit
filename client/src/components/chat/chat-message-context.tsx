import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';

export function ResponseContextDrawer(props: {
  context: { content: string; metadata: { url: string; title: string } }[];
}) {
  const uniqueUrls = Array.from(new Set(props.context.map((item) => item.metadata.url)));

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="text-xs text-gray-600 hover:underline">
          Show sources
        </button>
      </DrawerTrigger>
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
            {uniqueUrls.map((url) => (
              <a
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
