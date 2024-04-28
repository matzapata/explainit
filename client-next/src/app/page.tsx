import Navbar from '@/components/navbar/landing';
import FooterSection from '@/components/sections/footer-section';
import FaqSection from '@/components/sections/faq-section';
import PricingSection from '@/components/sections/pricing-section';
import FeaturesSection from '@/components/sections/features-section';
import HeroSection from '@/components/sections/hero-section';
import Image from 'next/image';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import images from '@/assets/images';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const companies = [
  {
    name: 'AWS',
    logo: images.AmazonIcon,
  },
  {
    name: 'GCP',
    logo: images.GoogleIcon,
  },
  {
    name: 'Supabase',
    logo: images.MicrosoftIcon,
  },
  {
    name: 'Stripe',
    logo: images.StripeIcon,
  },
  {
    name: 'Docker',
    logo: images.DockerIcon,
  },
  {
    name: 'React',
    logo: images.ReactIcon,
  },
];

export default function Home() {
  return (
    <main className="relative">
      <div className=" w-screen bg-[#FF6154] py-1 flex items-center justify-between text-white px-6">
        <p className="font-semibold hidden md:block">
          Live in producthunt! Support us with an upvote 🚀
        </p>
        <a
          href="https://www.producthunt.com/posts/explainit?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-explainit"
          target="_blank"
        >
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=452503&theme=light"
            alt="Explainit - Create&#0032;an&#0032;AI&#0045;Powered&#0032;chat&#0032;for&#0032;your&#0032;documentation&#0032;in&#0032;seconds&#0033; | Product Hunt"
            style={{ height: '40px' }}
            height="54"
          />
        </a>
      </div>

      {/* Shadow and pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-gray-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-20 -z-10 m-auto h-[60vh] w-[50vw] rounded-full bg-gradient-to-tr from-violet-500 to-orange-300 opacity-20 blur-[120px]"></div>
      </div>

      <section className="flex flex-col items-center justify-center mx-auto relative">
        <Navbar />

        <HeroSection />

        <div className="mx-auto max-w-2xl py-10 mt-20 flex flex-col justify-center items-center sm:text-center">
          <h1 className="text-2xl text-gray-900 dark:text-white text-center font-semibold sm:text-3xl xl:text-[40px] relative">
            Explore the best documentation chats
          </h1>
          <p className="mt-6 text-sm md:text-base text-gray-600 dark:text-gray-300 text-center">
            Big companies are already integrating chatbots for their
            documentation. Aws with Amazon Q, Gcp with Gemini for cloud console,
            Supabase with Ask AI and many more. This is your 5 minute catch up.
            Don't stay behind.
          </p>
        </div>

        <div className="w-full border-y border-y-gray-800 py-4 bg-gray-900 px-6 flex justify-between">
          <div className="max-w-6xl mx-auto w-full px-4">
            <Input
              type="text"
              placeholder="Search..."
              className="hidden md:block w-full py-2 text-sm"
            />
          </div>
        </div>

        <div className=" bg-background w-screen border-b border-b-gray-800">
          <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-4  divide-y">
              <ChatCard />
              <ChatCard />
              <ChatCard />
            </div>
            <Button variant={'secondary'}>Explore all</Button>
          </div>
        </div>

        <FeaturesSection />

        <PricingSection />

        <FaqSection />
      </section>

      <FooterSection />
    </main>
  );
}

function ChatCard() {
  return (
    <div className="text-white py-6">
      <p className="hover:underline cursor-pointer">astral.js</p>
      <p>
        Astral.js is a lightweight UI toolkit designed to empower JavaScript
        developers with powerful tools for building modern user interfaces. With
        Astral.js, you gain access to a comprehensive set of features including
        context and state management, event-drive
      </p>

      <div className="flex items-center space-x-3 mt-2">
        <div className="flex items-center space-x-2">
          <Image
            className="rounded object-cover"
            width={20}
            height={16}
            alt="image"
            src={images.AvatarSticker01}
          />
          <p>Astral</p>
        </div>

        <p className="text-sm">Updated 1 day ago</p>

        <p className="text-sm">•</p>

        <div className="flex items-center space-x-1">
          <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
          <p className="text-sm">345</p>
        </div>
      </div>
    </div>
  );
}
