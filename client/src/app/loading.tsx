import { IconSpinner } from "@/components/ui/icons";

export default function Loading() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <IconSpinner className="animate-spin h-5 w-5 dark:text-gray-200" />
    </div>
  );
}
