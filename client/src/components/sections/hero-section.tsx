import { RegisterLink } from '@kinde-oss/kinde-auth-nextjs/server';
import { Button } from '../ui/button';
import { Avatar, AvatarImage } from '../ui/avatar';
import images from '@/assets/images';
import Image from 'next/image';

const companies = [
  {
    name: 'AWS',
    logo: images.AwsIcon,
  },
  {
    name: 'GCP',
    logo: images.GcpIcon,
  },
  {
    name: 'Supabase',
    logo: images.SupabaseIcon,
  },
];

export default function HeroSection() {
  return (
    <div id="hero" className="px-4 w-full mt-16 md:mt-24">
      <h1 className="md:text-6xl mx-auto max-w-5xl text-4xl font-semibold text-center text-gray-900 dark:text-white">
        Create an AI-Powered chat for your documentation <br />{' '}
        <span className="text-brand-600">in seconds!</span>
      </h1>
      <h2 className="mt-4 md:text-base text-gray-600 dark:text-gray-300 text-sm text-center max-w-3xl md:mx-auto">
        Explainit. takes your customer expirience to the next level. Create a
        ChatGPT powered chatbot for your documentation in seconds and speed up
        your community.
      </h2>

      <div className="mt-8 md:space-y-0 flex justify-center">
        <RegisterLink>
          <Button  className="w-full md:w-auto px-16">
            Sign up
          </Button>
        </RegisterLink>
      </div>

      <div className="w-full max-w-6xl mx-auto mt-14">
        <iframe
          className="w-full aspect-video"
          src="https://www.loom.com/embed/4f5aac7836f44e27a3cdd1854b566d46?sid=91111162-98fc-4d0d-99ae-3c3135a4979f&hideEmbedTopBar=true&hide_owner=true"
        ></iframe>
      </div>


    </div>
  );
}
