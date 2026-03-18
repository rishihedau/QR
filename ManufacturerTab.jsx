import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Download, RefreshCw, Package, Sparkles, ChevronRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";

const INITIAL_FORM = {
  productId: "",
  name: "",
  manufacturer: "",
  batchNumber: "",
};

export default function ManufacturerTab({ wallet, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const qrRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.productId.trim()) newErrors.productId = "Product ID is required";
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.manufacturer.trim()) newErrors.manufacturer = "Manufacturer is required";
    if (!form.batchNumber.trim()) newErrors.batchNumber = "Batch number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateId = async () => {
    try {
      const { productId } = await api.generateId();
      setForm((p) => ({ ...p, productId }));
    } catch {
      const fallback = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      setForm((p) => ({ ...p, productId: fallback }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await api.registerProduct(form);
      setResult(data);
      toast.success(`✅ "${form.name}" registered on blockchain!`);
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${form.name || "product"}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR Code downloaded!");
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setErrors({});
  };

  const qrValue = form.productId
    ? JSON.stringify({
        productId: form.productId,
        name: form.name || "—",
        manufacturer: form.manufacturer || "—",
        batchNumber: form.batchNumber || "—",
      })
    : "scan-to-verify";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Form */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.2))" }}>
            <Package size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg">Register Product</h2>
            <p className="text-xs text-white/40">Create an immutable blockchain record</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product ID with generate button */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
              Product ID
            </label>
            <div className="flex gap-2">
              <input
                name="productId"
                value={form.productId}
                onChange={handleChange}
                placeholder="PROD-2024-XXXXX"
                className={`input-glass flex-1 font-mono text-sm ${errors.productId ? "border-red-500/60" : ""}`}
              />
              <button
                type="button"
                onClick={generateId}
                className="px-3 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-white/50 hover:text-white/80"
                title="Auto-generate ID"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {errors.productId && <p className="text-xs text-red-400 mt-1">{errors.productId}</p>}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
              Product Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Premium Running Shoes"
              className={`input-glass ${errors.name ? "border-red-500/60" : ""}`}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
              Manufacturer
            </label>
            <input
              name="manufacturer"
              value={form.manufacturer}
              onChange={handleChange}
              placeholder="e.g. NikeCorp Ltd."
              className={`input-glass ${errors.manufacturer ? "border-red-500/60" : ""}`}
            />
            {errors.manufacturer && <p className="text-xs text-red-400 mt-1">{errors.manufacturer}</p>}
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
              Batch Number
            </label>
            <input
              name="batchNumber"
              value={form.batchNumber}
              onChange={handleChange}
              placeholder="e.g. BATCH-2024-A01"
              className={`input-glass ${errors.batchNumber ? "border-red-500/60" : ""}`}
            />
            {errors.batchNumber && <p className="text-xs text-red-400 mt-1">{errors.batchNumber}</p>}
          </div>

          {/* Wallet warning */}
          {!wallet.isConnected && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>Connect your wallet to register on the actual blockchain. Demo mode uses the backend server.</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registering on chain...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Register Product
                  <ChevronRight size={15} />
                </>
              )}
            </button>
            {result && (
              <button type="button" onClick={resetForm} className="btn-secondary px-4">
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Success result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl border border-green-500/20 bg-green-500/5"
            >
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
                <span>✅</span> Registered on Blockchain
              </div>
              <div className="space-y-1">
                {result.txHash && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/40 w-14">TX Hash</span>
                    <span className="font-mono text-white/70 text-[11px]">{result.txHash.slice(0, 20)}...</span>
                  </div>
                )}
                {result.blockNumber && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/40 w-14">Block</span>
                    <span className="font-mono text-white/70">#{result.blockNumber}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: QR Preview */}
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center">
        <h2 className="font-display font-semibold text-lg mb-1 self-start">QR Code Preview</h2>
        <p className="text-xs text-white/40 mb-6 self-start">Updates live as you type</p>

        <div
          ref={qrRef}
          className={`p-4 rounded-2xl transition-all duration-500 ${
            result ? "qr-genuine" : "border border-white/10 bg-white/5"
          }`}
        >
          <QRCodeCanvas
            value={qrValue}
            size={200}
            bgColor="#ffffff"
            fgColor="#0a0a1a"
            level="H"
            includeMargin={true}
            imageSettings={
              result
                ? {
                    src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyIDJhMTAgMTAgMCAxIDAgMCAyMEExMCAxMCAwIDAgMCAxMiAyem0tMSAxNS41di03bC01IDIuNSAyLTYgNSAzVjZsNSA5LTUgMi41eiIgZmlsbD0iIzBhMGExYSIvPjwvc3ZnPg==",
                    width: 30,
                    height: 30,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>

        {/* Product info preview */}
        {(form.name || form.productId) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 w-full space-y-1.5"
          >
            {[
              { label: "ID", value: form.productId },
              { label: "Product", value: form.name },
              { label: "Brand", value: form.manufacturer },
              { label: "Batch", value: form.batchNumber },
            ]
              .filter((f) => f.value)
              .map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white/4">
                  <span className="text-white/30 w-12 shrink-0">{f.label}</span>
                  <span className="text-white/70 font-mono truncate">{f.value}</span>
                </div>
              ))}
          </motion.div>
        )}

        {/* Download button */}
        <button
          onClick={downloadQR}
          disabled={!result}
          className={`mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
            result
              ? "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
              : "border border-white/8 text-white/20 cursor-not-allowed"
          }`}
        >
          <Download size={15} />
          {result ? "Download QR Code" : "Register product first"}
        </button>

        {!result && (
          <p className="text-xs text-white/20 mt-3 text-center">
            QR code becomes downloadable after successful blockchain registration
          </p>
        )}
      </div>
    </div>
  );
}
