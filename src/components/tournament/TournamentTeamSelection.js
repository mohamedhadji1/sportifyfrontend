import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const TournamentTeamSelection = ({ tournament, availableTeams, onTeamsSelected }) => {
  const { token: contextToken } = useAuth();
  const token = contextToken || localStorage.getItem('token') || localStorage.getItem('authToken') || '';
  const [selectedTeams, setSelectedTeams] = useState(tournament.teams || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState(tournament.sport || 'all');
  const [updating, setUpdating] = useState(false);

  const filteredTeams = availableTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = filterSport === 'all' || team.sport === filterSport;
    const notSelected = !selectedTeams.some(selected => selected._id === team._id);
    return matchesSearch && matchesSport && notSelected;
  });

  const handleTeamToggle = (team) => {
    if (selectedTeams.some(t => t._id === team._id)) {
      // Remove team
      setSelectedTeams(prev => prev.filter(t => t._id !== team._id));
    } else if (selectedTeams.length < 8) {
      // Add team
      setSelectedTeams(prev => [...prev, team]);
    }
  };

  const handleSubmit = async () => {
    if (selectedTeams.length !== 8) {
      alert('You must select exactly 8 teams');
      return;
    }

    setUpdating(true);
    try {
      // Essayons d'abord l'API, sinon on continue localement
      try {
        const payload = {
          teams: selectedTeams.map(team => ({
            teamId: team._id,
            name: team.name,
            logo: team.logo,
            status: 'confirmed'
          }))
        };

        console.log('Updating tournament with token:', token ? 'Present' : 'Missing');
        console.log('Tournament ID:', tournament._id);
        console.log('Payload:', payload);

        const response = await fetch(`http://localhost:5006/api/tournaments/${tournament._id}`, {
          method: 'PUT',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const responseData = await response.json();
        console.log('API Response:', response.status, responseData);

        if (response.ok) {
          onTeamsSelected({ teams: selectedTeams });
        } else {
          console.warn('API update failed:', responseData);
          alert(`Error: ${responseData.message || 'Failed to update tournament'}`);
          // Si l'API échoue, on continue avec les données locales
          const updatedTournament = {
            ...tournament,
            teams: selectedTeams,
            updatedAt: new Date().toISOString()
          };
          onTeamsSelected(updatedTournament);
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        alert('Network error: ' + apiError.message);
        // Si l'API échoue complètement, on continue avec les données locales
        const updatedTournament = {
          ...tournament,
          teams: selectedTeams,
          updatedAt: new Date().toISOString()
        };
        onTeamsSelected(updatedTournament);
      }
    } catch (error) {
      console.error('Error in team selection:', error);
      alert('Erreur lors de la sélection des équipes');
    } finally {
      setUpdating(false);
    }
  };

  const getUniqueSpports = () => {
    const sports = [...new Set(availableTeams.map(team => team.sport))];
    return sports.filter(Boolean);
  };

  const TeamCard = ({ team, isSelected = false, onClick, disabled = false }) => (
    <div
      className={`group relative bg-white rounded-xl shadow-md border-2 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:scale-105 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-blue-200'
          : disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => !disabled && onClick(team)}
    >
      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
          ✓
        </div>
      )}

      <div className="p-4">
        {/* Team Logo and Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {team.logo ? (
              <img
                src={team.logo}
                alt={team.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-xl">⚽</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{team.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{team.sport}</p>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">👥</span>
            <span>{team.currentMembers || team.members?.length || 0} members</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">🏆</span>
            <span>{team.wins || 0} wins</span>
          </div>
        </div>

        {/* Add/Remove Button */}
        <div className="mt-3">
          {isSelected ? (
            <button className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              ❌ Remove
            </button>
          ) : disabled ? (
            <button disabled className="w-full py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
              Limit reached
            </button>
          ) : (
            <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
              ➕ Add
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] py-4 px-2 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto bg-[#16213A] rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-blue-900">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
            <span className="text-blue-400">👥</span> Team Selection
          </h2>
          <p className="text-white/70 text-base sm:text-lg">
            Choose <span className="font-bold text-blue-300">8 teams</span> to participate in <span className="font-bold text-indigo-300">"{tournament.name}"</span>
          </p>
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full mt-2 shadow-sm border ${selectedTeams.length === 8 ? 'bg-green-100 text-green-800 border-green-300' : 'bg-blue-100 text-blue-800 border-blue-300'}`}>
            <span className="font-semibold text-lg">{selectedTeams.length}/8 teams selected</span>
            {selectedTeams.length === 8 && <span className="text-xl">✅</span>}
          </div>
        </div>

        {/* Selected Teams Section */}
        {selectedTeams.length > 0 && (
          <div className="mb-10">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-6 shadow-md border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-3xl">⭐</span>
                Selected Teams
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {selectedTeams.map((team, index) => (
                  <div key={team._id} className="bg-white rounded-xl p-4 border border-blue-300 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400">⚽</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm truncate">{team.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{team.sport}</div>
                      </div>
                      <button
                        onClick={() => handleTeamToggle(team)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="Remove team"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div>
                <label className="flex items-center gap-2 text-base font-semibold text-white mb-2">
                  <span className="text-lg">🔍</span> Search for a team
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-white"
                  placeholder="Team name..."
                />
              </div>

              {/* Sport Filter */}
              <div>
                <label className="flex items-center gap-2 text-base font-semibold text-white mb-2">
                  <span className="text-lg">⚽</span> Filter by sport
                </label>
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="w-full bg-gray-900 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-white"
                >
                  <option value="all">All sports</option>
                  {getUniqueSpports().map(sport => (
                    <option key={sport} value={sport} className="capitalize">
                      {sport}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Available Teams */}
        <div className="mb-10">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400 text-3xl">🏟️</span>
            Available Teams ({filteredTeams.length})
          </h3>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-2xl border border-white/10">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <p className="text-white/70 text-lg">
                {searchTerm || filterSport !== 'all' 
                  ? 'No teams found with these criteria' 
                  : 'All teams have been selected or no teams available'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredTeams.map(team => (
                <TeamCard
                  key={team._id}
                  team={team}
                  isSelected={selectedTeams.some(t => t._id === team._id)}
                  onClick={handleTeamToggle}
                  disabled={selectedTeams.length >= 8 && !selectedTeams.some(t => t._id === team._id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="text-center pt-6">
          <button
            onClick={handleSubmit}
            disabled={updating || selectedTeams.length !== 8}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg w-full sm:w-auto"
          >
            {updating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Confirming...
              </div>
            ) : selectedTeams.length !== 8 ? (
              <>
                ⚠️ Select {8 - selectedTeams.length} more team(s)
              </>
            ) : (
              <>
                ✅ Confirm Selection ({selectedTeams.length}/8)
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-blue-500 text-2xl mt-1">💡</div>
            <div className="text-blue-800">
              <h4 className="font-bold mb-2 text-lg">Instructions</h4>
              <ul className="text-base space-y-1">
                <li>• Select exactly 8 teams for the tournament</li>
                <li>• Use filters to find teams more easily</li>
                <li>• Click a team to add or remove it</li>
                <li>• Make sure all teams match the tournament sport</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentTeamSelection;