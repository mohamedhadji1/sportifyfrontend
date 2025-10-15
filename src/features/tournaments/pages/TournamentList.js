import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from '../../../shared/ui/components/Card';
import { ToastContainer, useToast } from '../../../shared/ui/components/Toast';
import Pagination from '../../../shared/ui/components/Pagination';
import SearchBar from '../../../shared/ui/components/SearchBar';
import TournamentPodium from '../../../components/tournament/TournamentPodium';
import { 
  Calendar, 
  Trophy, 
  Users, 
  CheckCircle, 
  XCircle, 
  Award, 
  Target, 
  Crown, 
  DollarSign 
} from 'lucide-react';

const TournamentList = () => {
  console.log('🏆 TournamentList component loaded');
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showPodium, setShowPodium] = useState(false);
  const [tournamentStats, setTournamentStats] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  
  // Search and filter states
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sportFilter, setSportFilter] = useState('all');
  
  const { toasts, error: showError, removeToast } = useToast();

  // Search configuration
  const searchFilters = [
    {
      key: 'stage',
      label: 'Stage',
      options: [
        { value: 'registration', label: 'Registration' },
        { value: 'locked', label: 'Locked' },
        { value: 'knockout', label: 'Knockout' },
        { value: 'finished', label: 'Finished' },
        { value: 'draw_pending', label: 'Draw Pending' }
      ]
    },
    {
      key: 'sport',
      label: 'Sport',
      options: [
        { value: 'Football', label: 'Football' },
        { value: 'Basketball', label: 'Basketball' },
        { value: 'Tennis', label: 'Tennis' }
      ]
    }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'name', label: 'Tournament Name' },
    { value: 'teams.length', label: 'Number of Teams' }
  ];
  console.log('sortOptions:', sortOptions); // Prevent unused warning

  const handleSearch = (searchParams) => {
    try {
      const query = searchParams?.query || '';
      const stage = searchParams?.stage || 'all';
      const sport = searchParams?.sport || 'all';
      
      setSearchQuery(query);
      setStageFilter(stage);
      setSportFilter(sport);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error handling search:', error);
      setSearchQuery('');
      setStageFilter('all');
      setSportFilter('all');
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    console.log('🏆 useEffect triggered, calling fetchTournaments');
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters whenever tournaments or filter states change
  const applyFilters = useCallback(() => {
    if (!Array.isArray(tournaments)) {
      setFilteredTournaments([]);
      return;
    }
    
    let filtered = [...tournaments];
    
    // Apply search query filter
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(tournament => {
        const searchTermLower = searchQuery.toLowerCase();
        return (
          tournament.name?.toLowerCase().includes(searchTermLower) ||
          tournament.sport?.toLowerCase().includes(searchTermLower) ||
          tournament.champion?.name?.toLowerCase().includes(searchTermLower)
        );
      });
    }
    
    // Apply stage filter
    if (stageFilter && stageFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.stage === stageFilter);
    }
    
    // Apply sport filter
    if (sportFilter && sportFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.sport === sportFilter);
    }
    
    setFilteredTournaments(filtered);
  }, [tournaments, searchQuery, stageFilter, sportFilter]);

  // Effect to apply filters when dependencies change
  useEffect(() => {
    try {
      applyFilters();
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredTournaments([]);
    }
  }, [tournaments, searchQuery, stageFilter, sportFilter, applyFilters]);

  // Pagination handlers
  const handlePageChange = (page) => {
    try {
      if (typeof page === 'number' && page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error changing page:', error);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    try {
      if (typeof newItemsPerPage === 'number' && newItemsPerPage > 0) {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error changing items per page:', error);
    }
  };

  // Get current page data from filtered results
  const totalPages = Math.ceil((filteredTournaments?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTournaments = Array.isArray(filteredTournaments) ? filteredTournaments.slice(startIndex, endIndex) : [];

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      console.log('Fetching tournaments...');
      
      const response = await axios.get('https://service-tournament.onrender.com/api/tournaments');
      
      console.log('API Response:', response.data);
      
      if (Array.isArray(response.data)) {
        setTournaments(response.data);
        setFilteredTournaments(response.data);
        console.log('Set tournaments count:', response.data.length);
      } else {
        console.log('Response is not an array');
        setTournaments([]);
        setFilteredTournaments([]);
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError(`Error loading tournaments: ${err.message}`);
      showError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const getStageColor = (stage) => {
    const stages = {
      'registration': 'bg-blue-500/80',
      'locked': 'bg-yellow-500/80',
      'knockout': 'bg-purple-500/80',
      'finished': 'bg-green-500/80',
      'draw_pending': 'bg-gray-500/80'
    };
    return stages[stage] || 'bg-gray-500/80';
  };

  const getStageText = (stage) => {
    const stages = {
      'registration': 'Registration',
      'locked': 'Locked',
      'knockout': 'Knockout',
      'finished': 'Finished',
      'draw_pending': 'Draw Pending'
    };
    return stages[stage] || stage;
  };

  const fetchTournamentStats = async (tournamentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://service-tournament.onrender.com/api/tournaments/${tournamentId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const stats = response.data;
      
      // Fetch team names for all players
      if (stats) {
        const teamIds = new Set();
        
        // Collect all unique team IDs
        ['topScorers', 'topAssists', 'topMVPs'].forEach(key => {
          if (stats[key]) {
            stats[key].forEach(player => {
              if (player.teamId) teamIds.add(player.teamId);
            });
          }
        });
        
        // Fetch team names from teams service
        if (teamIds.size > 0) {
          const teamNamesMap = {};
          await Promise.all(
            Array.from(teamIds).map(async (teamId) => {
              try {
                const teamResponse = await axios.get(`https://sportify-teams.onrender.com/api/teams/${teamId}`, {
                  headers: { 'x-auth-token': token }
                });
                if (teamResponse.data) {
                  teamNamesMap[teamId] = teamResponse.data.name;
                }
              } catch (err) {
                console.error(`Error fetching team ${teamId}:`, err);
              }
            })
          );
          
          // Update player objects with actual team names
          ['topScorers', 'topAssists', 'topMVPs'].forEach(key => {
            if (stats[key]) {
              stats[key] = stats[key].map(player => ({
                ...player,
                teamName: player.teamId && teamNamesMap[player.teamId] 
                  ? teamNamesMap[player.teamId] 
                  : player.teamName || 'Unknown Team'
              }));
            }
          });
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
      return null;
    }
  };

  const handleViewDetails = async (tournament) => {
    setSelectedTournament(tournament);
    
    // Fetch tournament statistics for the podium
    if (tournament.stage === 'finished') {
      const stats = await fetchTournamentStats(tournament._id);
      setTournamentStats(stats);
    }
    
    setShowPodium(true);
  };

  const handleCloseDetails = () => {
    setShowPodium(false);
    setSelectedTournament(null);
    setTournamentStats(null);
  };

  if (showPodium && selectedTournament) {
    return (
      <div className="min-h-screen bg-[#0F172A]">
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <button
            onClick={handleCloseDetails}
            className="mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </button>
        </div>
        
        <TournamentPodium 
          tournament={selectedTournament}
          champion={selectedTournament.champion}
          podium={selectedTournament.podium}
          stats={tournamentStats}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-400">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tournaments</h2>
              <p className="text-slate-400 text-sm">View and manage all tournaments</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/tournament-management')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Tournament
          </button>
        </div>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search tournaments..."
          filters={searchFilters}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Tournament Cards Grid */}
      {filteredTournaments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="mb-4">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Tournaments Found</h3>
            <p className="text-slate-500 mb-6">Create your first tournament to get started</p>
            <button
              onClick={() => navigate('/dashboard/tournament-management')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create First Tournament
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentTournaments.map((tournament) => (
              <Card 
                key={tournament._id} 
                className="hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                onClick={() => handleViewDetails(tournament)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg line-clamp-1">
                        {tournament.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Target className="w-3 h-3 text-blue-400" />
                        <span className="text-sm text-slate-400">{tournament.sport}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${getStageColor(tournament.stage)}`}>
                    <CheckCircle size={14} className="mr-1.5" />
                    {getStageText(tournament.stage)}
                  </span>
                </div>

                {/* Champion Badge (if finished) */}
                {tournament.stage === 'finished' && tournament.champion && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-400" />
                      <div>
                        <div className="text-xs text-yellow-400 font-semibold">Champion</div>
                        <div className="text-sm text-white font-bold">{tournament.champion.name}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tournament Stats */}
                <div className="space-y-3 mb-4">
                  {/* Teams Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>Teams</span>
                      </div>
                      <span className="text-white font-semibold">
                        {tournament.teams?.length || 0}/{tournament.maxTeams}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((tournament.teams?.length || 0) / tournament.maxTeams) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Prize Pool */}
                  {tournament.prizePool?.total > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Prize Pool</span>
                      </div>
                      <span className="text-green-400 font-semibold">
                        {tournament.prizePool.total} {tournament.prizePool.currency}
                      </span>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>Created</span>
                    </div>
                    <span className="text-slate-300">
                      {formatDate(tournament.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(tournament);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Award size={16} />
                  View Details
                </button>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalItems={filteredTournaments.length}
            />
          )}
        </>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TournamentList;