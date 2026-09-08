import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Copy, Check, Edit2, Wifi } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, roomCode, serverIp }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [detectedIp, setDetectedIp] = useState(serverIp || null);
  const [customHost, setCustomHost] = useState('');
  const [isEditingHost, setIsEditingHost] = useState(false);

  // Sync serverIp from props if provided
  useEffect(() => {
    if (serverIp && !detectedIp) {
      setDetectedIp(serverIp);
    }
  }, [serverIp, detectedIp]);

  // Fallback: fetch /api/network-info if serverIp not provided in gameState
  useEffect(() => {
    if (isOpen && !detectedIp) {
      fetch('/api/network-info')
        .then((res) => res.json())
        .then((data) => {
          if (data?.localIp && data.localIp !== 'localhost') {
            setDetectedIp(data.localIp);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, detectedIp]);

  // Determine the effective host for the QR code
  const isLoopback =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const effectiveHost =
    customHost.trim() || (isLoopback && detectedIp ? detectedIp : window.location.hostname);

  const effectivePort = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;
  const joinUrl = `${protocol}//${effectiveHost}${effectivePort}?room=${roomCode}`;

  // Render QR Code
  useEffect(() => {
    if (isOpen && canvasRef.current && roomCode) {
      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          width: 240,
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
        <p className="text-xs text-slate-400 mb-3">
          Point your phone camera at the QR code to join Room{' '}
          <span className="font-mono font-bold text-rose-400">{roomCode}</span>
        </p>

        {/* QR Code Canvas */}
        <div className="bg-white p-3 rounded-2xl shadow-inner inline-block mx-auto mb-3">
          <canvas ref={canvasRef} className="rounded-lg"></canvas>
        </div>

        {/* Display the exact URL with local IP */}
        <div className="mb-4 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-left">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Mobile Join URL</span>
            </span>
            <button
              type="button"
              onClick={() => setIsEditingHost(!isEditingHost)}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
            >
              <Edit2 className="w-2.5 h-2.5" />
              <span>{isEditingHost ? 'Close' : 'Change IP'}</span>
            </button>
          </div>

          {isEditingHost ? (
            <div className="mt-1">
              <input
                type="text"
                placeholder={detectedIp || 'e.g. 192.168.1.50'}
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Override host IP if you are using a different network adapter or tunnel.
              </p>
            </div>
          ) : (
            <p className="text-xs font-mono font-semibold text-slate-200 truncate select-all">
              {joinUrl}
            </p>
          )}
        </div>

        {/* Copy Link Button */}
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
