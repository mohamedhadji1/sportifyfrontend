import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const TournamentResultsAdmin = ({ tournament, onResultsUpdated, onClose }) => {
  const { token } = useAuth();
  const [results, setResults] = useState({
    quarterFinals: [
      { match: 1, team1: '', team2: '', team1Score: 0, team2Score: 0, winner: '' },
      { match: 2, team1: '', team2: '', team1Score: 0, team2Score: 0, winner: '' },
      { match: 3, team1: '', team2: '', team1Score: 0, team2Score: 0, winner: '' },
      { match: 4, team1: '', team2: '', team1Score: 0, team2Score: 0, winner: '' }
    ],
    semiFinals: [
      { match: 1, team1: '', team2: '', team1Score: 0, team2Score: 0, winner: '' },
      { match: 2, team1: '', team2: '', team1Score: 0, team2Score: 0, winner: '' }
    ],
    final: { team1: '', team2: '', team1Score: 0, team2Score: 0, winner: '' },
    thirdPlace: { team1: '', team2: '', team1Score: 0, team2Score: 0, winner: '' }
  });

  const [currentPhase, setCurrentPhase] = useState('quarterFinals');

  useEffect(() => {
    // Initialiser automatiquement les quarts de finale avec l'ordre de la roulette
    if (tournament?.teamOrder && tournament.teamOrder.length >= 8) {
      const orderedTeams = tournament.teamOrder;
      setResults(prev => ({
        ...prev,
        quarterFinals: [
          { ...prev.quarterFinals[0], team1: orderedTeams[0], team2: orderedTeams[1] },
          { ...prev.quarterFinals[1], team1: orderedTeams[2], team2: orderedTeams[3] },
          { ...prev.quarterFinals[2], team1: orderedTeams[4], team2: orderedTeams[5] },
          { ...prev.quarterFinals[3], team1: orderedTeams[6], team2: orderedTeams[7] }
        ]
      }));
    } else if (tournament?.teams) {
      // Fallback avec les équipes du tournoi
      const teamNames = tournament.teams.map(t => t.name);
      setResults(prev => ({
        ...prev,
        quarterFinals: prev.quarterFinals.map((qf, index) => ({
          ...qf,
          team1: teamNames[index * 2] || '',
          team2: teamNames[index * 2 + 1] || ''
        }))
      }));
    }
  }, [tournament]);

  const updateScore = (phase, matchIndex, team, score) => {
    setResults(prev => {
      const newResults = { ...prev };
      if (phase === 'final' || phase === 'thirdPlace') {
        newResults[phase] = { 
          ...newResults[phase], 
          [`${team}Score`]: parseInt(score) || 0 
        };
        // Auto-déterminer le gagnant
        const match = newResults[phase];
        if (match.team1Score > match.team2Score) {
          match.winner = match.team1;
        } else if (match.team2Score > match.team1Score) {
          match.winner = match.team2;
        } else {
          match.winner = '';
        }
      } else {
        newResults[phase] = [...newResults[phase]];
        newResults[phase][matchIndex] = { 
          ...newResults[phase][matchIndex], 
          [`${team}Score`]: parseInt(score) || 0 
        };
        // Auto-déterminer le gagnant
        const match = newResults[phase][matchIndex];
        if (match.team1Score > match.team2Score) {
          match.winner = match.team1;
        } else if (match.team2Score > match.team1Score) {
          match.winner = match.team2;
        } else {
          match.winner = '';
        }
      }
      return newResults;
    });
  };

  const advanceToNextPhase = () => {
    if (currentPhase === 'quarterFinals') {
      // Avancer les gagnants des quarts vers les demi-finales
      const qfWinners = results.quarterFinals.map(qf => qf.winner).filter(w => w);
      if (qfWinners.length === 4) {
        setResults(prev => ({
          ...prev,
          semiFinals: [
            { ...prev.semiFinals[0], team1: qfWinners[0], team2: qfWinners[1] },
            { ...prev.semiFinals[1], team1: qfWinners[2], team2: qfWinners[3] }
          ]
        }));
        setCurrentPhase('semiFinals');
      }
    } else if (currentPhase === 'semiFinals') {
      // Avancer vers finale et 3ème place
      const sf1Winner = results.semiFinals[0]?.winner;
      const sf2Winner = results.semiFinals[1]?.winner;
      
      if (sf1Winner && sf2Winner) {
        const sf1Loser = results.semiFinals[0]?.winner === results.semiFinals[0]?.team1 
          ? results.semiFinals[0]?.team2 : results.semiFinals[0]?.team1;
        const sf2Loser = results.semiFinals[1]?.winner === results.semiFinals[1]?.team1 
          ? results.semiFinals[1]?.team2 : results.semiFinals[1]?.team1;

        setResults(prev => ({
          ...prev,
          final: { ...prev.final, team1: sf1Winner, team2: sf2Winner },
          thirdPlace: { ...prev.thirdPlace, team1: sf1Loser || '', team2: sf2Loser || '' }
        }));
        setCurrentPhase('final');
      }
    }
  };

  const generateBracket = () => {
    const bracket = {
      quarterFinals: results.quarterFinals.map(qf => ({
        match: qf.match,
        team1: qf.team1 ? { name: qf.team1, score: qf.team1Score } : null,
        team2: qf.team2 ? { name: qf.team2, score: qf.team2Score } : null,
        winner: qf.winner ? { name: qf.winner } : null
      })),
      semifinals: results.semiFinals.map(sf => ({
        match: sf.match,
        team1: sf.team1 ? { name: sf.team1, score: sf.team1Score } : null,
        team2: sf.team2 ? { name: sf.team2, score: sf.team2Score } : null,
        winner: sf.winner ? { name: sf.winner } : null
      })),
      final: {
        team1: results.final.team1 ? { name: results.final.team1, score: results.final.team1Score } : null,
        team2: results.final.team2 ? { name: results.final.team2, score: results.final.team2Score } : null,
        winner: results.final.winner ? { name: results.final.winner } : null
      },
      thirdPlace: {
        team1: results.thirdPlace.team1 ? { name: results.thirdPlace.team1, score: results.thirdPlace.team1Score } : null,
        team2: results.thirdPlace.team2 ? { name: results.thirdPlace.team2, score: results.thirdPlace.team2Score } : null,
        winner: results.thirdPlace.winner ? { name: results.thirdPlace.winner } : null
      }
    };

    onResultsUpdated(bracket);
  };

  const isPhaseComplete = (phase) => {
    if (phase === 'quarterFinals') {
      return results.quarterFinals.every(qf => qf.winner);
    } else if (phase === 'semiFinals') {
      return results.semiFinals.every(sf => sf.winner);
    } else if (phase === 'final') {
      return results.final.winner && results.thirdPlace.winner;
    }
    return false;
  };

  const MatchCard = ({ title, match, phase, matchIndex = null, isActive = false }) => (
    <div className={`border-2 rounded-xl p-4 transition-all duration-300 ${
      isActive 
        ? 'border-blue-500 bg-blue-50 shadow-lg' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <h3 className="font-bold text-lg mb-4 text-center text-gray-800">{title}</h3>
      
      <div className="space-y-3">
        {/* Équipe 1 */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <span className="font-medium text-gray-800 flex-1">{match.team1 || 'TBD'}</span>
          <input 
            type="number" 
            value={match.team1Score || 0}
            onChange={(e) => updateScore(phase, matchIndex, 'team1', e.target.value)}
            className="w-16 p-2 border border-gray-300 rounded text-center text-gray-800 font-bold"
            disabled={!match.team1 || !isActive}
            min="0"
          />
        </div>

        <div className="text-center text-gray-500 font-medium">VS</div>

        {/* Équipe 2 */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <span className="font-medium text-gray-800 flex-1">{match.team2 || 'TBD'}</span>
          <input 
            type="number" 
            value={match.team2Score || 0}
            onChange={(e) => updateScore(phase, matchIndex, 'team2', e.target.value)}
            className="w-16 p-2 border border-gray-300 rounded text-center text-gray-800 font-bold"
            disabled={!match.team2 || !isActive}
            min="0"
          />
        </div>

        {match.winner && (
          <div className="text-center p-3 bg-green-100 rounded-lg border border-green-300">
            <span className="text-green-800 font-bold">🏆 Gagnant: {match.winner}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 max-w-6xl w-full max-h-screen overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">🏆 Administration du Tournoi</h2>
            <p className="text-gray-600">Saisissez les scores pour chaque phase</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center transition-all"
          >
            ×
          </button>
        </div>

        {/* Phase Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['quarterFinals', 'semiFinals', 'final'].map((phase, index) => {
              const phaseNames = ['Quarts de Finale', 'Demi-Finales', 'Finale & 3ème Place'];
              const isActive = currentPhase === phase;
              const isCompleted = isPhaseComplete(phase);
              
              return (
                <div key={phase} className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-3 font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {phaseNames[index]}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 h-1 mx-4 rounded ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarts de finale */}
        {currentPhase === 'quarterFinals' && (
          <section className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-2">⚽ Quarts de Finale</h3>
              <p className="text-gray-600">Équipes automatiquement assignées selon l'ordre de la roulette</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {results.quarterFinals.map((qf, index) => (
                <MatchCard 
                  key={index}
                  title={`Quart ${index + 1}`}
                  match={qf}
                  phase="quarterFinals"
                  matchIndex={index}
                  isActive={true}
                />
              ))}
            </div>
            {isPhaseComplete('quarterFinals') && (
              <div className="text-center mt-8">
                <button 
                  onClick={advanceToNextPhase}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105"
                >
                  🚀 Passer aux Demi-Finales
                </button>
              </div>
            )}
          </section>
        )}

        {/* Demi-finales */}
        {currentPhase === 'semiFinals' && (
          <section className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-green-600 mb-2">🔥 Demi-Finales</h3>
              <p className="text-gray-600">Gagnants des quarts de finale</p>
            </div>
            <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
              {results.semiFinals.map((sf, index) => (
                <MatchCard 
                  key={index}
                  title={`Demi-Finale ${index + 1}`}
                  match={sf}
                  phase="semiFinals"
                  matchIndex={index}
                  isActive={true}
                />
              ))}
            </div>
            {isPhaseComplete('semiFinals') && (
              <div className="text-center mt-8">
                <button 
                  onClick={advanceToNextPhase}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105"
                >
                  🏆 Passer à la Finale
                </button>
              </div>
            )}
          </section>
        )}

        {/* Finale et 3ème place */}
        {currentPhase === 'final' && (
          <section className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-yellow-600 mb-2">👑 Finale & Match pour la 3ème Place</h3>
              <p className="text-gray-600">Les matchs décisifs du tournoi</p>
            </div>
            <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto">
              <MatchCard 
                title="🥇 FINALE"
                match={results.final}
                phase="final"
                isActive={true}
              />
              <MatchCard 
                title="🥉 MATCH POUR LA 3ÈME PLACE"
                match={results.thirdPlace}
                phase="thirdPlace"
                isActive={true}
              />
            </div>
            {isPhaseComplete('final') && (
              <div className="text-center mt-8">
                <button 
                  onClick={() => {
                    generateBracket();
                    onClose();
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-12 py-4 rounded-xl font-bold text-xl shadow-lg transition-all transform hover:scale-105"
                >
                  🎉 Finaliser le Tournoi
                </button>
              </div>
            )}
          </section>
        )}

        <div className="flex gap-4 justify-center mt-8">
          <button 
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentResultsAdmin;