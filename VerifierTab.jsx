import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Search, Camera, CameraOff, CheckCircle, XCircle, Package, User, Hash, Calendar, BarChart3, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { api, formatDate, parseQRData } from "../utils/api";

export default function VerifierTab({ wallet }) {
  const [mode, setMode] = useState("manual"); // "manual" | "camera"
  const [productId, setProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanned, setScanned] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const verify = async (id) => {
    const cleanId = (id || productId).trim();
    if (!cleanId) return toast.error("Enter a product ID");
    setLoading(true);
    setResult(null);
    try {
      const data = await api.verifyProduct(cleanId);
      setResult(data);
      if (data.genuine) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success("🎉 Genuine product confirmed on blockchain!");
      } else {
        toast.error("⚠️ Product not found — possible counterfeit!");
      }
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setScanned(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode("camera");
      startQRDetection();
    } catch (err) {
      setCameraError("Camera permission denied or not available");
      toast.error("Cannot access camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setMode("manual");
  };

  const startQRDetection = () => {
    // Use BarcodeDetector if available (Chromium browsers)
    if ("BarcodeDetector" in window) {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const detect = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && !scanned) {
            setScanned(true);
            const rawValue = barcodes[0].rawValue;
            const parsedId = parseQRData(rawValue);
            setProductId(parsedId);
            stopCamera();
            toast("QR Code scanned! Verifying...", { icon: "📷" });
            await verify(parsedId);
          } else {
            requestAnimationFrame(detect);
          }
        } catch {
          requestAnimationFrame(detect);
        }
      };
      setTimeout(() => requestAnimationFrame(detect), 1000);
    } else {
      // Fallback: just show camera, user can manually enter from scan
      toast("Camera active. Use BarcodeDetector-compatible browser for auto-scan.", {
        icon: "📷",
        duration: 4000,
      });
    }
  };

  const reset = () => {
    setResult(null);
    setProductId("");
    setScanned(false);
  };

  return (
    <div className="relative">
      {/* Confetti on genuine */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          colors={["#30d158", "#0a84ff", "#bf5af2", "#32d2ff", "#ff9f0a"]}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100, pointerEvents: "none" }}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Scanner */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.3), rgba(50,210,255,0.2))" }}>
              <Search size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Verify Product</h2>
              <p className="text-xs text-white/40">Check authenticity on the blockchain</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-5 p-1 bg-white/4 rounded-xl border border-white/8">
            <button
              onClick={() => { stopCamera(); setMode("manual"); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "manual" ? "bg-blue-600/30 text-blue-300 border border-blue-500/30" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Search size={13} />
              Manual Entry
            </button>
            <button
              onClick={mode === "camera" ? stopCamera : startCamera}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "camera" ? "bg-blue-600/30 text-blue-300 border border-blue-500/30" : "text-white/40 hover:text-white/60"
              }`}
            >
              {mode === "camera" ? <CameraOff size={13} /> : <Camera size={13} />}
              {mode === "camera" ? "Stop Camera" : "QR Scanner"}
            </button>
          </div>

          {/* Camera view */}
          <AnimatePresence>
            {mode === "camera" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5"
              >
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-40 h-40">
                      {/* Corner brackets */}
                      {["tl", "tr", "bl", "br"].map((pos) => (
                        <div
                          key={pos}
                          className="absolute w-6 h-6 border-blue-400"
                          style={{
                            borderTopWidth: pos.startsWith("t") ? 2 : 0,
                            borderBottomWidth: pos.startsWith("b") ? 2 : 0,
                            borderLeftWidth: pos.endsWith("l") ? 2 : 0,
                            borderRightWidth: pos.endsWith("r") ? 2 : 0,
                            top: pos.startsWith("t") ? 0 : "auto",
                            bottom: pos.startsWith("b") ? 0 : "auto",
                            left: pos.endsWith("l") ? 0 : "auto",
                            right: pos.endsWith("r") ? 0 : "auto",
                          }}
                        />
                      ))}
                      {/* Scan beam */}
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80 scan-beam"
                      />
                    </div>
                  </div>
                  {/* Label */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white/60">
                    Point camera at QR code
                  </div>
                </div>
                {cameraError && (
                  <p className="text-xs text-red-400 mt-2">{cameraError}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual input */}
          <div className="flex gap-2">
            <input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              placeholder="Enter Product ID (e.g. PROD-DEMO-001)"
              className="input-glass flex-1 font-mono text-sm"
            />
            {result && (
              <button
                onClick={reset}
                className="px-3 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/50 hover:text-white/80 transition-all"
                title="Reset"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => verify()}
            disabled={loading || !productId.trim()}
            className="btn-primary w-full mt-3 justify-center"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #0891b2)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Querying blockchain...
              </>
            ) : (
              <>
                <Search size={15} />
                Verify Authenticity
              </>
            )}
          </button>

          {/* Demo product IDs */}
          <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/6">
            <p className="text-[11px] text-white/30 mb-2 uppercase tracking-wider">Demo Product IDs</p>
            <div className="flex flex-wrap gap-2">
              {["PROD-DEMO-001", "PROD-DEMO-002", "PROD-DEMO-003"].map((id) => (
                <button
                  key={id}
                  onClick={() => setProductId(id)}
                  className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white/5 border border-white/8 text-white/50 hover:text-white/80 hover:border-white/15 transition-all"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <h2 className="font-display font-semibold text-lg mb-1">Verification Result</h2>
          <p className="text-xs text-white/40 mb-6">Blockchain authentication status</p>

          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/4 border border-white/8">
                  <Search size={28} className="text-white/20" />
                </div>
                <p className="text-white/30 text-sm">Enter a product ID and click verify to check authenticity</p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center py-12"
              >
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin animate-[spin_1.5s_linear_infinite_reverse]" />
                </div>
                <p className="text-white/50 text-sm animate-pulse">Querying blockchain node...</p>
                <p className="text-white/25 text-xs mt-1 font-mono">{productId}</p>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col"
              >
                {/* Status banner */}
                <div
                  className={`rounded-2xl p-5 mb-5 border flex items-center gap-4 ${
                    result.genuine
                      ? "bg-green-500/10 border-green-500/25"
                      : "bg-red-500/10 border-red-500/25"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      result.genuine ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                  >
                    {result.genuine ? (
                      <CheckCircle size={28} className="text-green-400" />
                    ) : (
                      <XCircle size={28} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className={`font-display font-bold text-xl ${result.genuine ? "text-green-400" : "text-red-400"}`}>
                      {result.genuine ? "GENUINE ✓" : "COUNTERFEIT ✗"}
                    </div>
                    <div className="text-sm text-white/50 mt-0.5">
                      {result.genuine
                        ? "Verified on the Ethereum blockchain"
                        : "No record found in the blockchain"}
                    </div>
                  </div>
                </div>

                {/* Product details */}
                {result.genuine && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    {[
                      { icon: <Package size={14} />, label: "Product", value: result.name },
                      { icon: <User size={14} />, label: "Manufacturer", value: result.manufacturer },
                      { icon: <Hash size={14} />, label: "Batch", value: result.batchNumber },
                      { icon: <Calendar size={14} />, label: "Registered", value: formatDate(result.registeredAt) },
                      { icon: <BarChart3 size={14} />, label: "Verifications", value: `${result.verificationCount || 0} times` },
                    ]
                      .filter((f) => f.value)
                      .map((field) => (
                        <div
                          key={field.label}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/6"
                        >
                          <span className="text-white/30 shrink-0">{field.icon}</span>
                          <span className="text-xs text-white/40 w-20 shrink-0">{field.label}</span>
                          <span className="text-sm text-white/80 font-medium truncate">{field.value}</span>
                        </div>
                      ))}

                    {result.registeredBy && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/6">
                        <span className="text-white/30 shrink-0">🔗</span>
                        <span className="text-xs text-white/40 w-20 shrink-0">Registered by</span>
                        <span className="text-xs text-white/60 font-mono truncate">{result.registeredBy}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {!result.genuine && (
                  <div className="space-y-3 text-sm text-white/50">
                    <p>This product ID has no record in the blockchain, which means:</p>
                    <ul className="space-y-1.5 list-none">
                      {[
                        "It may be a counterfeit product",
                        "The QR code may have been tampered with",
                        "The product may not be from an authorized manufacturer",
                      ].map((s) => (
                        <li key={s} className="flex items-start gap-2 text-red-400/70">
                          <span className="mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
