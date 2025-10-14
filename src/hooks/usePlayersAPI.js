import { useState, useCallback } from 'react';
import axios from 'axios';

export const usePlayersAPI = () => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Récupérer tous les joueurs avec pagination
  const loadPlayers = useCallback(async (options = {}) => {
    const { limit = 20, skip = 0, search = '', teamId = null } = options;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { limit, skip };
      
      if (search) params.search = search;
      if (teamId) params.teamId = teamId;
      
      const response = await axios.get('https://sportify-teams.onrender.com/api/players', {
        headers: { 'x-auth-token': token },
        params
      });
      
      if (response.data.success) {
        setPlayers(response.data.players || []);
        return response.data;
      } else {
        console.error('Error in API response:', response.data.error);
        setPlayers([]);
        return { players: [], total: 0, hasMore: false };
      }
    } catch (error) {
      console.error('Error loading players:', error);
      setPlayers([]);
      return { players: [], total: 0, hasMore: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Rechercher des joueurs
  const searchPlayers = useCallback(async (query, teamId = null) => {
    if (!query || query.length < 2) {
      return loadPlayers({ teamId });
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { q: query, limit: 20 };
      
      if (teamId) params.teamId = teamId;
      
      const response = await axios.get('https://sportify-teams.onrender.com/api/players/search', {
        headers: { 'x-auth-token': token },
        params
      });
      
      if (response.data.success) {
        setPlayers(response.data.players || []);
        return response.data.players || [];
      } else {
        console.error('Error in search response:', response.data.error);
        setPlayers([]);
        return [];
      }
    } catch (error) {
      console.error('Error searching players:', error);
      setPlayers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [loadPlayers]);

  // Récupérer les joueurs d'une équipe
  const getTeamPlayers = useCallback(async (teamId) => {
    if (!teamId) return [];
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://sportify-teams.onrender.com/api/players/team/${teamId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.success) {
        const teamPlayers = response.data.players || [];
        setPlayers(teamPlayers);
        return teamPlayers;
      } else {
        console.error('Error getting team players:', response.data.error);
        setPlayers([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching team players:', error);
      setPlayers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Récupérer les joueurs de deux équipes pour un match
  const getMatchTeamsPlayers = useCallback(async (team1Id, team2Id) => {
    if (!team1Id || !team2Id) return null;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://sportify-teams.onrender.com/api/players/match-teams', {
        team1Id,
        team2Id
      }, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        console.error('Error getting match teams players:', response.data.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching match teams players:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Gérer les changements de recherche avec debounce
  const handleSearchChange = useCallback((e, teamId = null) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Débounce la recherche
    if (window.playersSearchTimeout) {
      clearTimeout(window.playersSearchTimeout);
    }
    
    window.playersSearchTimeout = setTimeout(() => {
      searchPlayers(query, teamId);
    }, 300);
  }, [searchPlayers]);

  // Obtenir un joueur par ID
  const getPlayerById = useCallback(async (playerId) => {
    if (!playerId) return null;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://sportify-teams.onrender.com/api/players/${playerId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.success) {
        return response.data.player;
      } else {
        console.error('Error getting player:', response.data.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching player:', error);
      return null;
    }
  }, []);

  return {
    players,
    isLoading,
    searchQuery,
    setSearchQuery,
    loadPlayers,
    searchPlayers,
    getTeamPlayers,
    getMatchTeamsPlayers,
    getPlayerById,
    handleSearchChange
  };
};

export default usePlayersAPI;