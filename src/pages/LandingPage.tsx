import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import AuthModal from "@/components/AuthModal";
import HeroSection from "./landing/HeroSection";
import FeaturesGrid from "./landing/FeaturesGrid";
import PlaygroundSection from "./landing/PlaygroundSection";
import DiscoverSection from "./landing/DiscoverSection";
import FAQSection from "./landing/FAQSection";
import FooterCTA from "./landing/FooterCTA";
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
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "linear-gradient(160deg, #06070a 0%, #050507 40%, #07060d 100%)",
      }}
    >
      {/* Global glassmorphic noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Global ambient light — top emerald */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none z-0 opacity-30"
        style={{ background: "radial-gradient(ellipse at top, rgba(0,230,118,0.08) 0%, transparent 65%)", filter: "blur(40px)" }}
      />
      {/* Global ambient light — bottom violet */}
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] pointer-events-none z-0 opacity-20"
        style={{ background: "radial-gradient(ellipse at bottom right, rgba(167,139,250,0.1) 0%, transparent 60%)", filter: "blur(60px)" }}
      />

      <Navbar />

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10">
        <HeroSection onGetStarted={() => setAuthOpen(true)} />

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        <PlaygroundSection onRequireAuth={!user ? handleRequireAuth : undefined} />

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        <FeaturesGrid onRequireAuth={!user ? handleRequireAuth : undefined} />

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        <DiscoverSection />

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        <FAQSection />

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        <FooterCTA onGetStarted={() => setAuthOpen(true)} />
      </main>

      <AppFooter />
    </div>
  );
}