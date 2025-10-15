import React, { useState, useEffect } from 'react';

const AddTeamsModal = ({ open, onClose, tournament, onTeamsAdded }) => {
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchAvailableTeams();
      if (tournament?.teams) {
        setSelectedTeams([...tournament.teams]);
      }
    }
  }, [open, tournament]);

  const fetchAvailableTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching teams with token:', token ? 'Token exists' : 'No token');
      
      // Try with pagination parameters to get more teams
      const response = await fetch('https://sportify-teams.onrender.com/api/teams?limit=50&page=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Data received:', data);
        
        // The response might be an object with teams array or directly an array
        const teams = Array.isArray(data) ? data : (data.teams || data.data || []);
        console.log('Teams processed:', teams);
        console.log('Number of teams:', teams.length);
        setAvailableTeams(teams);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert(`Error fetching teams: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      alert(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTeams.some(selected => selected.teamId === team._id)
  );

  console.log('Available teams:', availableTeams.length);
  console.log('Selected teams:', selectedTeams.length);
  console.log('Filtered teams:', filteredTeams.length);
  console.log('Search term:', searchTerm);

  const handleTeamToggle = (team) => {
    const isSelected = selectedTeams.some(t => t.teamId === team._id);
    if (isSelected) {
      setSelectedTeams(prev => prev.filter(t => t.teamId !== team._id));
    } else if (selectedTeams.length < 8) {
      setSelectedTeams(prev => [...prev, {
        teamId: team._id,
        captain: team.captain,
        name: team.name,
        logo: team.logo,
        status: 'approved'
      }]);
    }
  };

  const handleSave = async () => {
    console.log('=== DÉBUT HANDLERAVE ===');
    console.log('Nombre d\'équipes sélectionnées:', selectedTeams.length);
    console.log('Équipes sélectionnées:', selectedTeams);
    console.log('Tournament:', tournament);
    
    if (selectedTeams.length !== 8) {
      console.log('❌ Pas exactement 8 équipes sélectionnées');
      alert('Vous devez sélectionner exactement 8 équipes');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'EXISTS' : 'MISSING');
      
      const url = `https://service-tournament.onrender.com/api/tournaments/${tournament._id}`;
      const payload = { teams: selectedTeams };
      
      console.log('🚀 Envoi de la requête PUT vers:', url);
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      
      // Update tournament with teams
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Réponse reçue - Status:', response.status);
      console.log('📡 Réponse reçue - OK:', response.ok);

      if (response.ok) {
        const updatedTournament = await response.json();
        console.log('✅ Tournoi mis à jour avec succès:', updatedTournament);
        onTeamsAdded(updatedTournament);
        alert('Équipes ajoutées avec succès !');
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur de réponse:', response.status, errorText);
        let errorMessage;
        try {
          const errorObj = JSON.parse(errorText);
          errorMessage = errorObj.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        alert(`Erreur ${response.status}: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du tournoi:', error);
      alert(`Erreur réseau: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('=== FIN HANDLERAVE ===');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Add Teams to Tournament</h3>
              <p className="text-gray-600 mt-1">{tournament?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Teams Selected</span>
              <span className="text-sm text-gray-500">{selectedTeams.length}/8</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(selectedTeams.length / 8) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Search teams..."
            />
          </div>

          {/* Selected Teams */}
          {selectedTeams.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Selected Teams</h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedTeams.map(team => (
                  <div
                    key={team.teamId}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      )}
                      <span className="font-medium text-blue-900">{team.name}</span>
                    </div>
                    <button
                      onClick={() => handleTeamToggle({ _id: team.teamId, name: team.name, logo: team.logo, captain: team.captain })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Teams */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Available Teams</h4>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading teams...</p>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  {searchTerm ? 'No teams found matching your search' : 'No available teams'}
                </div>
                {!searchTerm && availableTeams.length === 0 && (
                  <div className="text-sm text-gray-400">
                    <p>It looks like there are no teams available.</p>
                    <p>You might need to create some teams first or check if the team service is running.</p>
                    <button
                      onClick={() => {
                        console.log('Available teams:', availableTeams);
                        console.log('Token:', localStorage.getItem('token'));
                        alert('Check console for debugging info');
                      }}
                      className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-xs"
                    >
                      Debug Info
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {filteredTeams.map(team => {
                  const canSelect = selectedTeams.length < 8;
                  
                  return (
                    <div
                      key={team._id}
                      className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        canSelect
                          ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                      }`}
                      onClick={() => canSelect && handleTeamToggle(team)}
                    >
                      <div className="flex items-center">
                        {team.logo && (
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{team.name}</div>
                          <div className="text-sm text-gray-500">
                            {team.sport} • {team.members?.length || 0} members
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {canSelect ? (
                          <span className="text-blue-600 font-medium">Select</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Limit reached</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || selectedTeams.length !== 8}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : `Save Teams (${selectedTeams.length}/8)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTeamsModal;