import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Shield, ChevronDown, LogOut, Copy, ExternalLink, Zap } from "lucide-react";

function formatAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Header({ wallet }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="relative z-20 sticky top-0">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-[rgba(8,8,16,0.8)] backdrop-blur-xl border-b border-white/5" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
              <Shield size={16} className="text-white" />
            </div>
            <div className="absolute -inset-1 rounded-lg blur opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Chain<span className="text-gradient-purple">Guard</span>
          </span>
        </motion.div>

        {/* Nav links - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <a href="#" className="hover:text-white/80 transition-colors">Docs</a>
          <a href="#" className="hover:text-white/80 transition-colors">Explorer</a>
          <a href="#" className="hover:text-white/80 transition-colors">API</a>
        </nav>

        {/* Wallet button */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {!wallet.isConnected ? (
            <button
              onClick={wallet.connect}
              disabled={wallet.isConnecting}
              className="relative group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.8), rgba(37,99,235,0.8))" }}
            >
              {/* Pulse ring */}
              {!wallet.isConnecting && (
                <span className="absolute -inset-px rounded-xl animate-pulse opacity-30"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }} />
              )}
              <Wallet size={15} />
              {wallet.isConnecting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Connect Wallet"
              )}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm border border-white/10 hover:border-white/20 transition-all duration-200 bg-white/5 hover:bg-white/8"
              >
                {/* Online indicator */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="font-mono text-xs text-white/80">{formatAddress(wallet.account)}</span>
                <span className="hidden sm:flex items-center gap-1 text-xs text-white/40 border-l border-white/10 pl-2 ml-1">
                  <Zap size={10} className="text-yellow-400" />
                  {wallet.networkName}
                </span>
                <ChevronDown size={14} className={`text-white/40 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 glass-card rounded-xl p-3 z-50"
                  >
                    <div className="px-2 py-2 mb-2 border-b border-white/8">
                      <p className="text-xs text-white/40 mb-1">Connected Account</p>
                      <p className="font-mono text-xs text-white/80 break-all">{wallet.account}</p>
                      {wallet.balance && (
                        <p className="text-xs text-white/50 mt-1">
                          Balance: <span className="text-white/80">{wallet.balance} ETH</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-2 w-full px-2 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Copy size={14} />
                      {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <a
                      href={`https://etherscan.io/address/${wallet.account}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 w-full px-2 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <ExternalLink size={14} />
                      View on Etherscan
                    </a>
                    <button
                      onClick={() => { wallet.disconnect(); setShowDropdown(false); }}
                      className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all mt-1"
                    >
                      <LogOut size={14} />
                      Disconnect
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </header>
  );
}
