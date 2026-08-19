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
        <CategoriesSection />
        <FeaturedServicesSection />
        <HowItWorksSection />
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
