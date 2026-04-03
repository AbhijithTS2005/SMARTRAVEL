'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { emergencyService } from '@/services/emergency';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Phone, X, Loader2 } from 'lucide-react';

export default function SOSButton() {
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [sosData, setSOSData] = useState<{
    helplines: { name: string; number: string }[];
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleTriggerSOS = useCallback(async () => {
    cleanup();
    setLoading(true);
    setTriggered(true);
    setShowConfirm(false);

    try {
      let lat: number | undefined;
      let lng: number | undefined;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Geolocation unavailable
      }

      const data = await emergencyService.triggerSOS(lat, lng);
      setSOSData({
        helplines: data.helplines.slice(0, 5),
        message: data.message,
      });
    } catch {
      setSOSData({
        helplines: [
          { name: 'Police', number: '100' },
          { name: 'Ambulance', number: '108' },
          { name: 'Fire', number: '101' },
        ],
        message: 'Call emergency services immediately.',
      });
    } finally {
      setLoading(false);
    }
  }, [cleanup]);

  // When confirm modal opens, start auto-countdown
  useEffect(() => {
    if (showConfirm) {
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            handleTriggerSOS();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return cleanup;
  }, [showConfirm, cleanup, handleTriggerSOS]);

  const handleSOSClick = useCallback(() => {
    if (triggered || showConfirm) return;
    setShowConfirm(true);
  }, [triggered, showConfirm]);

  const handleCancel = useCallback(() => {
    cleanup();
    setShowConfirm(false);
    setCountdown(3);
  }, [cleanup]);

  const handleClose = useCallback(() => {
    setTriggered(false);
    setSOSData(null);
    setShowConfirm(false);
    setCountdown(3);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  if (!user) return null;

  return (
    <>
      {/* Floating SOS Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-6 right-6 z-[100]"
      >
        <div className="relative">
          <button
            onClick={handleSOSClick}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all select-none bg-red-500 hover:bg-red-600 hover:scale-110 shadow-red-500/30 hover:shadow-red-500/50 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title="Emergency SOS"
          >
            <ShieldAlert className="w-6 h-6 text-white" />
          </button>

          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping bg-red-400/30 pointer-events-none" />
        </div>

        {!triggered && !showConfirm && (
          <p className="text-[10px] text-center mt-1.5 text-red-400 font-bold tracking-wider uppercase">SOS</p>
        )}
      </motion.div>

      {/* Confirmation Modal — auto-triggers after 3 second countdown */}
      <AnimatePresence>
        {showConfirm && !triggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: '#1b1b1b' }}
            >
              <div className="px-6 pt-8 pb-6 text-center">
                {/* Countdown Circle */}
                <div className="relative w-24 h-24 mx-auto mb-5">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="5" />
                    <circle
                      cx="48" cy="48" r="42" fill="none"
                      stroke="#ef4444" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={2 * Math.PI * 42 * (1 - countdown / 3)}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-red-500">{countdown}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">Emergency SOS</h2>
                <p className="text-white/50 text-sm mb-6">
                  SOS will be triggered in <strong className="text-red-400">{countdown} seconds</strong>.
                  <br />Your location will be captured.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleTriggerSOS}
                    className="w-full py-3.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-5 h-5" /> TRIGGER SOS NOW
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full py-3.5 rounded-xl bg-white/10 text-white/60 font-semibold text-sm hover:bg-white/15 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Triggered Modal */}
      <AnimatePresence>
        {triggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: '#1b1b1b' }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 text-center border-b border-white/10">
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <ShieldAlert className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {loading ? 'Sending SOS...' : 'SOS Activated'}
                </h2>
                <p className="text-white/50 text-sm">
                  {loading ? 'Getting your location...' : sosData?.message}
                </p>
              </div>

              {/* Helplines */}
              {sosData && !loading && (
                <div className="p-4 space-y-2">
                  <p className="text-xs text-white/40 font-bold uppercase tracking-wider px-2 mb-3">
                    Call Emergency Services
                  </p>
                  {sosData.helplines.map((h) => (
                    <a
                      key={h.number}
                      href={`tel:${h.number}`}
                      className="flex items-center gap-4 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{h.name}</p>
                        <p className="text-red-400 text-lg font-bold">{h.number}</p>
                      </div>
                      <div className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        CALL
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {loading && (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                </div>
              )}

              {/* Close */}
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-xl bg-white/10 text-white/60 font-semibold text-sm hover:bg-white/15 transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
