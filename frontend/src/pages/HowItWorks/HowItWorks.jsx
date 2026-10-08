import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import FooterSection from '@/pages/Home/sections/FooterSection';
import Modal from '@/components/common/Modal';
import HowItWorksHero from './sections/HowItWorksHero';
import ProcessSteps from './sections/ProcessSteps';
import AppShowcase from './sections/AppShowcase';

export default function HowItWorks() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <HowItWorksHero onWatchVideo={() => setIsVideoOpen(true)} />
        <ProcessSteps />
        <AppShowcase />
      </main>

      <FooterSection />

      {/* There's no walkthrough video yet, so the button says so plainly
          rather than opening an empty player or doing nothing at all. */}
      <Modal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} title="Walkthrough video">
        <p className="text-sm leading-relaxed text-text-muted">
          The ServiGo walkthrough video isn't published yet. Once it is, drop the URL into
          <code className="mx-1 rounded bg-surface-warm px-1.5 py-0.5 text-[12px] text-secondary">
            HowItWorks.jsx
          </code>
          and this will play it here.
        </p>
      </Modal>
    </div>
  );
}
