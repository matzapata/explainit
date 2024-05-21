import Navbar from '@/components/navbar/landing';
import FooterSection from '@/components/sections/footer-section';
import FaqSection from '@/components/sections/faq-section';
import PricingSection from '@/components/sections/pricing-section';
import FeaturesSection from '@/components/sections/features-section';
import HeroSection from '@/components/sections/hero-section';
import Image from 'next/image';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import images from '@/assets/images';
// import ExploreSection from '@/components/sections/explore-section';
// import { chatService } from '@/lib/services/chat-service';


export default async function Home() {
  // const chats = await chatService.getPublicChats();

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

        {/* <ExploreSection chats={chats} /> */}

        <FeaturesSection />

        <PricingSection />

        <FaqSection />
      </section>

      <FooterSection />
    </main>
  );
}
