import React, { useState } from 'react';
import { useTournamentsListRQ, useCreateTournamentRQ, useScheduleTournamentRQ } from '../hooks/useTournamentsRQ';
import TournamentCreateForm from '../components/TournamentCreateForm';
import TournamentRoulette from '../../../components/tournament/TournamentRoulette';
import TournamentBracket from '../../../components/tournament/TournamentBracket';
import AddTeamsModal from '../components/AddTeamsModal';

function BracketViewer({ bracket }) {
  if (!bracket || !bracket.rounds) return <div className="text-gray-500 text-center py-8">Aucun arbre disponible</div>;
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {bracket.rounds.map((round, idx) => (
        <div key={idx} className="mb-6">
          <h4 className="text-base font-medium text-gray-900 mb-3">{round.name || `Round ${idx+1}`}</h4>
          <div className="space-y-3">
            {round.matches.map(m => (
              <div key={m._id || m.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200">
                <div className="text-gray-900 font-medium">{m.homeTeam} vs {m.awayTeam}</div>
                <div className="text-xs text-gray-500">{new Date(m.scheduledAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleModal({ open, onClose, tournament, onSchedule }) {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [daysBetween, setDaysBetween] = useState(1);
  const scheduleMut = useScheduleTournamentRQ();

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Planifier le Tournoi: {tournament.name}</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full bg-white text-gray-900 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heure de début</label>
            <input 
              type="time" 
              value={startTime} 
              onChange={e => setStartTime(e.target.value)} 
              className="w-full bg-white text-gray-900 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Jours entre les rounds</label>
            <input 
              type="number" 
              min={1} 
              value={daysBetween} 
              onChange={e => setDaysBetween(Number(e.target.value))} 
              className="w-full bg-white text-gray-900 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors" 
            onClick={onClose}
          >
            Annuler
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors" 
            onClick={async () => {
              try {
                await scheduleMut.mutateAsync({ 
                  id: tournament._id || tournament.id, 
                  body: { 
                    startDate, 
                    startTime, 
                    daysBetweenRounds: daysBetween, 
                    companyId: tournament.companyId || undefined 
                  } 
                });
                onSchedule();
                onClose();
              } catch (err) {
                alert('Échec de la planification: ' + (err.response?.data?.message || err.message));
              }
            }}
          >
            Planifier le Tournoi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TournamentManagerPage() {
  const { data: tournaments, isLoading } = useTournamentsListRQ();
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddTeams, setShowAddTeams] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [showBracket, setShowBracket] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'details'

  const onCreated = () => {
    setShowCreateForm(false); // Auto-collapse after creation
  };

  const onTeamsAdded = (updatedTournament) => {
    setSelectedTournament(updatedTournament);
    setShowAddTeams(false);
    // Refresh tournaments list
  };

  const onDrawCompleted = (updatedTournament) => {
    setSelectedTournament(updatedTournament);
    setShowRoulette(false);
    setShowBracket(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Create Tournament Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Créer un Nouveau Tournoi</h2>
                  <p className="text-sm text-gray-500">Configurez un nouveau tournoi avec des règles personnalisées</p>
                </div>
              </div>
              <div className={`transform transition-transform ${showCreateForm ? 'rotate-180' : 'rotate-0'}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {showCreateForm && (
              <div className="border-t border-gray-200">
                <div className="p-6 bg-gray-50">
                  <TournamentCreateForm onCreated={onCreated} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tournament Management Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => {setActiveTab('list'); setSelectedTournament(null);}}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'list' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mes Tournois ({tournaments?.length || 0})
              </button>
              {selectedTournament && (
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'details' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {selectedTournament.name} - Détails
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'list' && (
              <div>
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-600">Chargement des tournois...</span>
                  </div>
                )}

                {!isLoading && (!tournaments || tournaments.length === 0) && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun tournoi pour le moment</h3>
                    <p className="text-gray-500 mb-4">Créez votre premier tournoi pour commencer</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg transition-all"
                    >
                      Créer un Tournoi
                    </button>
                  </div>
                )}

                {!isLoading && tournaments && tournaments.length > 0 && (
                  <div className="grid gap-6">
                    {tournaments.map(tournament => (
                      <div 
                        key={tournament._id || tournament.id} 
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-semibold text-gray-900">{tournament.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                tournament.stage === 'registration' ? 'bg-yellow-100 text-yellow-800' :
                                tournament.stage === 'draw_pending' ? 'bg-blue-100 text-blue-800' :
                                tournament.stage === 'active' ? 'bg-green-100 text-green-800' :
                                tournament.stage === 'completed' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {tournament.stage === 'registration' ? 'Inscription' :
                                 tournament.stage === 'draw_pending' ? 'Tirage au sort' :
                                 tournament.stage === 'active' ? 'En cours' :
                                 tournament.stage === 'completed' ? 'Terminé' :
                                 tournament.stage || 'Configuration'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <span className="block text-xs text-gray-400 font-medium">Équipes</span>
                                <span className="text-gray-900 font-medium">{tournament.teams?.length || 0}/{tournament.maxTeams}</span>
                              </div>
                              <div>
                                <span className="block text-xs text-gray-400 font-medium">Sport</span>
                                <span className="text-gray-900 font-medium capitalize">{tournament.sport || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="block text-xs text-gray-400 font-medium">Prix</span>
                                <span className="text-gray-900 font-medium">
                                  {tournament.prizePool?.total > 0 
                                    ? `${tournament.prizePool.currency} ${tournament.prizePool.total}` 
                                    : 'Aucun prix'}
                                </span>
                              </div>
                              <div>
                                <span className="block text-xs text-gray-400 font-medium">Créé le</span>
                                <span className="text-gray-900 font-medium">
                                  {tournament.createdAt ? new Date(tournament.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            {/* Add Teams Button */}
                            {tournament.teams?.length < 8 && (
                              <button 
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors" 
                                onClick={() => { setSelectedTournament(tournament); setShowAddTeams(true); }}
                              >
                                Ajouter Équipes ({tournament.teams?.length || 0}/8)
                              </button>
                            )}
                            
                            {/* Draw Button */}
                            {tournament.teams?.length === 8 && !tournament.drawCompleted && (
                              <button 
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors" 
                                onClick={() => { setSelectedTournament(tournament); setShowRoulette(true); }}
                              >
                                🎯 Lancer le Tirage
                              </button>
                            )}
                            
                            {/* View Bracket Button */}
                            {tournament.drawCompleted && (
                              <button 
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors" 
                                onClick={() => { setSelectedTournament(tournament); setShowBracket(true); }}
                              >
                                🏆 Voir l'Arbre
                              </button>
                            )}
                            
                            <button 
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors" 
                              onClick={() => { setSelectedTournament(tournament); setShowSchedule(true); }}
                            >
                              Planifier
                            </button>
                            <button 
                              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors" 
                              onClick={() => { setSelectedTournament(tournament); setActiveTab('details'); }}
                            >
                              Détails
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && selectedTournament && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => {setActiveTab('list'); setSelectedTournament(null);}}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedTournament.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Informations du Tournoi</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Statut:</span> <span className="text-gray-900 font-medium">{selectedTournament.stage}</span></div>
                        <div><span className="text-gray-500">Pools:</span> <span className="text-gray-900 font-medium">{selectedTournament.pools?.length || 0}</span></div>
                        <div><span className="text-gray-500">Sport:</span> <span className="text-gray-900 font-medium capitalize">{selectedTournament.sport}</span></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Règles</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Format:</span> <span className="text-gray-900 font-medium">Tournoi à Élimination</span></div>
                        <div><span className="text-gray-500">Prolongations:</span> <span className="text-gray-900 font-medium">{selectedTournament.rules?.allowOvertime ? 'Autorisées' : 'Non autorisées'}</span></div>
                        {selectedTournament.rules?.allowOvertime && (
                          <div><span className="text-gray-500">Durée prolongation:</span> <span className="text-gray-900 font-medium">{selectedTournament.rules?.overtimeMinutes || 15} minutes</span></div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Prix</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Total:</span> <span className="text-gray-900 font-medium">{selectedTournament.prizePool?.currency} {selectedTournament.prizePool?.total || 0}</span></div>
                        <div><span className="text-gray-500">Positions:</span> <span className="text-gray-900 font-medium">{selectedTournament.prizePool?.breakdown?.length || 0} prix</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Arbre du Tournoi</h4>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <BracketViewer bracket={selectedTournament.bracket || { rounds: [] }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScheduleModal 
        open={showSchedule} 
        onClose={() => setShowSchedule(false)} 
        tournament={selectedTournament} 
        onSchedule={() => {}} 
      />

      {/* Add Teams Modal */}
      <AddTeamsModal 
        open={showAddTeams}
        onClose={() => setShowAddTeams(false)}
        tournament={selectedTournament}
        onTeamsAdded={onTeamsAdded}
      />

      {/* Tournament Roulette Modal */}
      {showRoulette && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Tournament Draw</h3>
              <button
                onClick={() => setShowRoulette(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <TournamentRoulette
              tournament={selectedTournament}
              onDrawCompleted={onDrawCompleted}
            />
          </div>
        </div>
      )}

      {/* Tournament Bracket Modal - Optimized */}
      {showBracket && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Arbre de Compétition</h3>
              <button
                onClick={() => setShowBracket(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <TournamentBracket tournament={selectedTournament} />
          </div>
        </div>
      )}
    </div>
  );
}
