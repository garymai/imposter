import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Copy, Check } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, roomCode }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  // Generate join URL: e.g. current origin with ?room=CODE
  const joinUrl = `${window.location.origin}?room=${roomCode}`;

  useEffect(() => {
    if (isOpen && canvasRef.current && roomCode) {
      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        },
        (err) => {
          if (err) console.error('Error generating QR code:', err);
        }
      );
    }
  }, [isOpen, joinUrl, roomCode]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Scan to Join</h3>
        <p className="text-sm text-slate-400 mb-4">
          Point phone camera to join Room <span className="font-mono font-bold text-rose-400">{roomCode}</span>
        </p>

        <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mx-auto mb-5">
          <canvas ref={canvasRef} className="rounded-lg"></canvas>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-400" />
              <span>Copy Join Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
