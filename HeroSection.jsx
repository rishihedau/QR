import { motion } from "framer-motion";
import { Shield, Zap, Globe } from "lucide-react";
import { useAnimatedCounter } from "../hooks/useWallet";

export default function HeroSection({ stats }) {
  const animatedProducts = useAnimatedCounter(stats.totalProducts, 1200);
  const animatedVerifications = useAnimatedCounter(stats.totalVerifications, 1200);

  return (
    <section className="pt-16 pb-12 text-center">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/60 mb-6 font-mono"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Blockchain-Powered Authentication
        <span className="text-white/30">·</span>
        <span className="text-purple-400">v1.0</span>
      </motion.div>

      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1]"
      >
        Stop{" "}
        <span className="text-gradient-purple">Counterfeits</span>
        <br />
        <span className="text-white/90">with Blockchain QR</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed"
      >
        Register products on-chain, generate tamper-proof QR codes, and let
        anyone verify authenticity in seconds — trustlessly.
      </motion.p>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-12"
      >
        {[
          { icon: <Shield size={13} />, text: "Immutable Record", color: "text-purple-400" },
          { icon: <Zap size={13} />, text: "Instant Scan", color: "text-blue-400" },
          { icon: <Globe size={13} />, text: "Decentralized", color: "text-cyan-400" },
        ].map((feat, i) => (
          <span
            key={i}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs font-medium ${feat.color}`}
          >
            {feat.icon}
            {feat.text}
          </span>
        ))}
      </motion.div>

      {/* Live Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-4 sm:gap-8"
      >
        <StatCounter
          value={animatedProducts}
          label="Products Registered"
          color="from-purple-500 to-blue-500"
        />
        <div className="w-px h-10 bg-white/10" />
        <StatCounter
          value={animatedVerifications}
          label="Verifications Done"
          color="from-cyan-500 to-blue-500"
        />
        <div className="w-px h-10 bg-white/10" />
        <StatCounter
          value={stats.blockNumber || "—"}
          label="Latest Block"
          color="from-green-500 to-cyan-500"
          mono
        />
      </motion.div>
    </section>
  );
}

function StatCounter({ value, label, color, mono }) {
  return (
    <div className="text-center">
      <div
        className={`font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent ${mono ? "font-mono text-xl sm:text-2xl" : ""}`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-white/40 mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  );
}
