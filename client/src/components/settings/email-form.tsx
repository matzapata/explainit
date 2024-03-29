import { Button } from "../ui/button";

export default function EmailForm(props: { email: string }) {
  return (
    <div className="space-y-2 md:space-y-0 md:flex py-6">
      <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">Email</p>
      <div className="flex md:flex-1 justify-between">
        <p className="text-sm text-gray-900 dark:text-gray-300">{props.email}</p>
        <Button disabled className="text-sm" variant="link-color">
          Update
        </Button>
      </div>
    </div>
  );
}
