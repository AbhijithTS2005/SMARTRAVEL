import api from './api';

export interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string | null;
  is_primary: boolean;
}

export interface Helpline {
  name: string;
  number: string;
  icon: string;
  category: string;
}

export interface SOSResponse {
  status: string;
  message: string;
  timestamp: string;
  location: { latitude: number | null; longitude: number | null };
  helplines: Helpline[];
  emergency_contacts: EmergencyContact[];
}

export const emergencyService = {
  getContacts: async (): Promise<EmergencyContact[]> => {
    const res = await api.get('/emergency/contacts');
    return res.data;
  },

  addContact: async (data: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> => {
    const res = await api.post('/emergency/contacts', data);
    return res.data;
  },

  updateContact: async (id: number, data: Partial<EmergencyContact>): Promise<EmergencyContact> => {
    const res = await api.put(`/emergency/contacts/${id}`, data);
    return res.data;
  },

  deleteContact: async (id: number): Promise<void> => {
    await api.delete(`/emergency/contacts/${id}`);
  },

  triggerSOS: async (latitude?: number, longitude?: number): Promise<SOSResponse> => {
    const res = await api.post('/emergency/sos', { latitude, longitude });
    return res.data;
  },

  getHelplines: async (): Promise<{ helplines: Helpline[]; region: string }> => {
    const res = await api.get('/emergency/helplines');
    return res.data;
  },
};
