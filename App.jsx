import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useBlockchainStats } from "./hooks/useWallet";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import ManufacturerTab from "./components/ManufacturerTab";
import VerifierTab from "./components/VerifierTab";
import StatsBar from "./components/StatsBar";
import BackgroundOrbs from "./components/BackgroundOrbs";

export default function App() {
  const [activeTab, setActiveTab] = useState("manufacturer");
  const wallet = useWallet();
  const stats = useBlockchainStats(8000);

  return (
    <div className="min-h-screen bg-[#080810] text-white font-body overflow-x-hidden">
      {/* Background */}
      <BackgroundOrbs />
      
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(20, 20, 40, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            backdropFilter: "blur(20px)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#30d158", secondary: "#080810" },
          },
          error: {
            iconTheme: { primary: "#ff2d55", secondary: "#080810" },
          },
        }}
      />

      {/* Header */}
      <Header wallet={wallet} />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* Hero */}
        <HeroSection stats={stats} />

        {/* Stats Bar */}
        <StatsBar stats={stats} />

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 mb-8 p-1.5 glass-card rounded-2xl w-fit mx-auto"
        >
          {[
            { id: "manufacturer", label: "Register Product", icon: "📦" },
            { id: "verifier", label: "Verify Product", icon: "🔍" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                activeTab === tab.id
                  ? "tab-active"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.15))",
                  }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "manufacturer" ? (
              <ManufacturerTab wallet={wallet} onSuccess={stats.refetch} />
            ) : (
              <VerifierTab wallet={wallet} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-white/20 text-sm font-mono border-t border-white/5">
        <span>ChainGuard</span>
        <span className="mx-3">·</span>
        <span>Anti-Counterfeit QR on Blockchain</span>
        <span className="mx-3">·</span>
        <span>Built with ❤️ + Solidity</span>
      </footer>
    </div>
  );
}
