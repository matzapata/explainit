import GoProButton from "./go-pro-button";


export default function GoProBanner() {
    return (
        <div className="flex flex-col md:flex-row text-white md:mx-4 px-4 py-6 justify-between md:items-center md:space-x-4 space-y-4 md:space-y-0 md:border border-y border-gray-800 md:rounded-lg">
          <div>
            <h1 className='font-medium'>Upgrade to PRO</h1>
            <p className='text-sm'>
              Add more resources and make your chats public to the world
            </p>
          </div>
          <GoProButton variant={"secondary-gray"} size="sm" />
        </div>
    )
}