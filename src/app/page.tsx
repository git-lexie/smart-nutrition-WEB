"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Bluetooth, Brain, ChevronRight, Scale } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  // Auto-redirect logic
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/home');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl text-emerald-600 dark:text-emerald-400">
          <Activity className="h-6 w-6" />
          <span>SmartNutri</span>
        </div>

      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto w-full py-12">
        
        {/* <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          New: Gemini AI Integration
        </div> */}

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Your Personal <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500">
            AI Nutritionist
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-10 leading-relaxed">
          Connect your smart scale via Bluetooth, weigh your food, and let AI analyze your nutrition instantly. No more manual guessing.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/signup" 
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            Get Started Free <ChevronRight size={20} />
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl font-bold text-lg transition-all hover:scale-105"
          >
            I have an account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left w-full">
          <FeatureCard 
            icon={<Bluetooth className="h-6 w-6 text-blue-500" />}
            title="IoT Enabled"
            desc="Connects directly to Bluetooth scales for real-time precision weighing."
          />
          <FeatureCard 
            icon={<Brain className="h-6 w-6 text-purple-500" />}
            title="AI Powered"
            desc="AI Nutritionist calculates macros and gives personalized health advice."
          />
          <FeatureCard 
            icon={<Scale className="h-6 w-6 text-emerald-500" />}
            title="Smart Tracking"
            desc="Offline-capable PWA that syncs your progress when back online."
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-400 text-sm">
        © {new Date().getFullYear()} SmartNutri. Build for Your Need
      </footer>
    </div>
  );
}

// Helper Component for Features
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
      <div className="bg-slate-50 dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}