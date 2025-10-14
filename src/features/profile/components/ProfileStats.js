"use client"

import { Card } from "../../../shared/ui/components/Card"
import { Icons } from "../../../shared/ui/components/Icons"
import { useState, useEffect } from "react"
import axios from "axios"

export const ProfileStats = ({ user, detailed = false }) => {
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    winRate: 0,
    hoursPlayed: 0,
    level: 1,
    achievements: 0,
    friends: 0,
    joinDate: user.createdAt ? new Date(user.createdAt) : new Date(),
    lastActive: new Date(),
    totalGoals: 0,
    totalAssists: 0,
    totalMVPs: 0,
    overallRating: 0,
    attackRating: 0,
    passingRating: 0,
    defenseRating: 0,
    achievementsList: [],
    recentMatches: [],
    tournaments: {
      played: 0,
      won: 0,
      runnerUp: 0,
      thirdPlace: 0
    },
    teams: {
      currentTeams: [],
      totalTeams: 0,
      isTeamCaptain: false,
      teamTournaments: 0
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchPlayerStats = async () => {
    try {
      // Check if user ID exists before making the request
      const userId = user?._id || user?.id;
      
      if (!userId) {
        console.warn('User ID not available. Please log out and log back in to update your session.');
        console.log('User object:', user);
        setLoading(false);
        return;
      }

      console.log('Fetching stats for user ID:', userId);
  const API = process.env.REACT_APP_API_URL || process.env.REACT_APP_AUTH_SERVICE_URL || 'https://sportifyauth.onrender.com/api'
  const response = await axios.get(`${API}/auth/user/${userId}/stats`);
      
      console.log('📊 Stats API Response:', response.data);
      
      if (response.data.success && response.data.user.stats) {
        const playerStats = response.data.user.stats;
        
        console.log('🏆 Tournament Stats:', {
          totalTournaments: playerStats.totalTournaments,
          tournamentsWon: playerStats.tournamentsWon,
          tournamentsRunnerUp: playerStats.tournamentsRunnerUp,
          tournamentsThirdPlace: playerStats.tournamentsThirdPlace
        });
        
        setStats({
          gamesPlayed: playerStats.totalMatches || 0,
          winRate: playerStats.totalMatches > 0 
            ? Math.round((playerStats.tournamentsWon / playerStats.totalTournaments) * 100) || 0 
            : 0,
          hoursPlayed: Math.round(playerStats.totalMatches * 1.5) || 0, // Estimate
          level: Math.floor(playerStats.overallRating / 10) || 1,
          achievements: playerStats.achievements?.length || 0,
          friends: 45, // Mock data
          joinDate: user.createdAt ? new Date(user.createdAt) : new Date(),
          lastActive: new Date(),
          totalGoals: playerStats.totalGoals || 0,
          totalAssists: playerStats.totalAssists || 0,
          totalMVPs: playerStats.totalMVPs || 0,
          overallRating: playerStats.overallRating || 0,
          attackRating: playerStats.attackRating || 0,
          passingRating: playerStats.passingRating || 0,
          defenseRating: playerStats.defenseRating || 0,
          achievementsList: playerStats.achievements || [],
          recentMatches: playerStats.recentMatches || [],
          tournaments: {
            played: playerStats.totalTournaments || 0,
            won: playerStats.tournamentsWon || 0,
            runnerUp: playerStats.tournamentsRunnerUp || 0,
            thirdPlace: playerStats.tournamentsThirdPlace || 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      fetchPlayerStats();
      fetchTeamStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.id]);

  const fetchTeamStats = async () => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      // Fetch user's teams from service-team (port 5004)
      const teamsResponse = await axios.get(`https://sportify-teams.onrender.com/api/teams/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (teamsResponse.data.success && teamsResponse.data.teams) {
        const userTeams = teamsResponse.data.teams;
        
        // Check if user is captain of any team
        const isTeamCaptain = userTeams.some(team => 
          team.captain?._id === userId || team.captain === userId
        );

        // Count total tournament participations across all teams
        const teamTournaments = userTeams.reduce((total, team) => {
          return total + (team.tournamentsPlayed || 0);
        }, 0);

        setStats(prevStats => ({
          ...prevStats,
          teams: {
            currentTeams: userTeams,
            totalTeams: userTeams.length,
            isTeamCaptain: isTeamCaptain,
            teamTournaments: teamTournaments
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const StatCard = ({ icon, label, value, trend, color = "blue" }) => (
    <Card variant="glass" className="stat-card p-6 hover:bg-white/5 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-600/20 group-hover:bg-${color}-600/30 transition-colors duration-300`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-sm transition-all duration-300 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <Icons.TrendingUp className="w-4 h-4 mr-1 animate-pulse" /> : <Icons.TrendingDown className="w-4 h-4 mr-1 animate-pulse" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{value}</p>
        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{label}</p>
      </div>
    </Card>
  )
      if (detailed) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tournament Performance Cards */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0s' }}>
          <StatCard 
            icon={<Icons.Trophy className="w-6 h-6 text-yellow-400" />} 
            label="Tournaments Won" 
            value={stats.tournaments.won} 
            trend={stats.tournaments.won > 0 ? 15 : 0} 
            color="yellow" 
          />
        </div>
        
        <div className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <StatCard 
            icon={<Icons.Target className="w-6 h-6 text-red-400" />} 
            label="Total Goals" 
            value={stats.totalGoals} 
            trend={12} 
            color="red" 
          />
        </div>

        <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <StatCard 
            icon={<Icons.Award className="w-6 h-6 text-blue-400" />} 
            label="Total Assists" 
            value={stats.totalAssists} 
            trend={8} 
            color="blue" 
          />
        </div>

        <div className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <StatCard 
            icon={<Icons.Star className="w-6 h-6 text-purple-400" />} 
            label="MVP Awards" 
            value={stats.totalMVPs} 
            trend={10} 
            color="purple" 
          />
        </div>

        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <StatCard 
            icon={<Icons.TrendingUp className="w-6 h-6 text-green-400" />} 
            label="Overall Rating" 
            value={stats.overallRating.toFixed(1)} 
            trend={5} 
            color="green" 
          />
        </div>

        <div className="animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          <StatCard 
            icon={<Icons.Shield className="w-6 h-6 text-indigo-400" />} 
            label="Tournaments Played" 
            value={stats.tournaments.played} 
            trend={7} 
            color="indigo" 
          />
        </div>

        {/* Tournament Performance Stats */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <StatCard 
            icon={<span className="text-2xl">🥈</span>} 
            label="Runner-Up Finishes" 
            value={stats.tournaments.runnerUp} 
            trend={stats.tournaments.runnerUp > 0 ? 10 : 0} 
            color="gray" 
          />
        </div>

        <div className="animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
          <StatCard 
            icon={<span className="text-2xl">🥉</span>} 
            label="Third Place Finishes" 
            value={stats.tournaments.thirdPlace} 
            trend={stats.tournaments.thirdPlace > 0 ? 8 : 0} 
            color="orange" 
          />
        </div>

        {/* Team Stats */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
          <StatCard 
            icon={<Icons.Users className="w-6 h-6 text-cyan-400" />} 
            label="Current Teams" 
            value={stats.teams?.totalTeams || 0} 
            trend={stats.teams?.totalTeams > 0 ? 12 : 0} 
            color="cyan" 
          />
        </div>

        {stats.teams?.isTeamCaptain && (
          <div className="animate-fadeInUp" style={{ animationDelay: '0.9s' }}>
            <StatCard 
              icon={<Icons.Crown className="w-6 h-6 text-yellow-400" />} 
              label="Team Captain" 
              value="Yes" 
              color="yellow" 
            />
          </div>
        )}

        {/* Additional Stats */}
        {[
          { icon: <Icons.Trophy className="w-6 h-6 text-yellow-400" />, label: "Games Played", value: stats.gamesPlayed, trend: 12, color: "yellow" },
          { icon: <Icons.Target className="w-6 h-6 text-green-400" />, label: "Win Rate", value: `${stats.winRate}%`, trend: 5, color: "green" },
          { icon: <Icons.Clock className="w-6 h-6 text-blue-400" />, label: "Hours Played", value: stats.hoursPlayed, trend: -3, color: "blue" }
        ].map((stat, index) => (
          <div key={stat.label} className="animate-fadeInUp" style={{ animationDelay: `${(index + 10) * 0.1}s` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>
    )
  }

  return (    <div className="space-y-6">
      {/* Performance Ratings */}
      <Card variant="glass" className="profile-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Icons.Star className="w-5 h-5 text-yellow-400" />
            AI Performance Ratings
          </h3>
          <div className="space-y-4">
            {[
              { 
                label: "Overall Rating", 
                value: stats.overallRating.toFixed(1), 
                max: 100, 
                color: "from-purple-500 to-pink-500",
                icon: <Icons.Trophy className="w-5 h-5 text-purple-400" />
              },
              { 
                label: "Attack Rating", 
                value: stats.attackRating.toFixed(1), 
                max: 100, 
                color: "from-red-500 to-orange-500",
                icon: <Icons.Target className="w-5 h-5 text-red-400" />
              },
              { 
                label: "Passing Rating", 
                value: stats.passingRating.toFixed(1), 
                max: 100, 
                color: "from-blue-500 to-cyan-500",
                icon: <Icons.Award className="w-5 h-5 text-blue-400" />
              },
              { 
                label: "Defense Rating", 
                value: stats.defenseRating.toFixed(1), 
                max: 100, 
                color: "from-green-500 to-emerald-500",
                icon: <Icons.Shield className="w-5 h-5 text-green-400" />
              }
            ].map((rating, index) => (
              <div key={rating.label} className="animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {rating.icon}
                    <span className="text-sm text-gray-300">{rating.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{rating.value}/{rating.max}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`bg-gradient-to-r ${rating.color} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${(parseFloat(rating.value) / rating.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Match Statistics */}
      <Card variant="glass" className="profile-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">⚽ Match Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.totalGoals}</div>
              <div className="text-xs text-gray-400">Goals</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.totalAssists}</div>
              <div className="text-xs text-gray-400">Assists</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
              <div className="text-3xl font-bold text-purple-400 mb-1">{stats.totalMVPs}</div>
              <div className="text-xs text-gray-400">MVPs</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tournament Statistics */}
      <Card variant="glass" className="profile-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">🏆 Tournament Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Tournaments Played</span>
              <span className="text-white font-bold">{stats.tournaments.played}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥇</span>
                <span className="text-gray-300">Championships</span>
              </div>
              <span className="text-yellow-400 font-bold">{stats.tournaments.won}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-400/10 to-gray-500/10 rounded-lg border border-gray-400/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥈</span>
                <span className="text-gray-300">Runner-up</span>
              </div>
              <span className="text-gray-300 font-bold">{stats.tournaments.runnerUp}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥉</span>
                <span className="text-gray-300">Third Place</span>
              </div>
              <span className="text-orange-400 font-bold">{stats.tournaments.thirdPlace}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Team Statistics */}
      <Card variant="glass" className="profile-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Icons.Users className="w-5 h-5 text-cyan-400" />
            Team Statistics
          </h3>
          
          {stats.teams?.currentTeams?.length > 0 ? (
            <div className="space-y-4">
              {/* Team Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg text-center hover:bg-white/10 transition-all duration-300">
                  <div className="text-2xl font-bold text-cyan-400 mb-1">{stats.teams.totalTeams}</div>
                  <div className="text-xs text-gray-400">Teams Joined</div>
                </div>
                {stats.teams.isTeamCaptain && (
                  <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-lg border border-yellow-500/20 text-center hover:bg-yellow-500/20 transition-all duration-300">
                    <div className="text-2xl mb-1">👑</div>
                    <div className="text-xs text-yellow-400 font-semibold">Team Captain</div>
                  </div>
                )}
              </div>

              {/* Current Teams List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Current Teams</h4>
                {stats.teams?.currentTeams?.slice(0, 3).map((team, index) => (
                  <div 
                    key={team._id || index} 
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Icons.Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium group-hover:text-cyan-400 transition-colors duration-300">
                          {team.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {team.sport} • {team.members?.length || 0} members
                        </div>
                      </div>
                    </div>
                    {(team.captain?._id === user._id || team.captain === user._id) && (
                      <div className="text-yellow-400">
                        <Icons.Crown className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ))}
                {stats.teams?.currentTeams?.length > 3 && (
                  <div className="text-center text-sm text-gray-400 pt-2">
                    +{stats.teams.currentTeams.length - 3} more teams
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Icons.Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Not part of any team yet</p>
              <p className="text-gray-500 text-xs mt-1">Join or create a team to get started!</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <Card variant="glass" className="profile-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { icon: <Icons.Trophy className="w-5 h-5 text-yellow-400" />, label: "Games Played", value: stats.gamesPlayed, color: "yellow" },
              { icon: <Icons.Target className="w-5 h-5 text-green-400" />, label: "Win Rate", value: `${stats.winRate}%`, color: "green" },
              { icon: <Icons.Clock className="w-5 h-5 text-blue-400" />, label: "Hours Played", value: `${stats.hoursPlayed}h`, color: "blue" },
              { icon: <Icons.Star className="w-5 h-5 text-purple-400" />, label: "Level", value: stats.level, color: "purple" }
            ].map((stat, index) => (
              <div key={stat.label} className="flex items-center justify-between group animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-600/20 group-hover:bg-${stat.color}-600/30 transition-colors duration-300`}>
                    {stat.icon}
                  </div>
                  <span className="text-gray-300 group-hover:text-white transition-colors duration-300">{stat.label}</span>
                </div>
                <span className="text-white font-semibold group-hover:scale-105 transition-transform duration-300">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Progress Card */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Progress</h3>
          <div className="space-y-4">
            {/* Level Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Level {stats.level}</span>
                <span className="text-sm text-gray-400">85%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: '85%' }}
                ></div>
              </div>
            </div>

            {/* Achievement Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Achievements</span>
                <span className="text-sm text-gray-400">{stats.achievements}/50</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.achievements / 50) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Account Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Member since</span>
              <span className="text-white">
                {stats.joinDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Last active</span>
              <span className="text-green-400">Online now</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Overall Rating</span>
              <span className="text-white font-bold">{stats.overallRating.toFixed(1)}/100</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Achievements Card */}
      {stats.achievementsList.length > 0 && (
        <Card variant="glass">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">🏆 Achievements</h3>
            <div className="space-y-3">
              {stats.achievementsList.slice(0, 5).map((achievement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
                  <div className="text-2xl">
                    {achievement.type === 'best_player' && '🏅'}
                    {achievement.type === 'best_scorer' && '⚽'}
                    {achievement.type === 'best_passer' && '🎯'}
                    {achievement.type === 'best_keeper' && '🧤'}
                    {achievement.type === 'tournament_winner' && '👑'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{achievement.description}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(achievement.awardedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
