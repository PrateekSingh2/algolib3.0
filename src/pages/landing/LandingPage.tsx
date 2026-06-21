import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import AuthModal from "@/components/AuthModal";
import HeroSection from "./HeroSection";
import TechStackMarquee from "./TechStackMarquee";
import FeaturesGrid from "./FeaturesGrid";
import PlaygroundSection from "./PlaygroundSection";
import DiscoverSection from "./DiscoverSection";
import FAQSection from "./FAQSection";
import FooterCTA from "./FooterCTA";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();

  const handleRequireAuth = () => {
    if (!user) {
      setAuthOpen(true);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-white relative overflow-x-hidden font-sans">
      <Navbar />

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10 flex flex-col">
        {/* HERO SECTION */}
        <div className="relative w-full py-8 pt-16 sm:pt-20 bg-[linear-gradient(135deg,#fdf4ff_0%,#fffbeb_100%)] dark:bg-[linear-gradient(135deg,#1f1025_0%,#18140a_100%)]">
          <div className="absolute top-1/4 left-10 w-[500px] h-[500px] pointer-events-none z-0 opacity-[0.35] dark:opacity-[0.12] mix-blend-multiply dark:mix-blend-screen rounded-full bg-gradient-to-tr from-indigo-300 to-purple-300 blur-[80px]" />
          <div className="absolute top-1/3 right-10 w-[600px] h-[600px] pointer-events-none z-0 opacity-[0.35] dark:opacity-[0.12] mix-blend-multiply dark:mix-blend-screen rounded-full bg-gradient-to-tr from-cyan-300 to-emerald-300 blur-[90px]" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#818cf8 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
          <HeroSection onGetStarted={() => setAuthOpen(true)} />
          
          {/* TECH STACK MARQUEE */}
          <TechStackMarquee />
        </div>

        {/* PLAYGROUND SECTION */}
        <div className="relative w-full py-12 bg-[linear-gradient(135deg,#f0fdf4_0%,#e0f2fe_100%)] dark:bg-[linear-gradient(135deg,#071311_0%,#0f172a_100%)]">
          <div className="absolute top-0 right-0 w-[800px] h-[400px] pointer-events-none z-0 opacity-[0.4] dark:opacity-[0.1] mix-blend-multiply dark:mix-blend-screen rounded-full bg-gradient-to-l from-emerald-200 to-transparent blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#34d399 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
          <PlaygroundSection onRequireAuth={!user ? handleRequireAuth : undefined} />
        </div>

        {/* FEATURES GRID SECTION */}
        <div className="relative w-full py-12 bg-[linear-gradient(135deg,#fff1f2_0%,#ffedd5_100%)] dark:bg-[linear-gradient(135deg,#2a1215_0%,#1f130a_100%)]">
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] pointer-events-none z-0 opacity-[0.4] dark:opacity-[0.1] mix-blend-multiply dark:mix-blend-screen rounded-full bg-gradient-to-tr from-rose-200 to-orange-100 blur-[90px]" />
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f43f5e 2px, transparent 2px)', backgroundSize: '36px 36px' }} />
          <FeaturesGrid onRequireAuth={!user ? handleRequireAuth : undefined} />
        </div>

        {/* DISCOVER SECTION */}
        <div className="relative w-full py-12 bg-[linear-gradient(135deg,#ecfeff_0%,#e0e7ff_100%)] dark:bg-[linear-gradient(135deg,#061118_0%,#172554_100%)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none z-0 opacity-[0.5] dark:opacity-[0.1] mix-blend-multiply dark:mix-blend-screen rounded-full bg-gradient-to-r from-cyan-200 to-blue-200 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#22d3ee 2px, transparent 2px)', backgroundSize: '28px 28px' }} />
          <DiscoverSection />
        </div>

        {/* FAQ SECTION */}
        <div className="relative w-full py-12 bg-[linear-gradient(135deg,#faf5ff_0%,#fce7f3_100%)] dark:bg-[linear-gradient(135deg,#120a17_0%,#31112c_100%)]">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] pointer-events-none z-0 opacity-[0.4] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-screen rounded-full bg-gradient-to-bl from-purple-300 to-pink-200 blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#c084fc 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
          <FAQSection />
        </div>

        {/* FOOTER CTA SECTION */}
        <div className="relative w-full py-12 bg-[linear-gradient(135deg,#f8faff_0%,#f1f5f9_100%)] dark:bg-[linear-gradient(135deg,#0b0f19_0%,#0f172a_100%)]">
          <div className="absolute bottom-0 inset-x-0 h-[400px] pointer-events-none z-0 opacity-[0.5] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-screen bg-gradient-to-t from-indigo-200 to-transparent blur-[60px]" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
          <FooterCTA onGetStarted={() => setAuthOpen(true)} />
        </div>
      </main>

      <AppFooter />
    </div>
  );
}