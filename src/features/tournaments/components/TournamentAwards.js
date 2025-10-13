import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/ui/components/Card';
import { Button } from '../../../shared/ui/components/Button';

const TournamentAwards = ({ tournament, isVisible, onClose }) => {
  const [awards, setAwards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisible && tournament?._id) {
      fetchTournamentAwards();
    }
  }, [isVisible, tournament]);

  const fetchTournamentAwards = async () => {
    try {
      setLoading(true);
      const storedToken = localStorage.getItem('token');
      
      console.log('🏆 Fetching tournament awards for:', tournament._id);
      
      const response = await fetch(
        `http://localhost:5006/api/tournaments/${tournament._id}/statistics`,
        {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Tournament awards received:', data);
        setAwards(data);
      } else {
        console.error('❌ Failed to fetch tournament awards:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching tournament awards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card variant="glass" className="w-full max-w-6xl">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-b border-yellow-500/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  Tournament Awards
                </h2>
                <p className="text-slate-400 font-medium mt-1">
                  {tournament.name} - Final Statistics
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group w-12 h-12 bg-slate-700/50 hover:bg-red-500/20 border border-slate-600 hover:border-red-500/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <svg className="w-6 h-6 text-slate-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-slate-900 space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading tournament statistics...</p>
            </div>
          ) : awards ? (
            <>
              {/* Champion */}
              {tournament.champion && (
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-2xl"></div>
                  <div className="relative p-6 border-2 border-yellow-500/30 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-sm">
                            1st
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-yellow-500 uppercase tracking-wide mb-1">🏆 Champion</h3>
                          <div className="flex items-center gap-3">
                            {tournament.champion.logo && (
                              <img src={tournament.champion.logo} alt={tournament.champion.name} className="w-12 h-12 rounded-full ring-4 ring-yellow-500/30" />
                            )}
                            <p className="text-3xl font-bold text-slate-200">{tournament.champion.name}</p>
                          </div>
                        </div>
                      </div>
                      {tournament.champion.prize && (
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Prize</p>
                          <p className="text-2xl font-bold text-yellow-500">${tournament.champion.prize}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Podium */}
              {tournament.podium && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Runner-up */}
                  {tournament.podium.runnerUp && (
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-600/10 to-slate-500/10 rounded-2xl"></div>
                      <div className="relative p-6 border-2 border-slate-500/30 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center shadow-xl">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs">
                              2nd
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">🥈 Runner-up</h3>
                            <div className="flex items-center gap-2">
                              {tournament.podium.runnerUp.logo && (
                                <img src={tournament.podium.runnerUp.logo} alt={tournament.podium.runnerUp.name} className="w-8 h-8 rounded-full ring-2 ring-slate-500/30" />
                              )}
                              <p className="text-xl font-bold text-slate-200">{tournament.podium.runnerUp.name}</p>
                            </div>
                            {tournament.podium.runnerUp.prize && (
                              <p className="text-sm text-slate-500 mt-1">${tournament.podium.runnerUp.prize}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Third Place */}
                  {tournament.podium.thirdPlace && (
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-amber-600/10 rounded-2xl"></div>
                      <div className="relative p-6 border-2 border-orange-500/30 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-orange-900 font-bold text-xs">
                              3rd
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xs font-medium text-orange-400 uppercase tracking-wide mb-1">🥉 Third Place</h3>
                            <div className="flex items-center gap-2">
                              {tournament.podium.thirdPlace.logo && (
                                <img src={tournament.podium.thirdPlace.logo} alt={tournament.podium.thirdPlace.name} className="w-8 h-8 rounded-full ring-2 ring-orange-500/30" />
                              )}
                              <p className="text-xl font-bold text-slate-200">{tournament.podium.thirdPlace.name}</p>
                            </div>
                            {tournament.podium.thirdPlace.prize && (
                              <p className="text-sm text-orange-500 mt-1">${tournament.podium.thirdPlace.prize}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Player Awards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Scorer */}
                {awards.topScorer && (
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-green-400 uppercase tracking-wide">⚽ Top Scorer</h3>
                        <p className="text-2xl font-bold text-slate-200">{awards.topScorer.playerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-slate-400">{awards.topScorer.teamName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-green-400">{awards.topScorer.goals}</span>
                        <span className="text-slate-400">goals</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Assist Provider */}
                {awards.topAssist && (
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-400 uppercase tracking-wide">🎯 Top Assists</h3>
                        <p className="text-2xl font-bold text-slate-200">{awards.topAssist.playerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-slate-400">{awards.topAssist.teamName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-blue-400">{awards.topAssist.assists}</span>
                        <span className="text-slate-400">assists</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Best Player (Most MVPs) */}
                {awards.bestPlayer && (
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-purple-400 uppercase tracking-wide">🌟 Tournament MVP</h3>
                        <p className="text-2xl font-bold text-slate-200">{awards.bestPlayer.playerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-slate-400">{awards.bestPlayer.teamName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-purple-400">{awards.bestPlayer.mvpCount}</span>
                        <span className="text-slate-400">MVP awards</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tournament Statistics */}
                {awards.totalGoals !== undefined && (
                  <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-2xl p-6 border border-slate-600/30">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">📊 Tournament Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Goals</span>
                        <span className="text-xl font-bold text-slate-200">{awards.totalGoals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Matches</span>
                        <span className="text-xl font-bold text-slate-200">{awards.totalMatches || 7}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Goals/Match</span>
                        <span className="text-xl font-bold text-slate-200">
                          {((awards.totalGoals || 0) / (awards.totalMatches || 7)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-center pt-6">
                <Button
                  onClick={onClose}
                  variant="primary"
                  className="px-8 py-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">No statistics available yet.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TournamentAwards;
