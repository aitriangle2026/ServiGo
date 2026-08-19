import Footer from '@/components/layout/Footer';

// Keeps a section entry in pages/Home/sections for consistency with the page's
// section-by-section structure, while the actual markup lives in the single
// shared Footer used across every layout (MainLayout, CustomerLayout, etc.)
const FooterSection = () => <Footer />;

export default FooterSection;
