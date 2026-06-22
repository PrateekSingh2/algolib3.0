import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import { ShieldAlert, Terminal, Lock, AlertTriangle, ChevronRight } from 'lucide-react';

const Section = ({ num, title, icon: Icon, children }: any) => (
  <div className="mb-16 last:mb-0 relative">
    <div className="absolute -left-8 top-1 hidden md:block text-slate-200 dark:text-white/10 font-mono text-xl font-bold">{num}</div>
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-600 dark:text-white/70" />
      </div>
      <h2 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">{title}</h2>
    </div>
    <div className="text-slate-600 dark:text-zinc-400 font-light leading-relaxed space-y-6">
      {children}
    </div>
  </div>
);

const Terms = () => {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="March 2026">
      
      <Section num="01" title="Acceptance of Terms" icon={ShieldAlert}>
        <p>By accessing and using AlgoLib ("the Platform"), you explicitly agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease use of our services.</p>
      </Section>

      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.05] to-transparent my-12" />

      <Section num="02" title="Description of Service" icon={Terminal}>
        <p>AlgoLib provides an elite suite of developer tools, including algorithmic visualizers, code snippet repositories, and architectural discussion boards. We reserve the right to modify, suspend, or discontinue any aspect of the service without prior notice.</p>
      </Section>

      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.05] to-transparent my-12" />

      <Section num="03" title="User Accounts & Authentication" icon={Lock}>
        <p>To access the core engine (Visualizer) and developer hub, you must authenticate using a verified Google account. As a user, you are solely responsible for:</p>
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 mt-4 space-y-4">
          {[
            "Maintaining the strict confidentiality of your login credentials.",
            "All activities, code submissions, and posts that occur under your account.",
            "Ensuring your profile information complies with our community architecture guidelines."
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <ChevronRight className="w-4 h-4 text-sky-600 dark:text-[#00d2ff] shrink-0 mt-1" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.05] to-transparent my-12" />

      <Section num="04" title="Acceptable Use Policy" icon={AlertTriangle}>
        <p>You agree not to misuse the Platform infrastructure. Strictly prohibited activities include, but are not limited to:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-500/[0.02] border border-red-200 dark:border-red-500/[0.05]">
            <h4 className="text-slate-900 dark:text-white text-sm font-medium mb-2">Security Bypassing</h4>
            <p className="text-xs">Attempting to bypass our authentication guards or Row Level Security (RLS).</p>
          </div>
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-500/[0.02] border border-red-200 dark:border-red-500/[0.05]">
            <h4 className="text-slate-900 dark:text-white text-sm font-medium mb-2">Data Scraping</h4>
            <p className="text-xs">Mining or extracting data from the algorithm library without explicit API permission.</p>
          </div>
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-500/[0.02] border border-red-200 dark:border-red-500/[0.05] md:col-span-2">
            <h4 className="text-slate-900 dark:text-white text-sm font-medium mb-2">Malicious Content</h4>
            <p className="text-xs">Posting spam, malicious code, or abusive content in the Community hub.</p>
          </div>
        </div>
      </Section>

    </LegalLayout>
  );
};

export default Terms;