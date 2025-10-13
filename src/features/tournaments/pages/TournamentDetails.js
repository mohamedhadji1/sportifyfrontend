import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import TournamentPodium from '../../../components/tournament/TournamentPodium';

const TournamentDetails = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tournament, setTournament] = useState(location.state?.tournament || null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(!tournament);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('podium');

  useEffect(() => {
    if (!tournament) {
      fetchTournament();
    }
    fetchTournamentStats();
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5006/api/tournaments/${tournamentId}/bracket`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setTournament(response.data.tournament);
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Erreur lors du chargement du tournoi');
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5006/api/tournaments/${tournamentId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching tournament stats:', err);
      // Don't show error for stats as it's not critical
    } finally {
      setStatsLoading(false);
    }
  };

  const PlayerStatsTable = ({ title, players, statKey, icon }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joueur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Équipe
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {statKey === 'goals' ? 'Buts' : statKey === 'assists' ? 'Passes' : 'MVP'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matchs
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  Aucune donnée disponible
                </td>
              </tr>
            ) : (
              players.map((player, index) => (
                <tr key={player.playerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <span className="text-xl mr-2">🥇</span>}
                      {index === 1 && <span className="text-xl mr-2">🥈</span>}
                      {index === 2 && <span className="text-xl mr-2">🥉</span>}
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{player.playerName}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{player.teamName}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">
                      {player[statKey]}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{player.matchesPlayed}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error || 'Tournoi non trouvé'}</p>
          <button
            onClick={() => navigate('/dashboard/tournament-list')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard/tournament-list')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la liste
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-gray-600 mt-1">
              {tournament.sport} • {tournament.teams?.length || 0} équipes
            </p>
          </div>
          
          {tournament.stage !== 'finished' && (
            <button
              onClick={() => navigate('/dashboard/tournament-management', { state: { tournament } })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Gérer le Tournoi
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('podium')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'podium'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏆 Podium
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Statistiques
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Équipes
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'podium' && tournament.stage === 'finished' && (
        <TournamentPodium
          tournament={tournament}
          champion={tournament.champion}
          podium={tournament.podium}
        />
      )}

      {activeTab === 'podium' && tournament.stage !== 'finished' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tournoi en cours</h3>
          <p className="text-gray-600">Le podium sera disponible une fois le tournoi terminé</p>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <PlayerStatsTable
                title="Meilleurs Buteurs"
                players={stats.topScorers || []}
                statKey="goals"
                icon="⚽"
              />
              <PlayerStatsTable
                title="Meilleurs Passeurs"
                players={stats.topAssists || []}
                statKey="assists"
                icon="🎯"
              />
              <PlayerStatsTable
                title="Joueurs MVP"
                players={stats.topMVPs || []}
                statKey="mvps"
                icon="🌟"
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pas de statistiques</h3>
              <p className="text-gray-600">Les statistiques apparaîtront une fois les premiers matchs joués</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournament.teams && tournament.teams.length > 0 ? (
            tournament.teams.map((team, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-4">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-full border-2 border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xl">⚽</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">{tournament.sport}</p>
                  </div>
                </div>
                
                {/* Team stats if available */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <span className="font-medium text-green-600">Inscrite</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joueurs:</span>
                    <span className="font-medium">{team.players?.length || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune équipe</h3>
              <p className="text-gray-600">Aucune équipe n'est encore inscrite à ce tournoi</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;