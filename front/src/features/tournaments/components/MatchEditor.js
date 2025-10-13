import React, { useState, useEffect } from 'react';
import { Button } from '../../../shared/ui/components/Button';

const MatchEditor = ({ 
  tournament, 
  match, 
  onClose, 
  onMatchUpdated,
  matchId 
}) => {
  const [formData, setFormData] = useState({
    team1Score: 0,
    team2Score: 0,
    winnerId: '',
    mvp: {
      playerId: '',
      playerName: '',
      teamId: ''
    },
    goals: [],
    assists: [],
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (match) {
      setFormData({
        team1Score: match.team1?.score || 0,
        team2Score: match.team2?.score || 0,
        winnerId: match.winner?.teamId || '',
        mvp: match.mvp || { playerId: '', playerName: '', teamId: '' },
        goals: match.goals || [],
        assists: match.assists || [],
        notes: match.notes || ''
      });
    }
    
    // Fetch team players for dropdowns
    fetchTeamPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  const fetchTeamPlayers = async () => {
    try {
      console.log('🔍 Fetching players for match teams...');
      console.log('Match:', match);
      
      // Get only the two teams playing in this match
      const matchTeams = [
        { teamId: match.team1?.teamId, name: match.team1?.name, logo: match.team1?.logo },
        { teamId: match.team2?.teamId, name: match.team2?.name, logo: match.team2?.logo }
      ].filter(t => t.teamId); // Filter out any undefined teams
      
      console.log('🔍 Match object:', match);
      console.log('🔍 Match teams to fetch:', matchTeams);
      
      const storedToken = localStorage.getItem('token');
      const teamsWithPlayers = await Promise.all(
        matchTeams.map(async (team) => {
          try {
            console.log(`📡 Fetching players for team: ${team.name}`);
            console.log(`📡 Team ID: ${team.teamId}`);
            
            // Fetch the team document which contains members array
            const url = `http://localhost:5004/api/teams/${team.teamId}`;
            console.log(`� URL: ${url}`);
            
            const response = await fetch(url, {
              headers: {
                'x-auth-token': storedToken,
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`📡 Response status for ${team.name}:`, response.status);
            
            if (response.ok) {
              const teamData = await response.json();
              console.log(`✅ Team data for ${team.name}:`, teamData);
              
              // Extract members array from team data
              const members = teamData.members || [];
              console.log(`✅ Got ${members.length} members for ${team.name}:`, members);
              
              // Collect all user IDs from members
              const userIds = members.map(member => member.userId?.$oid || member.userId).filter(Boolean);
              console.log(`📡 Fetching bulk user data for ${userIds.length} users`);
              
              // Fetch all user details in one request using bulk endpoint
              let usersMap = {};
              if (userIds.length > 0) {
                try {
                  const bulkResponse = await fetch('http://localhost:5000/api/auth/users/bulk', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userIds })
                  });
                  
                  if (bulkResponse.ok) {
                    const bulkData = await bulkResponse.json();
                    console.log(`✅ Bulk user data received:`, bulkData);
                    
                    // Create a map of userId -> user data
                    if (bulkData.users) {
                      usersMap = bulkData.users.reduce((map, user) => {
                        map[user._id.toString()] = user;
                        return map;
                      }, {});
                    }
                  } else {
                    console.error(`❌ Failed to fetch bulk user data:`, bulkResponse.status);
                  }
                } catch (error) {
                  console.error(`❌ Error fetching bulk user data:`, error);
                }
              }
              
              // Map members to players with real names from bulk fetch
              const playersWithNames = members.map((member, index) => {
                const playerId = member.userId?.$oid || member.userId || `member-${index}`;
                const userData = usersMap[playerId];
                
                return {
                  _id: playerId,
                  userId: playerId,
                  name: userData?.fullName || userData?.name || `Player ${index + 1} - ${member.position || 'Unknown'}`,
                  position: member.position,
                  jerseyNumber: member.jerseyNumber,
                  isStarter: member.isStarter,
                  status: member.status || 'active'
                };
              });
              
              console.log(`✅ Mapped ${playersWithNames.length} players with names for ${team.name}:`, playersWithNames);
              
              return {
                teamId: team.teamId,
                name: team.name,
                logo: team.logo,
                players: playersWithNames
              };
            } else {
              const errorText = await response.text();
              console.error(`❌ Failed to fetch team ${team.name} players:`, response.status, errorText);
            }
            return { ...team, players: [] };
          } catch (error) {
            console.error(`❌ Error fetching team ${team.name} players:`, error);
            return { ...team, players: [] };
          }
        })
      );
      
      console.log('✅ All teams with players:', teamsWithPlayers);
      setTeams(teamsWithPlayers);
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
    }
  };

  const handleScoreChange = (team, value) => {
    const score = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [`${team}Score`]: score
    }));
    
    // Auto-determine winner based on score
    if (team === 'team1') {
      if (score > formData.team2Score) {
        setFormData(prev => ({ ...prev, winnerId: match?.team1?.teamId || '' }));
      } else if (score < formData.team2Score) {
        setFormData(prev => ({ ...prev, winnerId: match?.team2?.teamId || '' }));
      }
    } else {
      if (score > formData.team1Score) {
        setFormData(prev => ({ ...prev, winnerId: match?.team2?.teamId || '' }));
      } else if (score < formData.team1Score) {
        setFormData(prev => ({ ...prev, winnerId: match?.team1?.teamId || '' }));
      }
    }
  };

  const addScorer = () => {
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, {
        scorerId: '',
        scorerName: '',
        assistedById: '',
        assistedByName: '',
        teamId: '',
        minute: 90
      }]
    }));
  };

  const updateScorer = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) => 
        i === index ? { ...goal, [field]: value } : goal
      )
    }));
  };

  const removeScorer = (index) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const addAssist = () => {
    setFormData(prev => ({
      ...prev,
      assists: [...prev.assists, {
        playerId: '',
        playerName: '',
        teamId: '',
        minute: 90
      }]
    }));
  };

  const updateAssist = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      assists: prev.assists.map((assist, i) => 
        i === index ? { ...assist, [field]: value } : assist
      )
    }));
  };

  const removeAssist = (index) => {
    setFormData(prev => ({
      ...prev,
      assists: prev.assists.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const storedToken = localStorage.getItem('token');
      
      // Prepare scorers data (backend expects 'scorers' not 'goals', and 'playerId' not 'scorerId')
      const scorersData = formData.goals.map(goal => ({
        playerId: goal.scorerId,  // Map scorerId to playerId
        playerName: goal.scorerName,
        teamId: goal.teamId,
        assistedById: goal.assistedById && goal.assistedById.trim() !== '' ? goal.assistedById : null,  // ✅ Convert empty string to null
        assistedByName: goal.assistedByName && goal.assistedByName.trim() !== '' ? goal.assistedByName : null,  // ✅ Convert empty string to null
        goals: 1,  // Each goal record is 1 goal
        minute: goal.minute || 90
      }));

      // Prepare assists data
      const assistsData = formData.assists.map(assist => ({
        playerId: assist.playerId,
        playerName: assist.playerName,
        teamId: assist.teamId,
        assists: assist.assists || 1
      }));

      console.log('🎯 Match Data Being Sent:');
      console.log('  📊 Scorers:', JSON.stringify(scorersData, null, 2));
      console.log('  🎯 Assists:', JSON.stringify(assistsData, null, 2));
      console.log('  🌟 MVP:', formData.mvp);
      
      // Send ALL data in ONE request to save to PlayerStats
      const response = await fetch(
        `http://localhost:5006/api/tournaments/${tournament._id}/matches/${matchId}/result`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            team1Score: formData.team1Score,
            team2Score: formData.team2Score,
            winnerId: formData.winnerId,
            mvp: formData.mvp,
            scorers: scorersData,  // ✅ Changed from 'goals' to 'scorers'
            assists: assistsData,  // ✅ NOW SENDING ASSISTS
            notes: formData.notes
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.requireThirdPlace) {
          alert('⚠️ ATTENTION: The 3rd place match must be completed before entering the final score!');
        } else {
          alert('Error: ' + (error.message || 'Unable to update match'));
        }
        return;
      }

      // Get the result and notify
      const result = await response.json();
      console.log('✅ Match updated successfully:', result);
      onMatchUpdated(result);
      onClose();
      
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const getAllPlayers = () => {
    return teams.reduce((acc, team) => {
      const teamPlayers = (team.players || []).map(player => ({
        ...player,
        teamId: team.teamId,
        teamName: team.name
      }));
      return [...acc, ...teamPlayers];
    }, []);
  };

  if (!match) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50">
        {/* Modern Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-xl">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Match Editor
                  </h3>
                  <p className="text-slate-400 font-medium flex items-center gap-2 mt-1">
                    <span className="text-cyan-400">{match.team1?.name || 'Team 1'}</span>
                    <span className="text-slate-500">vs</span>
                    <span className="text-indigo-400">{match.team2?.name || 'Team 2'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="group w-12 h-12 bg-slate-800/80 hover:bg-red-500/20 border-2 border-slate-700 hover:border-red-500/50 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <svg className="w-6 h-6 text-slate-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Score Section with dark theme */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-200">Match Score</h4>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team 1 */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl transition-all duration-300 group-hover:from-blue-500/20 group-hover:to-indigo-500/20 border border-blue-500/20"></div>
                  <div className="relative p-6 text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {match.team1?.logo && (
                        <div className="relative">
                          <img src={match.team1.logo} alt={match.team1.name} className="w-12 h-12 rounded-full ring-4 ring-blue-500/30 shadow-lg" />
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full"></div>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-lg text-slate-200">{match.team1?.name}</span>
                        <p className="text-sm text-slate-400">Home Team</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formData.team1Score}
                        onChange={(e) => handleScoreChange('team1', e.target.value)}
                        className="w-full text-center text-4xl font-bold border-2 border-blue-500/30 hover:border-blue-400/50 focus:border-blue-500 rounded-2xl p-4 text-slate-200 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 focus:ring-4 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl transition-all duration-300 group-hover:from-purple-500/20 group-hover:to-pink-500/20 border border-purple-500/20"></div>
                  <div className="relative p-6 text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {match.team2?.logo && (
                        <div className="relative">
                          <img src={match.team2.logo} alt={match.team2.name} className="w-12 h-12 rounded-full ring-4 ring-purple-500/30 shadow-lg" />
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full"></div>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-lg text-slate-200">{match.team2?.name}</span>
                        <p className="text-sm text-slate-400">Away Team</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formData.team2Score}
                        onChange={(e) => handleScoreChange('team2', e.target.value)}
                        className="w-full text-center text-4xl font-bold border-2 border-purple-500/30 hover:border-purple-400/50 focus:border-purple-500 rounded-2xl p-4 text-slate-200 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 focus:ring-4 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center shadow-xl border-4 border-blue-500/30">
                  <span className="text-lg font-bold text-blue-400">VS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Winner Section */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-200">Winner Team</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="group relative flex items-center space-x-3 cursor-pointer p-4 bg-slate-800/50 rounded-xl border-2 border-transparent hover:border-yellow-500/50 transition-all duration-300 hover:shadow-md">
                <input
                  type="radio"
                  name="winner"
                  value={match.team1?.teamId}
                  checked={formData.winnerId === match.team1?.teamId}
                  onChange={(e) => setFormData(prev => ({ ...prev, winnerId: e.target.value }))}
                  className="w-5 h-5 text-yellow-600 bg-slate-700 border-2 border-slate-600 focus:ring-yellow-500 focus:ring-2"
                />
                <div className="flex items-center gap-3">
                  {match.team1?.logo && (
                    <img src={match.team1.logo} alt={match.team1.name} className="w-8 h-8 rounded-full ring-2 ring-blue-500/30" />
                  )}
                  <span className="font-semibold text-slate-200 group-hover:text-yellow-400 transition-colors">{match.team1?.name}</span>
                </div>
              </label>
              <label className="group relative flex items-center space-x-3 cursor-pointer p-4 bg-slate-800/50 rounded-xl border-2 border-transparent hover:border-yellow-500/50 transition-all duration-300 hover:shadow-md">
                <input
                  type="radio"
                  name="winner"
                  value={match.team2?.teamId}
                  checked={formData.winnerId === match.team2?.teamId}
                  onChange={(e) => setFormData(prev => ({ ...prev, winnerId: e.target.value }))}
                  className="w-5 h-5 text-yellow-600 bg-slate-700 border-2 border-slate-600 focus:ring-yellow-500 focus:ring-2"
                />
                <div className="flex items-center gap-3">
                  {match.team2?.logo && (
                    <img src={match.team2.logo} alt={match.team2.name} className="w-8 h-8 rounded-full ring-2 ring-purple-500/30" />
                  )}
                  <span className="font-semibold text-slate-200 group-hover:text-yellow-400 transition-colors">{match.team2?.name}</span>
                </div>
              </label>
            </div>
          </div>

          {/* MVP Section */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-200">Match MVP (Best Player)</h4>
            </div>
            <div className="relative">
              <select
                value={formData.mvp.playerId}
                onChange={(e) => {
                  const selectedPlayer = getAllPlayers().find(p => p._id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    mvp: selectedPlayer ? {
                      playerId: selectedPlayer._id,
                      playerName: selectedPlayer.name,
                      teamId: selectedPlayer.teamId
                    } : { playerId: '', playerName: '', teamId: '' }
                  }));
                }}
                className="w-full border-2 border-purple-500/30 hover:border-purple-400/50 focus:border-purple-500 rounded-xl p-4 text-slate-200 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 focus:ring-4 focus:ring-purple-500/20 appearance-none"
              >
                <option value="" className="bg-slate-800">Select the best player of the match</option>
                {getAllPlayers().map(player => (
                  <option key={player._id} value={player._id} className="bg-slate-800">
                    #{player.jerseyNumber} {player.name} ({player.teamName})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-200">⚽ Goals Scored</h4>
              </div>
              <button
                type="button"
                onClick={addScorer}
                className="group px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-emerald-500/50 hover:scale-105"
              >
                <svg className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Goal
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.goals.map((goal, index) => (
                <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-emerald-500/20 shadow-lg hover:border-emerald-500/40 transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Goal Scorer */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Goal Scorer
                      </label>
                      <select
                        value={goal.scorerId}
                        onChange={(e) => {
                          const selectedPlayer = getAllPlayers().find(p => p._id === e.target.value);
                          if (selectedPlayer) {
                            updateScorer(index, 'scorerId', selectedPlayer._id);
                            updateScorer(index, 'scorerName', selectedPlayer.name);
                            updateScorer(index, 'teamId', selectedPlayer.teamId);
                          }
                        }}
                        className="w-full bg-slate-900/80 border-2 border-slate-700 hover:border-emerald-500/50 focus:border-emerald-500 rounded-lg p-3 text-sm text-slate-200 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/30"
                      >
                        <option value="" className="bg-slate-900">Select player</option>
                        {getAllPlayers().map(player => (
                          <option key={player._id} value={player._id} className="bg-slate-900">
                            #{player.jerseyNumber} {player.name} ({player.teamName})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Assist */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Assist
                      </label>
                      <select
                        value={goal.assistedById}
                        onChange={(e) => {
                          const selectedPlayer = getAllPlayers().find(p => p._id === e.target.value);
                          if (selectedPlayer) {
                            updateScorer(index, 'assistedById', selectedPlayer._id);
                            updateScorer(index, 'assistedByName', selectedPlayer.name);
                          } else {
                            updateScorer(index, 'assistedById', '');
                            updateScorer(index, 'assistedByName', '');
                          }
                        }}
                        className="w-full bg-slate-900/80 border-2 border-slate-700 hover:border-cyan-500/50 focus:border-cyan-500 rounded-lg p-3 text-sm text-slate-200 transition-all duration-200 focus:ring-2 focus:ring-cyan-500/30"
                      >
                        <option value="" className="bg-slate-900">Optional</option>
                        {getAllPlayers()
                          .filter(p => p.teamId === goal.teamId && p._id !== goal.scorerId)
                          .map(player => (
                          <option key={player._id} value={player._id} className="bg-slate-900">
                            #{player.jerseyNumber} {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Minute */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Minute
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="90"
                        value={goal.minute}
                        onChange={(e) => updateScorer(index, 'minute', parseInt(e.target.value) || 90)}
                        className="w-full bg-slate-900/80 border-2 border-slate-700 hover:border-amber-500/50 focus:border-amber-500 rounded-lg p-3 text-sm text-slate-200 transition-all duration-200 focus:ring-2 focus:ring-amber-500/30 placeholder-slate-600"
                      />
                    </div>
                    
                    {/* Team */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-blue-400">Team</label>
                      <div className="flex items-center p-3 bg-slate-900/80 rounded-lg border-2 border-slate-700">
                        <span className="text-sm text-slate-300 font-medium truncate">
                          {goal.teamId && (
                            teams.find(t => t.teamId === goal.teamId)?.name || 'Team'
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeScorer(index)}
                        className="group w-full px-3 py-3 bg-red-500/20 hover:bg-red-500 border-2 border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                      >
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.goals.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-lg mb-1">No goals recorded</p>
                  <p className="text-sm text-slate-600">Click "Add Goal" to start recording goals</p>
                </div>
              )}
            </div>
          </div>

          {/* Assists Section */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl p-6 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-200">🎯 Individual Assists</h4>
              </div>
              <button
                type="button"
                onClick={addAssist}
                className="group px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-cyan-500/50 hover:scale-105"
              >
                <svg className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Assist
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.assists.map((assist, index) => (
                <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/20 shadow-lg hover:border-cyan-500/40 transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Player
                      </label>
                      <select
                        value={assist.playerId}
                        onChange={(e) => {
                          const selectedPlayer = getAllPlayers().find(p => p._id === e.target.value);
                          if (selectedPlayer) {
                            updateAssist(index, 'playerId', selectedPlayer._id);
                            updateAssist(index, 'playerName', selectedPlayer.name);
                            updateAssist(index, 'teamId', selectedPlayer.teamId);
                          }
                        }}
                        className="w-full bg-slate-900/80 border-2 border-slate-700 hover:border-cyan-500/50 focus:border-cyan-500 rounded-lg p-3 text-sm text-slate-200 transition-all duration-200 focus:ring-2 focus:ring-cyan-500/30"
                      >
                        <option value="" className="bg-slate-900">Select player</option>
                        {getAllPlayers().map(player => (
                          <option key={player._id} value={player._id} className="bg-slate-900">
                            #{player.jerseyNumber} {player.name} ({player.teamName})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Number of Assists
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={assist.assists}
                        onChange={(e) => updateAssist(index, 'assists', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900/80 border-2 border-slate-700 hover:border-blue-500/50 focus:border-blue-500 rounded-lg p-3 text-sm text-slate-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 placeholder-slate-600"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeAssist(index)}
                        className="group w-full px-3 py-3 bg-red-500/20 hover:bg-red-500 border-2 border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                      >
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.assists.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <p className="font-semibold text-lg mb-1">No assists recorded</p>
                  <p className="text-sm text-slate-600">Click "Add Assist" to start recording assists</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-2xl p-6 border border-slate-600/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-200">Match Notes</h4>
            </div>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add your comments about the match, key moments, notable performances..."
              className="w-full border-2 border-slate-600/30 hover:border-slate-500/50 focus:border-slate-500 rounded-xl p-4 h-32 resize-none text-slate-200 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 focus:ring-4 focus:ring-slate-500/20 placeholder-slate-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-700">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="px-6 py-3"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="px-8 py-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Result
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchEditor;