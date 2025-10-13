import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TournamentPodium from '../../../components/tournament/TournamentPodium';

const TournamentListImproved = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showPodium, setShowPodium] = useState(false);
  const [tournamentStats, setTournamentStats] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5006/api/tournaments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setTournaments(response.data.tournaments || []);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentStats = async (tournamentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5006/api/tournaments/${tournamentId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
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

  const getStageDisplay = (stage) => {
    const stages = {
      'registration': { text: 'Inscription', color: 'bg-blue-100 text-blue-800' },
      'locked': { text: 'Verrouillé', color: 'bg-yellow-100 text-yellow-800' },
      'pools': { text: 'Phase de Poules', color: 'bg-orange-100 text-orange-800' },
      'knockout': { text: 'Phase Finale', color: 'bg-purple-100 text-purple-800' },
      'finished': { text: 'Terminé', color: 'bg-green-100 text-green-800' },
      'draw_pending': { text: 'Tirage en Attente', color: 'bg-gray-100 text-gray-800' }
    };
    return stages[stage] || { text: stage, color: 'bg-gray-100 text-gray-800' };
  };

  const handleViewDetailsBracket = (tournament) => {
    navigate(`/dashboard/tournament-details/${tournament._id}`, { 
      state: { tournament } 
    });
  };

  if (showPodium && selectedTournament) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <button
            onClick={handleCloseDetails}
            className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la Liste
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🏆 Liste des Tournois
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez et visualisez tous vos tournois
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/tournament-management')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Créer un Tournoi
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Chargement des tournois...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && tournaments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun tournoi trouvé</h3>
          <p className="text-gray-600 mb-6">Commencez par créer votre premier tournoi</p>
          <button
            onClick={() => navigate('/dashboard/tournament-management')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Créer un Tournoi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tournaments.map((tournament) => {
            const stageInfo = getStageDisplay(tournament.stage);
            
            return (
              <div key={tournament._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                        {tournament.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">⚽ {tournament.sport}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">
                          {tournament.teams?.length || 0} équipes
                        </span>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${stageInfo.color}`}>
                        {stageInfo.text}
                      </span>
                    </div>
                    
                    {tournament.stage === 'finished' && (
                      <div className="text-2xl">🏆</div>
                    )}
                  </div>
                </div>

                {/* Teams Section */}
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Équipes Participantes
                  </h4>
                  {tournament.teams && tournament.teams.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {tournament.teams.slice(0, 4).map((team, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          {team.logo ? (
                            <img
                              src={team.logo}
                              alt={team.name}
                              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
                              ⚽
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {team.name}
                          </span>
                        </div>
                      ))}
                      {tournament.teams.length > 4 && (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-500">
                            +{tournament.teams.length - 4} autres équipes
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-gray-400 text-sm">Aucune équipe inscrite</div>
                    </div>
                  )}
                </div>

                {/* Tournament Info */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Créé le:</span>
                      <div className="font-medium text-gray-900">
                        {new Date(tournament.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Prix Total:</span>
                      <div className="font-medium text-gray-900">
                        {tournament.prizePool?.total > 0 
                          ? `${tournament.prizePool.total} ${tournament.prizePool.currency}`
                          : 'Aucun prix'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Champion Section (only for finished tournaments) */}
                {tournament.stage === 'finished' && tournament.champion && (
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-amber-50">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">👑</div>
                      <div>
                        <div className="text-sm font-semibold text-amber-800">Champion</div>
                        <div className="font-bold text-amber-900">{tournament.champion.name}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-6">
                  <div className="flex gap-3">
                    {tournament.stage === 'finished' ? (
                      <button
                        onClick={() => handleViewDetails(tournament)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                        </svg>
                        Voir Podium
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewDetailsBracket(tournament)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Voir Détails
                      </button>
                    )}
                    
                    {tournament.stage !== 'finished' && (
                      <button
                        onClick={() => navigate('/dashboard/tournament-management', { state: { tournament } })}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Gérer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TournamentListImproved;