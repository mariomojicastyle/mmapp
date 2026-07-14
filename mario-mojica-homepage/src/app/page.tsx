'use client';

import Header from '@/components/Header';
import HeroManual from '@/components/HeroManual';
import SocialProof from '@/components/SocialProof';
import PainVsSolution from '@/components/PainVsSolution';
import LiveDemo from '@/components/LiveDemo';
import ProductFeatures from '@/components/ProductFeatures';
import MetricsSection from '@/components/MetricsSection';
import ClientPortal from '@/components/ClientPortal';
import HowItWorksSteps from '@/components/HowItWorksSteps';
import FAQ from '@/components/FAQ';
import ContactCTA from '@/components/ContactCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans antialiased overflow-x-hidden">
      <Header />
      <article>
        <HeroManual />
        <SocialProof />
        <PainVsSolution />
        <LiveDemo />
        <ProductFeatures />
        <MetricsSection />
        <ClientPortal />
        <HowItWorksSteps />
        <FAQ />
        <ContactCTA />
      </article>
      <Footer />
    </main>
  );
}
