/**
 * QRScanner — QR code generator + URL-based asset pre-fill.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Download, ChevronDown } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import useNexusStore from '@/store/nexusStore';

export default function QRScanner({ onAssetFromQR }) {
  const [open, setOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [scanInput, setScanInput] = useState('');
  const { assets } = useNexusStore();

  const qrValue = selectedTag
    ? `${window.location.origin}/oracle?asset=${selectedTag}`
    : '';

  const downloadQR = () => {
    const canvas = document.getElementById('nexus-qr-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `NEXUS-QR-${selectedTag}.png`;
    link.href = url;
    link.click();
  };

  const handleScanInput = (e) => {
    const val = e.target.value.trim();
    setScanInput(val);
    // Parse asset tag from URL format: /oracle?asset=TAG
    try {
      const url = new URL(val.startsWith('http') ? val : `http://x${val}`);
      const tag = url.searchParams.get('asset');
      if (tag && onAssetFromQR) onAssetFromQR(tag);
    } catch {
      // Try plain tag format
      if (val && !val.includes('/') && onAssetFromQR) onAssetFromQR(val.toUpperCase());
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-nexus-muted hover:text-nexus-text hover:bg-white/5 transition-all"
        title="Generate / Scan QR Code"
      >
        <QrCode className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              className="glass-card w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-nexus-text">Asset QR Codes</h3>
                  <p className="text-xs text-nexus-textMuted mt-0.5">Generate QR codes for field technicians</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-nexus-muted hover:text-nexus-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Generate Section */}
              <div className="mb-6">
                <label className="text-xs font-medium text-nexus-textMuted mb-1.5 block">Select Asset</label>
                <div className="relative">
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text
                      appearance-none cursor-pointer focus:outline-none focus:border-nexus-primary pr-8 transition-colors"
                  >
                    <option value="">— Select an asset —</option>
                    {assets.map((a) => (
                      <option key={a.tag} value={a.tag}>{a.tag} — {a.name}</option>
                    ))}
                    {/* Demo options if no assets */}
                    {assets.length === 0 && (
                      <>
                        <option value="HX-204">HX-204 — Heat Exchanger</option>
                        <option value="P-101">P-101 — Centrifugal Pump</option>
                        <option value="CV-301">CV-301 — Control Valve</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-muted pointer-events-none" />
                </div>

                {selectedTag && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex flex-col items-center gap-4"
                  >
                    {/* Display QR (SVG for display) */}
                    <div className="p-4 bg-white rounded-xl">
                      <QRCodeSVG
                        value={qrValue}
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#0A0A0F"
                        level="M"
                      />
                    </div>

                    {/* Hidden canvas for download */}
                    <div className="hidden">
                      <QRCodeCanvas
                        id="nexus-qr-canvas"
                        value={qrValue}
                        size={512}
                        bgColor="#ffffff"
                        fgColor="#0A0A0F"
                        level="M"
                      />
                    </div>

                    <p className="text-xs text-nexus-muted font-mono break-all text-center px-2">{qrValue}</p>

                    <button
                      onClick={downloadQR}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nexus-primary hover:bg-nexus-primaryHover
                        text-white text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download QR PNG
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Scan / Pre-fill Section */}
              <div className="border-t border-nexus-border pt-5">
                <label className="text-xs font-medium text-nexus-textMuted mb-1.5 block">
                  Pre-fill from QR URL or asset tag
                </label>
                <div className="flex gap-2">
                  <input
                    value={scanInput}
                    onChange={handleScanInput}
                    placeholder="Paste QR URL or enter tag (e.g. HX-204)"
                    className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text
                      placeholder:text-nexus-muted focus:outline-none focus:border-nexus-primary transition-colors"
                  />
                  <button
                    onClick={() => { handleScanInput({ target: { value: scanInput } }); setOpen(false); }}
                    disabled={!scanInput}
                    className="px-3 py-2 rounded-lg bg-nexus-primary hover:bg-nexus-primaryHover disabled:opacity-40
                      text-white text-sm font-medium transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-nexus-muted mt-1.5">
                  Pre-fills the equipment filter and auto-queries for the asset
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
