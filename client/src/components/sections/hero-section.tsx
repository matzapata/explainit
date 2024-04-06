import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/server';
import { Button } from '../ui/button';
import { Avatar, AvatarImage } from '../ui/avatar';
import images from '@/assets/images';

export default function HeroSection() {
  return (
    <div id="hero" className="px-4 mt-16 md:mt-24">
      <h1 className="md:text-6xl max-w-5xl text-4xl font-semibold text-center text-gray-900 dark:text-white">
        Create an AI-Powered chat for your documentation <br />{' '}
        <span className="text-brand-600">in seconds!</span>
      </h1>
      <h2 className="mt-4 md:text-base text-gray-600 dark:text-gray-300 text-sm text-center max-w-3xl md:mx-auto">
        Explain it takes your customer expirience to the next level. Create a
        ChatGPT powered chatbot for your documentation in seconds and speed up
        your community.
      </h2>

      <div className="mt-8 md:space-y-0 flex justify-center space-x-3">
        <RegisterLink>
          <Button variant={'primary'} className="w-full md:w-auto md:ml-4">
            Sign up
          </Button>
        </RegisterLink>

        <Button
          variant={'secondary-gray'}
          className="w-auto items-center space-x-2"
        >
          <span className="text-gray-700">Demo</span>
        </Button>
      </div>

      <div className="mt-14 space-y-4">
        <div className="flex justify-center -space-x-2">
          <Avatar className="border border-white">
            <AvatarImage src={images.AvatarSticker01.src} alt="Avatar" />
          </Avatar>
          <Avatar className="border border-white">
            <AvatarImage src={images.AvatarSticker02.src} alt="Avatar" />
          </Avatar>
          <Avatar className="border border-white">
            <AvatarImage src={images.AvatarSticker03.src} alt="Avatar" />
          </Avatar>
          <Avatar className="border border-white">
            <AvatarImage src={images.AvatarSticker04.src} alt="Avatar" />
          </Avatar>
          <Avatar className="border border-white">
            <AvatarImage src={images.AvatarSticker05.src} alt="Avatar" />
          </Avatar>
        </div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Developers ask for it!
        </div>
      </div>

      {/* TODO: Optional screenshot or demo video */}
      {/*  
          <div className="py-16">
          <Image
            className="md:hidden border-4 mx-auto rounded-md border-gray-900"
            src={images.HeroScreenMockup}
            height={220}
            alt="Screen mockup"
          />
          <Image
            className="hidden md:block border-4 mx-auto rounded-xl border-gray-900"
            src={images.HeroScreenMockupDesktop}
            height={560}
            alt="Screen mockup"
          />
          </div> 
        */}
    </div>
  );
}
