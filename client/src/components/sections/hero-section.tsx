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
        Explainit. takes your customer expirience to the next level. Create a
        ChatGPT powered chatbot for your documentation in seconds and speed up
        your community.
      </h2>

      <div className="mt-8 md:space-y-0 flex justify-center space-x-3">
        <RegisterLink>
          <Button variant={'primary'} className="w-full md:w-auto md:ml-4 px-8">
            Sign up
          </Button>
        </RegisterLink>
      </div>



      <div className="w-full mt-14">
        <iframe
          className="w-full aspect-video"
          src="https://www.loom.com/embed/3cffe7ffd004491f8b228102251bdc24?sid=9d786530-40b8-4514-aad6-7e0159106cfe&hideEmbedTopBar=true&hide_owner=true"
        ></iframe>
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
