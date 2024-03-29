import Navbar from "@/components/navbar/landing";
import FooterSection from "@/components/sections/footer-section";
import FaqSection from "@/components/sections/faq-section";
import PricingSection from "@/components/sections/pricing-section";
import FeaturesSection from "@/components/sections/features-section";
import HeroSection from "@/components/sections/hero-section";

export default function Home() {
  return (
    <main className="relative">
      {/* Shadow and pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-gray-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-20 -z-10 m-auto h-[60vh] w-[50vw] rounded-full bg-gradient-to-tr from-violet-500 to-orange-300 opacity-20 blur-[120px]"></div>
      </div>

      <section className="flex flex-col items-center justify-center w-[95%] lg:max-w-7xl mx-auto relative">
        <Navbar />

        <HeroSection />

        <FeaturesSection />

        <PricingSection />

        <FaqSection />
      </section>

      <FooterSection />
    </main>
  );
}
