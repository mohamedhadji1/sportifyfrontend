import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useTeam = () => {
  const [hasTeam, setHasTeam] = useState(false);
  const [team, setTeam] = useState(null);

  const fetchTeam = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const API = process.env.REACT_APP_API_URL || process.env.REACT_APP_AUTH_SERVICE_URL || 'https://sportifyauth.onrender.com/api'
        const res = await axios.get(`${API}/teams/my-team`, {
          headers: { 'x-auth-token': token },
        });
        setTeam(res.data);
        setHasTeam(true);
      } catch (err) {
        setTeam(null);
        setHasTeam(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return { hasTeam, team, fetchTeam, setTeam, setHasTeam };
};
