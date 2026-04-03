import api from './api';

export interface PackingCategory {
  label: string;
  icon: string;
  items: string[];
}

export interface PackingListResponse {
  destination: {
    id: number;
    name: string;
    primary_type: string;
    district: string;
  };
  packing_list: Record<string, PackingCategory>;
}

export const packingListService = {
  async generate(destinationId: number): Promise<PackingListResponse> {
    const response = await api.get(`/packing-list/${destinationId}`);
    return response.data.data;
  },
};
