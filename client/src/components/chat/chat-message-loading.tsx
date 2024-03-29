import { IconOpenAI } from '@/components/ui/icons'

export function ChatMessageLoading() {
  return (
    <div className={'group relative py-4 md:py-8 flex items-center md:-ml-12'}>
      <div className={'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow'}>
        <IconOpenAI />
      </div>
      <div className="ml-4 flex flex-1 overflow-hidden px-1">
        <p className='animate-pulse text-gray-600'>Loading...</p>
      </div>
    </div>
  )
}
