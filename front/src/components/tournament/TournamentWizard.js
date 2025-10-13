import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TournamentCreation from './TournamentCreation';
import TournamentPlanning from './TournamentPlanning';
import TournamentTeamSelection from './TournamentTeamSelection';
import TournamentRoulette from './TournamentRoulette';
import TournamentBracket from './TournamentBracket';
import ChampionAnimation from '../ChampionAnimationVideo';
import TournamentPodium from './TournamentPodium';
import { Card } from '../../shared/ui/components/Card';
import { SectionHeading } from '../../shared/ui/components/SectionHeading';
import { Button } from '../../shared/ui/components/Button';

const TournamentWizard = () => {
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [tournament, setTournament] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChampionAnimation, setShowChampionAnimation] = useState(false);

  const steps = [
    { number: 1, title: 'Creation',icon: '⚙️' },
    { number: 2, title: 'Planning', icon: '📅' },
    { number: 3, title: 'Team Selection', icon: '👥' },
    { number: 4, title: 'Draw', icon: '🎯' },
    { number: 5, title: 'Bracket', icon: '🏆' },
    { number: 6, title: 'Champion', icon: '🎉' },
    { number: 7, title: 'Final Podium', icon: '🥇' }
  ];

  useEffect(() => {
    fetchAvailableTeams();
  }, []);

  const fetchAvailableTeams = async () => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('http://localhost:5004/api/teams?limit=100', {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug
        setAvailableTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = (stepNumber, data) => {
    switch (stepNumber) {
      case 1:
        // Création du tournoi
        setTournament(data);
        setCurrentStep(2);
        break;
      case 2:
        // Planification terminée
        setTournament(prev => ({ ...prev, ...data }));
        setCurrentStep(3);
        break;
      case 3:
        // Sélection des équipes terminée
        setTournament(prev => ({ ...prev, teams: data.teams }));
        setCurrentStep(4);
        break;
      case 4:
        // Tirage au sort terminé
        setTournament(data);
        setCurrentStep(5);
        break;
      case 5:
        // Bracket terminé, vérifier si champion
        if (data.champion) {
          setTournament(data);
          setShowChampionAnimation(true);
          setTimeout(() => {
            setShowChampionAnimation(false);
            setCurrentStep(7); // Aller au podium final
          }, 8000); // Animation de 8 secondes
        } else {
          setTournament(data);
        }
        break;
      case 6:
        // Animation terminée
        setCurrentStep(7);
        break;
      default:
        break;
    }
  };

  const goToStep = (stepNumber) => {
    if (stepNumber <= currentStep || stepNumber === 1) {
      setCurrentStep(stepNumber);
    }
  };

  const resetTournament = () => {
    setTournament(null);
    setCurrentStep(1);
    setShowChampionAnimation(false);
  };

  const isStepAccessible = (stepNumber) => {
    if (stepNumber === 1) return true;
    if (stepNumber === 2) return tournament !== null;
    if (stepNumber === 3) return tournament && tournament.name;
    if (stepNumber === 4) return tournament && tournament.teams && tournament.teams.length === 8;
    if (stepNumber === 5) return tournament && tournament.drawCompleted;
    if (stepNumber === 6) return tournament && tournament.champion;
    if (stepNumber === 7) return tournament && tournament.champion;
    return false;
  };

  const isStepCompleted = (stepNumber) => {
    if (stepNumber === 1) return tournament !== null;
    if (stepNumber === 2) return tournament && tournament.scheduled;
    if (stepNumber === 3) return tournament && tournament.teams && tournament.teams.length === 8;
    if (stepNumber === 4) return tournament && tournament.drawCompleted;
    if (stepNumber === 5) return tournament && tournament.champion;
    if (stepNumber === 6) return tournament && tournament.champion;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] py-8 px-2 flex items-center justify-center">
  <div className="max-w-7xl w-full mx-auto px-2 py-4 sm:px-6 sm:py-8 md:px-12 md:py-16 lg:px-20 lg:py-20 ">
        <SectionHeading
          title="Tournament Manager"
          subtitle="Create and manage your tournaments step by step"
          centered
        />
        {/* Stepper */}
        <Card accent className="mb-8 bg-[#16213A] border border-blue-900 shadow-xl rounded-2xl">
          <div className="flex flex-nowrap overflow-x-auto justify-between items-center gap-2 sm:gap-4 py-4 scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-[#16213A]">
            {steps.map((step, index) => {
              const isActive = currentStep === step.number;
              return (
                <div key={step.number} className="flex flex-col items-center min-w-[120px] sm:min-w-[140px] px-2">
                  <div className="flex flex-col items-center w-full">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold border-4 ${isActive ? 'border-blue-500 bg-blue-900 text-blue-300 shadow-lg' : 'border-blue-700 bg-[#0F172A] text-blue-400 shadow-md'} transition-all duration-200 group-hover:scale-105`}>{step.icon}</div>
                    <div className="mt-2 text-center flex flex-col items-center w-full">
                      <div className={`font-semibold text-xs sm:text-sm ${isActive ? 'text-blue-300' : 'text-blue-400'}`}>{step.title}</div>
                      {step.subtitle && <div className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-tight">{step.subtitle}</div>}
                      <div className={`mt-2 h-1 rounded-full ${isActive ? 'bg-blue-500' : 'bg-blue-900/40'}`} style={{width: '80%'}}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        {/* Current Step Info */}
        <div className="mb-6">
          <div className="bg-[#16213A] rounded-xl shadow-lg p-6 md:p-8 border border-blue-900 flex flex-col sm:flex-row items-center gap-4">
            <div className="text-3xl text-blue-300">{steps[currentStep - 1]?.icon}</div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
                Step {currentStep}: {steps[currentStep - 1]?.title}
              </h2>
              <p className="text-slate-300 text-base md:text-lg">
                {steps[currentStep - 1]?.subtitle}
              </p>
            </div>
            {/* Reset Button */}
            <div className="mt-2 sm:mt-0 sm:ml-auto">
              <button
                onClick={resetTournament}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-base transition-colors shadow"
              >
                🔄 Restart
              </button>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div>
          {currentStep === 1 && (
            <TournamentCreation
              availableTeams={availableTeams}
              onTournamentCreated={(tournament) => handleStepComplete(1, tournament)}
              loading={loading}
            />
          )}

          {currentStep === 2 && tournament && (
            <TournamentPlanning
              tournament={tournament}
              onPlanningComplete={(planningData) => handleStepComplete(2, planningData)}
            />
          )}

          {currentStep === 3 && tournament && (
            <TournamentTeamSelection
              tournament={tournament}
              availableTeams={availableTeams}
              onTeamsSelected={(teamsData) => handleStepComplete(3, teamsData)}
            />
          )}

          {currentStep === 4 && tournament && (
            <TournamentRoulette
              tournament={tournament}
              onDrawCompleted={(updatedTournament) => handleStepComplete(4, updatedTournament)}
            />
          )}

          {currentStep === 5 && tournament && (
            <TournamentBracket
              tournament={tournament}
              onTournamentComplete={(updatedTournament) => handleStepComplete(5, updatedTournament)}
            />
          )}

          {currentStep === 7 && tournament && tournament.champion && (
            <TournamentPodium
              tournament={tournament}
              champion={tournament.champion}
              podium={tournament.podium}
            />
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#16213A] rounded-full px-8 py-4 shadow-lg border border-blue-900">
            <div className="text-base md:text-lg font-medium text-blue-200">
              Progress: {currentStep}/7
            </div>
            <div className="w-40 md:w-56 bg-blue-900 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Champion Animation */}
      <ChampionAnimation
        champion={tournament?.champion}
        podium={tournament?.podium}
        isVisible={showChampionAnimation}
        onClose={() => setShowChampionAnimation(false)}
      />
    </div>
  );
};

export default TournamentWizard;