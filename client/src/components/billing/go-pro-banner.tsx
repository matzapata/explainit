import { Button } from "../ui/button";


export default function GoProBanner() {
    return (
        <div className="flex flex-col md:flex-row text-white md:mx-4 px-4 py-6 justify-between md:items-center md:space-x-4 space-y-4 md:space-y-0 md:border border-y border-gray-800 md:rounded-lg">
          <div>
            <h1 className='font-medium'>Upgrade plan to create sharable chats</h1>
            <p className='text-sm'>
              In order to create sharable chats you must have an active plan,
              please upgrade
            </p>
          </div>
          <Button size="sm" variant="secondary-gray">
            Go pro
          </Button>
        </div>
    )
}