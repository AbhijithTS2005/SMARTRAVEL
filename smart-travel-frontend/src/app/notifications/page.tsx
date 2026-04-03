'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { notificationsService, type Notification } from '@/services/notifications';
import {
  isPushSupported,
  getPermissionStatus,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
} from '@/services/pushNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, BellRing, CheckCheck, Trash2, Loader2,
  AlertTriangle, Info, CloudRain, Shield, MapPin, Smartphone,
  Monitor, Zap, Send, Volume2, VolumeX, Sparkles, Star
} from 'lucide-react';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [now, setNow] = useState(() => Date.now());

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Check push notification status on mount
  useEffect(() => {
    const checkPush = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);
      setPushPermission(getPermissionStatus());
      if (supported) {
        const subscribed = await isSubscribed();
        setPushEnabled(subscribed);
      }
    };
    checkPush();
  }, []);

  const handleTogglePush = useCallback(async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        setPushPermission(getPermissionStatus());
      } else {
        const success = await subscribeToPush();
        setPushEnabled(success);
        setPushPermission(getPermissionStatus());
        if (success) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.error('Push toggle failed:', err);
    } finally {
      setPushLoading(false);
    }
  }, [pushEnabled]);

  const handleTestNotification = useCallback(async () => {
    setTestSending(true);
    try {
      await sendTestNotification();
    } finally {
      setTimeout(() => setTestSending(false), 2000);
    }
  }, []);

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll(),
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsService.getUnreadCount,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const notifications: Notification[] = paginatedData?.data || [];
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read_at;
    if (filter === 'read') return !!n.read_at;
    return true;
  });

  const getIcon = (notification: Notification) => {
    const alertType = notification.data?.alert_type || notification.data?.type || '';
    switch (alertType) {
      case 'weather': case 'weather_alert': return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'disaster': case 'disaster_alert': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'safety': case 'safety_alert': case 'aqi_warning': return <Shield className="w-5 h-5 text-orange-400" />;
      case 'destination': case 'recommendation_update': return <MapPin className="w-5 h-5 text-indigo-400" />;
      case 'new_match': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'travel_season': return <Star className="w-5 h-5 text-amber-400" />;
      default: return <Info className="w-5 h-5 text-[#8a8a8a]" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((now - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
        <TopNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24" style={{ background: 'linear-gradient(180deg, #1b3a2d 0%, #264f3d 100%)' }}>
          <div className="max-w-[900px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-[#c8956c] text-xs font-bold tracking-[0.35em] uppercase">
                <Bell className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
                STAY UPDATED
              </motion.p>
              {unreadCount > 0 && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#c8956c] text-white hover:bg-[#b5845e] transition shadow-lg">
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </motion.button>
              )}
            </div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-4">
              Notifications
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-white/30 text-lg max-w-xl">
              Stay updated on weather alerts, travel advisories, and safety notifications.
            </motion.p>
          </div>
        </section>

        {/* Content */}
        <section className="px-6 md:px-16 lg:px-24 pb-24">
          <div className="max-w-[900px] mx-auto">

            {/* ═══ PUSH NOTIFICATION TOGGLE CARD ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 -mt-8 relative z-10"
            >
              <div
                className="rounded-2xl overflow-hidden border"
                style={{
                  background: pushEnabled
                    ? 'linear-gradient(135deg, #1b3a2d 0%, #264f3d 100%)'
                    : 'rgba(255,255,255,0.95)',
                  borderColor: pushEnabled ? 'rgba(200,149,108,0.3)' : 'rgba(0,0,0,0.06)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-5">
                    {/* Animated bell icon */}
                    <div className="relative flex-shrink-0">
                      <motion.div
                        animate={pushEnabled ? {
                          rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                        } : {}}
                        transition={{ duration: 1.5, repeat: pushEnabled ? Infinity : 0, repeatDelay: 5 }}
                        className="p-3.5 rounded-2xl"
                        style={{
                          background: pushEnabled
                            ? 'rgba(200,149,108,0.15)'
                            : 'rgba(27,58,45,0.05)',
                        }}
                      >
                        {pushEnabled ? (
                          <BellRing className="w-7 h-7 text-[#c8956c]" />
                        ) : (
                          <BellOff className="w-7 h-7 text-[#1b3a2d]/30" />
                        )}
                      </motion.div>
                      {pushEnabled && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2"
                          style={{ borderColor: pushEnabled ? '#1b3a2d' : '#fff' }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h3 className={`text-lg font-bold mb-1 ${pushEnabled ? 'text-white' : 'text-[#1b3a2d]'}`}>
                            Push Notifications
                          </h3>
                          <p className={`text-sm leading-relaxed ${pushEnabled ? 'text-white/50' : 'text-[#8a8a8a]'}`}>
                            {pushEnabled
                              ? 'Active — You\'ll receive real-time alerts on this device for weather, AQI, disasters, travel tips & new matches.'
                              : pushPermission === 'denied'
                                ? 'Notifications are blocked. Please enable them in your browser settings.'
                                : 'Get instant alerts on your phone & PC for weather emergencies, travel tips, and smart recommendations.'
                            }
                          </p>

                          {/* Device indicators */}
                          <div className={`flex items-center gap-3 mt-3 text-xs font-medium ${pushEnabled ? 'text-white/30' : 'text-[#1b3a2d]/25'}`}>
                            <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> Desktop</span>
                            <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> Mobile</span>
                            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Instant</span>
                          </div>
                        </div>

                        {/* Toggle button */}
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={handleTogglePush}
                            disabled={pushLoading || pushPermission === 'denied'}
                            className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                              pushEnabled
                                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                : pushPermission === 'denied'
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-[#c8956c] text-white hover:bg-[#b5845e] shadow-lg shadow-[#c8956c]/20'
                            }`}
                          >
                            {pushLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : pushEnabled ? (
                              <Volume2 className="w-4 h-4" />
                            ) : pushPermission === 'denied' ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                            {pushLoading ? 'Processing...' : pushEnabled ? 'Enabled' : pushPermission === 'denied' ? 'Blocked' : 'Enable'}
                          </button>

                          {/* Test notification button */}
                          {pushEnabled && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={handleTestNotification}
                              disabled={testSending}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-[#c8956c] border border-[#c8956c]/20 hover:bg-[#c8956c]/10 transition"
                            >
                              {testSending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              {testSending ? 'Sent!' : 'Send Test'}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Success banner */}
                  <AnimatePresence>
                    {showSuccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400 text-sm font-medium"
                      >
                        <CheckCheck className="w-4 h-4 flex-shrink-0" />
                        Push notifications enabled! You&apos;ll get alerts for weather, AQI, disasters, travel tips & more.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Not supported banner */}
                  {!pushSupported && (
                    <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-600 text-sm font-medium">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Push notifications aren&apos;t supported in this browser. Try Chrome, Firefox, Edge, or Safari 16+.
                    </div>
                  )}
                </div>

                {/* Notification types pills */}
                {pushEnabled && (
                  <div className="px-6 md:px-8 pb-5">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: '⛈️', label: 'Weather' },
                        { icon: '🌫️', label: 'Air Quality' },
                        { icon: '🚨', label: 'Disasters' },
                        { icon: '🌴', label: 'Travel Season' },
                        { icon: '🎯', label: 'Recommendations' },
                        { icon: '✨', label: 'New Matches' },
                        { icon: '💡', label: 'Tips' },
                      ].map((type) => (
                        <span
                          key={type.label}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/40 border border-white/5"
                        >
                          {type.icon} {type.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Unread Badge */}
            {unreadCount > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl flex items-center gap-3 border border-[#c8956c]/20"
                style={{ background: 'rgba(200, 149, 108, 0.05)' }}>
                <div className="p-2 rounded-xl" style={{ background: 'rgba(200, 149, 108, 0.15)' }}>
                  <Bell className="w-5 h-5 text-[#c8956c]" />
                </div>
                <span className="text-sm font-medium text-[#5a5550]">
                  You have <strong className="text-[#c8956c]">{unreadCount}</strong> unread notification{unreadCount > 1 ? 's' : ''}
                </span>
              </motion.div>
            )}

            {/* Filters */}
            <div className="flex gap-2 mb-8">
              {(['all', 'unread', 'read'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold capitalize transition-all ${
                    filter === f
                      ? 'text-white bg-[#c8956c] shadow-lg shadow-[#c8956c]/20'
                      : 'text-[#1b3a2d]/40 border border-[#e8e0d6] hover:text-[#1b3a2d] hover:border-[#c8956c]/30'
                  }`}>
                  {f}
                  {f === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#c8956c]" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-20 border border-[#e8e0d6] rounded-2xl" style={{ background: '#ffffff' }}>
                <BellOff className="w-16 h-16 mx-auto mb-4 text-[#e8e0d6]" />
                <h3 className="text-lg font-semibold mb-2 text-[#1b3a2d]">No notifications</h3>
                <p className="text-[#8a8a8a] text-sm">
                  {filter === 'all' ? "You're all caught up! No notifications yet." : `No ${filter} notifications.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification, i) => (
                  <motion.div key={notification.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border rounded-2xl transition-all hover:border-[#c8956c]/30 ${
                      !notification.read_at ? 'border-[#c8956c]/20' : 'border-[#e8e0d6] opacity-60'
                    }`}
                    style={{ background: !notification.read_at ? 'rgba(200, 149, 108, 0.03)' : '#ffffff' }}>
                    <div className="p-5 flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${!notification.read_at ? '' : 'opacity-50'}`}
                        style={{ background: !notification.read_at ? 'rgba(200, 149, 108, 0.1)' : 'rgba(200, 149, 108, 0.05)' }}>
                        {getIcon(notification)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[#1b3a2d]">{notification.data?.title || 'Notification'}</h3>
                            <p className="text-sm mt-1 text-[#8a8a8a] line-clamp-2">{notification.data?.message || ''}</p>
                            {notification.data?.destination_name && (
                              <p className="text-xs mt-1.5 flex items-center gap-1 text-[#c8956c]">
                                <MapPin className="w-3 h-3" /> {notification.data.destination_name}
                              </p>
                            )}
                          </div>
                          <span className="text-xs whitespace-nowrap flex-shrink-0 text-[#8a8a8a]">{getTimeAgo(notification.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          {!notification.read_at && (
                            <button onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="text-xs font-semibold flex items-center gap-1 text-[#c8956c] hover:text-[#dbb896] transition">
                              <CheckCheck className="w-3.5 h-3.5" /> Mark as read
                            </button>
                          )}
                          <button onClick={() => { if (confirm('Delete this notification?')) deleteMutation.mutate(notification.id); }}
                            disabled={deleteMutation.isPending}
                            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition ml-auto">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                      {!notification.read_at && (
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 bg-[#c8956c]" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
