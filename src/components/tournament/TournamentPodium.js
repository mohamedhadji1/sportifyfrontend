import React, { useState } from 'react';
import { Card } from '../../shared/ui/components/Card';
import { 
  Trophy, 
  Award, 
  Target, 
  Crown, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  Medal
} from 'lucide-react';

const TournamentPodium = ({ tournament, champion, podium, stats }) => {
  const [showStatsModal, setShowStatsModal] = useState(false);

  const formatPrize = (amount, currency) => {
    if (!amount || amount === 0) return 'No prize';
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getPrizes = () => {
    const prizeBreakdown = tournament.prizePool?.breakdown || [];
    const currency = tournament.prizePool?.currency || 'TND';

    if (prizeBreakdown.length === 0) {
      const totalPrize = tournament.prizePool?.total || 0;
      if (totalPrize > 0) {
        return {
          first: { amount: Math.round(totalPrize * 0.6), currency },
          second: { amount: Math.round(totalPrize * 0.3), currency },
          third: { amount: Math.round(totalPrize * 0.1), currency }
        };
      }
    }

    const firstPrize = prizeBreakdown.find(p => p.position === 1);
    const secondPrize = prizeBreakdown.find(p => p.position === 2);
    const thirdPrize = prizeBreakdown.find(p => p.position === 3);

    return {
      first: { amount: firstPrize?.amount || 0, currency },
      second: { amount: secondPrize?.amount || 0, currency },
      third: { amount: thirdPrize?.amount || 0, currency }
    };
  };

  const prizes = getPrizes();

  const getPodiumData = () => {
    if (podium && podium.first && podium.second && podium.third) {
      return {
        first: podium.first,
        second: podium.second,
        third: podium.third
      };
    }

    if (tournament.podium && tournament.podium.first && tournament.podium.second && tournament.podium.third) {
      return {
        first: tournament.podium.first,
        second: tournament.podium.second,
        third: tournament.podium.third
      };
    }

    if (champion && tournament.teams && tournament.teams.length >= 3) {
      const otherTeams = tournament.teams.filter(team => 
        team._id !== champion._id && team.name !== champion.name
      );
      
      return {
        first: champion,
        second: otherTeams[0] || { name: 'Team 2', _id: 'tbd2' },
        third: otherTeams[1] || { name: 'Team 3', _id: 'tbd3' }
      };
    }

    return {
      first: champion || { name: 'Team 1', _id: 'tbd1' },
      second: { name: 'Team 2', _id: 'tbd2' },
      third: { name: 'Team 3', _id: 'tbd3' }
    };
  };

  const finalPodium = getPodiumData();

  const PlayerStatsTable = ({ title, players, statKey, icon, emptyMessage }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      
      {players && players.length > 0 ? (
        <div className="space-y-3">
          {players.slice(0, 5).map((player, index) => (
            <Card 
              key={index} 
              className={`bg-gradient-to-r ${
                index === 0 ? 'from-yellow-900/40 to-yellow-800/40 border-yellow-500/30' : 
                index === 1 ? 'from-gray-800/40 to-gray-700/40 border-gray-500/30' : 
                index === 2 ? 'from-orange-900/40 to-orange-800/40 border-orange-500/30' : 
                'from-slate-800/40 to-slate-700/40 border-slate-600/30'
              } hover:scale-[1.02] transition-transform duration-200`}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                    'bg-gradient-to-br from-blue-500 to-blue-700'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  
                  {/* Player Info */}
                  <div>
                    <div className="font-bold text-lg text-white">{player.playerName}</div>
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      {player.teamName}
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="text-right">
                  <div className={`font-bold text-2xl ${
                    index === 0 ? 'text-yellow-400' : 
                    index === 1 ? 'text-gray-400' : 
                    index === 2 ? 'text-orange-400' : 
                    'text-blue-400'
                  }`}>
                    {player[statKey]}
                  </div>
                  <div className="text-sm text-slate-500">
                    {player.matchesPlayed} match{player.matchesPlayed > 1 ? 'es' : ''}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-800/50">
          <div className="text-center py-12 text-slate-500">
            <div className="text-6xl mb-4">{icon}</div>
            <p className="text-lg">{emptyMessage || 'No data available'}</p>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="text-8xl mb-4">🏆</div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Congratulations!
            </h1>
            <p className="text-2xl text-slate-300 mb-6">
              Tournament "{tournament.name}" is complete
            </p>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-full px-8 py-4 border border-yellow-500/30">
              <Crown className="w-8 h-8 text-yellow-400" />
              <span className="text-xl font-bold text-yellow-400">
                Champion: {finalPodium.first?.name || 'TBD'}
              </span>
            </div>
          </div>
        </div>

        {/* Podium Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-white mb-8 flex items-center justify-center gap-3">
            <Medal className="w-8 h-8 text-yellow-400" />
            Final Podium
            <Medal className="w-8 h-8 text-yellow-400" />
          </h2>
          
          <div className="flex justify-center items-end gap-8 mb-8">
            {/* Second Place */}
            <div className="text-center">
              <Card className="bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-lg p-6 min-h-[200px] w-64 flex flex-col justify-between shadow-lg border-gray-500">
                <div>
                  <div className="text-6xl mb-4">🥈</div>
                  <div className="bg-slate-800 rounded-lg p-4 mb-4">
                    {finalPodium.second?.logo ? (
                      <img
                        src={finalPodium.second.logo}
                        alt={finalPodium.second.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-gray-400"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gray-600 flex items-center justify-center text-gray-300 text-2xl">
                        ⚽
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-white">
                      {finalPodium.second?.name || 'TBD'}
                    </h3>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-sm text-slate-400 mb-1">Prize</div>
                  <div className="font-bold text-white flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    {formatPrize(prizes.second.amount, prizes.second.currency)}
                  </div>
                </div>
              </Card>
              <div className="bg-gray-600 h-20 rounded-b-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-gray-500 border-t-0">
                2nd Place
              </div>
            </div>

            {/* First Place */}
            <div className="text-center">
              <Card className="bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-lg p-6 min-h-[280px] w-72 flex flex-col justify-between shadow-xl border-4 border-yellow-300">
                <div>
                  <div className="text-8xl mb-4">🥇</div>
                  <div className="bg-white rounded-lg p-6 mb-4 shadow-md">
                    {finalPodium.first?.logo ? (
                      <img
                        src={finalPodium.first.logo}
                        alt={finalPodium.first.name}
                        className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-yellow-400"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center text-gray-400 text-3xl">
                        ⚽
                      </div>
                    )}
                    <h3 className="font-bold text-xl text-gray-900">
                      {finalPodium.first?.name || 'TBD'}
                    </h3>
                    <div className="text-sm text-yellow-600 font-medium mt-2 flex items-center justify-center gap-1">
                      <Trophy className="w-4 h-4" />
                      CHAMPION
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-sm text-gray-600 mb-1">Prize</div>
                  <div className="font-bold text-lg text-gray-900 flex items-center justify-center gap-1">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    {formatPrize(prizes.first.amount, prizes.first.currency)}
                  </div>
                </div>
              </Card>
              <div className="bg-yellow-500 h-24 rounded-b-lg flex items-center justify-center text-white font-bold text-3xl shadow-xl border-4 border-yellow-300 border-t-0">
                1st Place
              </div>
            </div>

            {/* Third Place */}
            <div className="text-center">
              <Card className="bg-gradient-to-b from-orange-400 to-orange-500 rounded-t-lg p-6 min-h-[160px] w-64 flex flex-col justify-between shadow-lg border-orange-400">
                <div>
                  <div className="text-6xl mb-4">🥉</div>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    {finalPodium.third?.logo ? (
                      <img
                        src={finalPodium.third.logo}
                        alt={finalPodium.third.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-orange-400"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gray-200 flex items-center justify-center text-gray-400 text-2xl">
                        ⚽
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-gray-900">
                      {finalPodium.third?.name || 'TBD'}
                    </h3>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Prize</div>
                  <div className="font-bold text-gray-900 flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    {formatPrize(prizes.third.amount, prizes.third.currency)}
                  </div>
                </div>
              </Card>
              <div className="bg-orange-500 h-16 rounded-b-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-orange-400 border-t-0">
                3rd Place
              </div>
            </div>
          </div>
        </div>

        {/* Player Statistics */}
        {stats && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-white mb-8 flex items-center justify-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              Player Statistics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PlayerStatsTable
                title="Top Scorers"
                players={stats.topScorers || []}
                statKey="goals"
                icon="⚽"
                emptyMessage="No goals scored"
              />
              <PlayerStatsTable
                title="Top Assists"
                players={stats.topAssists || []}
                statKey="assists"
                icon="🎯"
                emptyMessage="No assists"
              />
              <PlayerStatsTable
                title="MVP Players"
                players={stats.topMVPs || []}
                statKey="mvps"
                icon="⭐"
                emptyMessage="No MVPs awarded"
              />
            </div>
          </div>
        )}

        {/* Tournament Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Statistics</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div>{tournament.teams?.length || 0} participating teams</div>
                <div>Sport: {tournament.sport}</div>
                <div>Format: Knockout</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Total Prize Pool</h3>
              <div className="text-2xl font-bold text-green-400 mb-2">
                {tournament.prizePool?.total > 0 
                  ? `${tournament.prizePool.total} ${tournament.prizePool.currency}`
                  : 'No prize'
                }
              </div>
              <div className="text-sm text-slate-400">
                Distributed across 3 places
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <Calendar className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Tournament</h3>
              <div className="space-y-1 text-sm text-slate-300">
                <div className="font-medium">{tournament.name}</div>
                <div>Created: {new Date(tournament.createdAt).toLocaleDateString()}</div>
                <div className="text-green-400 font-medium">✅ Completed</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Thank You Section */}
        <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Thank You to All Participants!
            </h2>
            <p className="text-lg text-slate-300 mb-6">
              It was a fantastic tournament with exciting matches and exemplary sportsmanship.
              Congratulations to all teams for their performance!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['🎊', '🏆', '⚽', '🥇', '🎉', '👏', '🔥', '💪'].map((emoji, index) => (
                <span key={index} className="text-3xl animate-bounce" style={{ animationDelay: `${index * 0.1}s` }}>
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Share Results</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              📱 Share
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              📄 PDF Report
            </button>
            <button 
              onClick={() => setShowStatsModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowStatsModal(false)}>
          <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <TrendingUp className="w-8 h-8" />
                    Tournament Statistics
                  </h2>
                  <p className="text-purple-100 mt-1">{tournament?.name || 'Tournament'}</p>
                </div>
                <button 
                  onClick={() => setShowStatsModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Teams</p>
                      <p className="text-2xl font-bold text-white">{tournament?.teams?.length || 0}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Sport</p>
                      <p className="text-xl font-bold text-white capitalize">{tournament?.sport || 'Football'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Champion</p>
                      <p className="text-lg font-bold text-white">{champion?.name || 'N/A'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Total Prize</p>
                      <p className="text-xl font-bold text-white">{formatPrize(tournament?.prizePool?.total, tournament?.prizePool?.currency)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* AI Excellence Awards */}
              {stats && (stats.topScorers?.length > 0 || stats.topAssists?.length > 0 || stats.topMVPs?.length > 0) && (
                <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Award className="w-8 h-8 text-yellow-400" />
                    AI Excellence Awards
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Best Player */}
                    {stats.topMVPs && stats.topMVPs[0] && (
                      <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg">
                            🥇
                          </div>
                          <h4 className="font-bold text-yellow-400 text-sm mb-1">BEST PLAYER</h4>
                          <p className="font-bold text-lg text-white">{stats.topMVPs[0].playerName}</p>
                          <p className="text-sm text-slate-400 mt-1">{stats.topMVPs[0].mvps} MVP{stats.topMVPs[0].mvps > 1 ? 's' : ''}</p>
                        </div>
                      </Card>
                    )}

                    {/* Top Scorer */}
                    {stats.topScorers && stats.topScorers[0] && stats.topScorers[0].goals > 0 && (
                      <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-400">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg">
                            ⚽
                          </div>
                          <h4 className="font-bold text-red-400 text-sm mb-1">TOP SCORER</h4>
                          <p className="font-bold text-lg text-white">{stats.topScorers[0].playerName}</p>
                          <p className="text-sm text-slate-400 mt-1">{stats.topScorers[0].goals} goal{stats.topScorers[0].goals > 1 ? 's' : ''}</p>
                        </div>
                      </Card>
                    )}

                    {/* Top Assister */}
                    {stats.topAssists && stats.topAssists[0] && stats.topAssists[0].assists > 0 && (
                      <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-400">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg">
                            🎯
                          </div>
                          <h4 className="font-bold text-blue-400 text-sm mb-1">TOP ASSISTER</h4>
                          <p className="font-bold text-lg text-white">{stats.topAssists[0].playerName}</p>
                          <p className="text-sm text-slate-400 mt-1">{stats.topAssists[0].assists} assist{stats.topAssists[0].assists > 1 ? 's' : ''}</p>
                        </div>
                      </Card>
                    )}

                    {/* Best Keeper */}
                    {stats.topMVPs && stats.topMVPs.find(p => p.position === 'goalkeeper') && (
                      <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-400">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg">
                            🧤
                          </div>
                          <h4 className="font-bold text-green-400 text-sm mb-1">BEST KEEPER</h4>
                          <p className="font-bold text-lg text-white">
                            {stats.topMVPs.find(p => p.position === 'goalkeeper')?.playerName}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            {stats.topMVPs.find(p => p.position === 'goalkeeper')?.mvps} clean sheet{stats.topMVPs.find(p => p.position === 'goalkeeper')?.mvps > 1 ? 's' : ''}
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </Card>
              )}

              {/* Detailed Stats */}
              {stats && (
                <div className="space-y-6">
                  {stats.topScorers && stats.topScorers.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        ⚽ Top Scorers
                      </h3>
                      <PlayerStatsTable 
                        players={stats.topScorers} 
                        statKey="goals" 
                        icon="⚽"
                      />
                    </div>
                  )}

                  {stats.topAssists && stats.topAssists.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        🎯 Top Assists
                      </h3>
                      <PlayerStatsTable 
                        players={stats.topAssists} 
                        statKey="assists" 
                        icon="🎯"
                      />
                    </div>
                  )}

                  {stats.topMVPs && stats.topMVPs.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        🌟 MVP Players
                      </h3>
                      <PlayerStatsTable 
                        players={stats.topMVPs} 
                        statKey="mvps" 
                        icon="⭐"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setShowStatsModal(false)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TournamentPodium;
