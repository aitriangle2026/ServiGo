import Navbar from '@/components/layout/Navbar';
import HeroSection from './sections/HeroSection';
import CategoriesSection from './sections/CategoriesSection';
import FeaturedServicesSection from './sections/FeaturedServicesSection';
import HowItWorksSection from './sections/HowItWorksSection';
import TopProvidersSection from './sections/TopProvidersSection';
import TestimonialsSection from './sections/TestimonialsSection';
import FAQSection from './sections/FAQSection';
import CTASection from './sections/CTASection';
import FooterSection from './sections/FooterSection';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        {/* "How it works" sits directly under the hero, as in the design —
            it answers the first question a new visitor has before they're
            asked to browse anything. */}
        <HowItWorksSection />
        <CategoriesSection />
        <FeaturedServicesSection />
        <TopProvidersSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Home;
