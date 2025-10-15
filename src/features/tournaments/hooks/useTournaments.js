import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_TOURNAMENT_SERVICE_URL || 'https://service-tournament.onrender.com/api/tournaments';

export function useTournamentsList() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}`);
      // Expecting an array or object with data
      const data = Array.isArray(res.data) ? res.data : (res.data.tournaments || res.data);
      setTournaments(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch();
  }, []);

  return { tournaments, loading, error, refetch: fetch };
}

export function useCreateTournament() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function create(payload) {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}`, payload, {
        headers: token ? { Authorization: token } : {}
      });
      return res.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error };
}

export function useScheduleTournament() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function schedule(id, body) {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/${id}/schedule`, body, {
        headers: token ? { Authorization: token } : {}
      });
      return res.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { schedule, loading, error };
}
