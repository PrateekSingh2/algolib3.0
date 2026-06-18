import React from 'react';
import Navbar from '../../components/Navbar';

const Status = () => {
  return (
    <div className="min-h-screen bg-[#191430] font-sans relative flex flex-col">
      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="flex-1 w-full flex flex-col relative z-10 pt-12">
        {/* We use an iframe to safely embed the standalone status.html UI */}
        <iframe
          src="https://prateeksingh2.github.io/status.html"
          title="AlgoLib Infrastructure Status"
          className="w-full flex-1 min-h-[calc(100vh-96px)] border-none"
          allowFullScreen
        />
      </main>
    </div>
  );
};

export default Status;
