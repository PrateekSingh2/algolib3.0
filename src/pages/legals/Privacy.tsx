import React from "react";
import LegalLayout from "@/components/LegalLayout";
import { Database, Eye, Server, LockKeyhole, UserX, CheckCircle2 } from "lucide-react";

const PrivacyBlock = ({ title, icon: Icon, children }: any) => (
  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors mb-6">
    <div className="flex items-center gap-3 mb-4">
      <Icon className="w-5 h-5 text-white/60" />
      <h3 className="text-lg font-medium text-white">{title}</h3>
    </div>
    <div className="text-zinc-400 font-light text-sm leading-relaxed space-y-4">
      {children}
    </div>
  </div>
);

const Privacy = () => {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="March 2026">
      
      <div className="mb-12">
        <p className="text-zinc-400 text-lg font-light leading-relaxed">
          At AlgoLib, we believe in minimal data collection. When you interact with our engine, we only store what is absolutely necessary to render your developer profile and maintain system security.
        </p>
      </div>

      <PrivacyBlock title="1. Data Extraction & Collection" icon={Database}>
        <p>When you authenticate via Google Auth, we securely ingest the following data points to construct your identity:</p>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#00ff87]" /> <strong>Identity:</strong> Name, Email, and Avatar URI.</li>
          <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#00ff87]" /> <strong>Telemetry:</strong> Interactions with visualizers to monitor engine performance.</li>
        </ul>
      </PrivacyBlock>

      <PrivacyBlock title="2. Infrastructure & Security" icon={Server}>
        <p>Your data is vaulted using enterprise-grade infrastructure. We utilize <strong>Firebase Authentication</strong> for identity resolution and <strong>Supabase (PostgreSQL)</strong> for state management.</p>
        <p>Rigorous Row Level Security (RLS) policies guarantee that your private parameters remain entirely inaccessible to unauthorized queries.</p>
      </PrivacyBlock>

      <PrivacyBlock title="3. Profile Visibility" icon={Eye}>
        <p>Your workspace is private by default. However, explicit public fields configured in your settings (such as your display name, GitHub alias, and bio) will be rendered publicly when you participate in the Community architecture hub.</p>
      </PrivacyBlock>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 border border-white/[0.05] rounded-2xl">
          <LockKeyhole className="w-5 h-5 text-white/50 mb-3" />
          <h4 className="text-white font-medium text-sm mb-2">Zero Third-Party Sales</h4>
          <p className="text-xs text-zinc-500">We do not sell, distribute, or monetize your personal telemetry. Data is shared exclusively with necessary infrastructure providers.</p>
        </div>
        <div className="p-6 border border-white/[0.05] rounded-2xl">
          <UserX className="w-5 h-5 text-white/50 mb-3" />
          <h4 className="text-white font-medium text-sm mb-2">Right to Erasure</h4>
          <p className="text-xs text-zinc-500">You retain full root access to your existence on our platform. Request complete deletion of your records via your settings panel.</p>
        </div>
      </div>

    </LegalLayout>
  );
};

export default Privacy;