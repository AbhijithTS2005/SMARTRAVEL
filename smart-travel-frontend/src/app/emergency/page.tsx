'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { emergencyService, type EmergencyContact } from '@/services/emergency';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Phone, Plus, Trash2, Edit3, Save, Loader2,
  Shield, Heart, Flame, MapPin, AlertTriangle, Baby, Car, PhoneCall, Star
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  'shield': Shield, 'heart-pulse': Heart, 'flame': Flame, 'map-pin': MapPin,
  'phone': PhoneCall, 'alert-triangle': AlertTriangle, 'baby': Baby, 'car': Car,
  'shield-alert': ShieldAlert, 'skull': AlertTriangle,
};

const CATEGORY_COLORS: Record<string, string> = {
  law: 'bg-blue-500/15 text-blue-500', medical: 'bg-red-500/15 text-red-500',
  fire: 'bg-orange-500/15 text-orange-500', tourism: 'bg-emerald-500/15 text-emerald-500',
  safety: 'bg-purple-500/15 text-purple-500', disaster: 'bg-amber-500/15 text-amber-500',
  accident: 'bg-rose-500/15 text-rose-500',
};

export default function EmergencyPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', relationship: '', is_primary: false });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: emergencyService.getContacts,
  });

  const { data: helplineData, isLoading: helplinesLoading } = useQuery({
    queryKey: ['helplines'],
    queryFn: emergencyService.getHelplines,
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<EmergencyContact, 'id'>) => emergencyService.addContact(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmergencyContact> }) => emergencyService.updateContact(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emergencyService.deleteContact(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', relationship: '', is_primary: false });
  };

  const handleEdit = (c: EmergencyContact) => {
    setEditingId(c.id);
    setFormData({ name: c.name, phone: c.phone, relationship: c.relationship || '', is_primary: c.is_primary });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      addMutation.mutate(formData as Omit<EmergencyContact, 'id'>);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
        <TopNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24" style={{ background: 'linear-gradient(180deg, #7f1d1d 0%, #991b1b 100%)' }}>
          <div className="max-w-[1300px] mx-auto">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-red-300 text-xs font-bold tracking-[0.35em] uppercase mb-4">
              <ShieldAlert className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
              SAFETY FIRST
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-4">
              Emergency SOS
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-white/40 text-lg max-w-xl">
              Manage emergency contacts and access helpline numbers for a safer journey.
            </motion.p>
          </div>
        </section>

        <section className="px-6 md:px-16 lg:px-24 pb-24">
          <div className="max-w-[1300px] mx-auto">

            {/* Emergency Contacts */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6 mt-8">
                <div>
                  <h2 className="text-xl font-semibold text-[#1b3a2d] font-display">Emergency Contacts</h2>
                  <p className="text-[#8a8a8a] text-sm mt-1">Up to 5 contacts. Primary contact is highlighted.</p>
                </div>
                {contacts.length < 5 && (
                  <button onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-full font-semibold text-sm hover:bg-red-600 transition shadow-lg shadow-red-500/20">
                    <Plus className="w-4 h-4" /> Add Contact
                  </button>
                )}
              </div>

              {/* Contact Form */}
              <AnimatePresence>
                {showForm && (
                  <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit}
                    className="mb-6 border border-[#e8e0d6] rounded-2xl p-6 overflow-hidden" style={{ background: '#ffffff' }}>
                    <h3 className="text-lg font-semibold text-[#1b3a2d] mb-4">
                      {editingId ? 'Edit Contact' : 'New Contact'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Name *</label>
                        <input type="text" required value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-white text-[#1b3a2d] focus:border-red-400 focus:outline-none transition"
                          placeholder="Contact name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Phone *</label>
                        <input type="tel" required value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-white text-[#1b3a2d] focus:border-red-400 focus:outline-none transition"
                          placeholder="+91 98765 43210" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Relationship</label>
                        <input type="text" value={formData.relationship}
                          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-white text-[#1b3a2d] focus:border-red-400 focus:outline-none transition"
                          placeholder="e.g. Parent, Spouse" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.is_primary}
                          onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                          className="w-4 h-4 rounded accent-red-500" />
                        <span className="text-sm font-medium text-[#1b3a2d]">Set as primary contact</span>
                      </label>
                      <div className="flex gap-2">
                        <button type="button" onClick={resetForm}
                          className="px-5 py-2.5 rounded-full text-sm font-medium text-[#8a8a8a] border border-[#e8e0d6] hover:bg-[#f5f0ea] transition">
                          Cancel
                        </button>
                        <button type="submit" disabled={addMutation.isPending || updateMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-full font-semibold text-sm hover:bg-red-600 transition disabled:opacity-50">
                          <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Contact List */}
              {contactsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-16 border border-[#e8e0d6] rounded-2xl" style={{ background: '#ffffff' }}>
                  <Phone className="w-14 h-14 mx-auto mb-4 text-[#e8e0d6]" />
                  <h3 className="text-lg font-semibold mb-2 text-[#1b3a2d]">No emergency contacts yet</h3>
                  <p className="text-[#8a8a8a] text-sm">Add contacts so they can be notified in an emergency.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact: EmergencyContact, i: number) => (
                    <motion.div key={contact.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-red-300/40 ${
                        contact.is_primary ? 'border-red-400/30 bg-red-50/50' : 'border-[#e8e0d6]'
                      }`}
                      style={!contact.is_primary ? { background: '#ffffff' } : {}}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        contact.is_primary ? 'bg-red-500 text-white' : 'bg-[#f5f0ea] text-[#1b3a2d]'
                      }`}>
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#1b3a2d]">{contact.name}</h3>
                          {contact.is_primary && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-full">
                              <Star className="w-3 h-3" /> Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#8a8a8a]">{contact.phone}</p>
                        {contact.relationship && <p className="text-xs text-[#c8956c]">{contact.relationship}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={`tel:${contact.phone}`}
                          className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition">
                          <Phone className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleEdit(contact)}
                          className="p-2.5 rounded-xl text-[#8a8a8a] hover:bg-[#f5f0ea] transition">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Delete this contact?')) deleteMutation.mutate(contact.id); }}
                          className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Helpline Directory */}
            <div>
              <h2 className="text-xl font-semibold text-[#1b3a2d] font-display mb-2">Helpline Directory</h2>
              <p className="text-[#8a8a8a] text-sm mb-6">
                {helplineData?.region ? `Emergency numbers for ${helplineData.region}` : 'Emergency numbers for Kerala, India'}
              </p>

              {helplinesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {helplineData?.helplines.map((h, i) => {
                    const IconComponent = ICON_MAP[h.icon] || Phone;
                    const colorClass = CATEGORY_COLORS[h.category] || 'bg-gray-100 text-gray-500';

                    return (
                      <motion.a key={h.number} href={`tel:${h.number}`}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="border border-[#e8e0d6] rounded-2xl p-5 hover:border-red-300/40 hover:shadow-lg transition-all group"
                        style={{ background: '#ffffff' }}>
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#1b3a2d] text-sm">{h.name}</h3>
                            <p className="text-2xl font-bold text-red-500 mt-1">{h.number}</p>
                          </div>
                        </div>
                        <div className="mt-3 px-4 py-2 bg-red-500 text-white text-center rounded-xl text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          TAP TO CALL
                        </div>
                      </motion.a>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
