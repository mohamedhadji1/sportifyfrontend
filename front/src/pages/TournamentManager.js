import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import TournamentCreation from '../components/tournament/TournamentCreation';
import TournamentRoulette from '../components/tournament/TournamentRoulette';
import TournamentBracket from '../components/tournament/TournamentBracket';

const TournamentManager = () => {
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState('create'); // create, draw, bracket
  const [tournament, setTournament] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableTeams();
  }, []);

  const fetchAvailableTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const teams = await response.json();
        setAvailableTeams(teams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleTournamentCreated = (newTournament) => {
    setTournament(newTournament);
    setCurrentStep('draw');
  };

  const handleDrawCompleted = (updatedTournament) => {
    setTournament(updatedTournament);
    setCurrentStep('bracket');
  };

  const resetTournament = () => {
    setTournament(null);
    setCurrentStep('create');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Restricted Access
          </h2>
          <p className="text-gray-600">
            You must be logged in to access tournament management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tournament Manager
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage your 8-team tournaments
              </p>
            </div>
            {tournament && (
              <button
                onClick={resetTournament}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                New Tournament
              </button>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${currentStep === 'create' ? 'text-blue-600' : currentStep === 'draw' || currentStep === 'bracket' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'create' ? 'bg-blue-600 text-white' : currentStep === 'draw' || currentStep === 'bracket' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Tournament Creation</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-300">
              <div className={`h-full ${currentStep === 'draw' || currentStep === 'bracket' ? 'bg-green-600' : 'bg-gray-300'} transition-all duration-300`}></div>
            </div>
            
            <div className={`flex items-center ${currentStep === 'draw' ? 'text-blue-600' : currentStep === 'bracket' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'draw' ? 'bg-blue-600 text-white' : currentStep === 'bracket' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Draw</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-300">
              <div className={`h-full ${currentStep === 'bracket' ? 'bg-green-600' : 'bg-gray-300'} transition-all duration-300`}></div>
            </div>
            
            <div className={`flex items-center ${currentStep === 'bracket' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'bracket' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Competition Bracket</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md">
          {currentStep === 'create' && (
            <TournamentCreation
              availableTeams={availableTeams}
              onTournamentCreated={handleTournamentCreated}
              loading={loading}
            />
          )}
          
          {currentStep === 'draw' && tournament && (
            <TournamentRoulette
              tournament={tournament}
              onDrawCompleted={handleDrawCompleted}
            />
          )}
          
          {currentStep === 'bracket' && tournament && (
            <TournamentBracket
              tournament={tournament}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentManager;