import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_TOURNAMENT_SERVICE_URL || 'http://localhost:5006/api/tournaments';

async function fetchTournaments() {
  const res = await axios.get(API_BASE);
  const data = Array.isArray(res.data) ? res.data : (res.data.tournaments || res.data);
  return data || [];
}

export function useTournamentsListRQ() {
  return useQuery({ queryKey: ['tournaments'], queryFn: fetchTournaments, staleTime: 1000 * 60 * 1 });
}

export function useCreateTournamentRQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(API_BASE, payload, { headers: token ? { Authorization: token } : {} });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
    }
  });
}

export function useScheduleTournamentRQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/${id}/schedule`, body, { headers: token ? { Authorization: token } : {} });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
    }
  });
}
