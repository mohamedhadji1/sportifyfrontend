import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import MatchEditor from '../../features/tournaments/components/MatchEditor';
import ChampionAnimation from '../ChampionAnimation';
import TournamentAwards from '../../features/tournaments/components/TournamentAwards';

// Fonction pour normaliser et corriger les données du bracket du serveur
const normalizeBracketData = (serverBracket) => {
  console.log('🔧 BRACKET NORMALIZATION - Input data:', serverBracket);
  console.log('🔧 Input type:', typeof serverBracket);
  console.log('🔧 Input keys:', serverBracket ? Object.keys(serverBracket) : 'null/undefined');
  
  if (!serverBracket) {
    console.log('❌ No bracket data received from server');
    return null;
  }

  // Créer une structure normalisée
  const normalized = {
    quarterFinals: serverBracket.quarterFinals || serverBracket.quarterfinals || [],
    semiFinals: serverBracket.semiFinals || serverBracket.semifinals || [], // Le serveur peut utiliser semiFinals ou semifinals
    final: serverBracket.final || { team1: null, team2: null },
    thirdPlace: serverBracket.thirdPlace || serverBracket.thirdplace || { team1: null, team2: null }
  };

  console.log('🔧 After initial extraction:', {
    quarterFinalsCount: normalized.quarterFinals.length,
    semiFinalsCount: normalized.semiFinals.length,
    hasFinal: !!normalized.final,
    hasThirdPlace: !!normalized.thirdPlace
  });

  // Assurer que nous avons au moins 4 matchs de quarts de finale
  while (normalized.quarterFinals.length < 4) {
    normalized.quarterFinals.push({
      match: normalized.quarterFinals.length + 1,
      team1: null,
      team2: null,
      winner: null,
      status: 'pending'
    });
  }

  // Assurer que nous avons exactement 2 demi-finales
  while (normalized.semiFinals.length < 2) {
    normalized.semiFinals.push({
      match: normalized.semiFinals.length + 1,
      team1: null,
      team2: null,
      winner: null,
      status: 'pending'
    });
  }

  console.log('✅ BRACKET NORMALISÉ:', {
    quarters: normalized.quarterFinals.map(q => `${q.team1?.name || 'TBD'} vs ${q.team2?.name || 'TBD'} → ${q.winner?.name || 'TBD'}`),
    semis: normalized.semiFinals.map(s => `${s.team1?.name || 'TBD'} vs ${s.team2?.name || 'TBD'} → ${s.winner?.name || 'TBD'}`),
    final: `${normalized.final?.team1?.name || 'TBD'} vs ${normalized.final?.team2?.name || 'TBD'}`,
    thirdPlace: `${normalized.thirdPlace?.team1?.name || 'TBD'} vs ${normalized.thirdPlace?.team2?.name || 'TBD'}`
  });

  return normalized;
};



const TournamentBracket = ({ tournament, onTournamentComplete }) => {
  const { token, user } = useAuth();
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMatchEditor, setShowMatchEditor] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [showChampionAnimation, setShowChampionAnimation] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [champion, setChampion] = useState(null);
  const [podium, setPodium] = useState(null);

  const fetchBracket = useCallback(async (useCache = true) => {
    const cacheKey = `tournament_bracket_${tournament._id}`;
    
    // Essayer de charger depuis le cache localStorage
    if (useCache) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          // Vérifier si le cache n'est pas trop ancien (30 secondes pour plus de réactivité)
          const cacheAge = Date.now() - parsedData.timestamp;
          if (cacheAge < 30 * 1000) {
            console.log('✅ Loaded bracket from cache');
            let normalizedBracket = normalizeBracketData(parsedData.bracket);
            setBracket(normalizedBracket);
            if (parsedData.champion) {
              setChampion(parsedData.champion);
              setPodium(parsedData.podium);
            }
            setLoading(false);
            return;
          } else {
            console.log('⏰ Cache expired, fetching fresh data');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error loading from cache:', error);
      }
    }

    // Charger depuis l'API
    try {
      console.log('🌐 Fetching bracket from API for tournament:', tournament._id);
      const response = await fetch(`http://localhost:5006/api/tournaments/${tournament._id}/bracket`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response received:', data);
        console.log('📊 API Response structure:', {
          hasBracket: !!data.bracket,
          hasTournament: !!data.tournament,
          bracketKeys: data.bracket ? Object.keys(data.bracket) : [],
          tournamentKeys: data.tournament ? Object.keys(data.tournament) : [],
          rawData: JSON.stringify(data, null, 2)
        });
        
        // Try different possible response structures
        let bracketData = data.bracket || data.tournament?.bracket || data;
        console.log('🎯 Extracted bracket data:', bracketData);
        
        let normalizedBracket = normalizeBracketData(bracketData);
        
        if (normalizedBracket) {
          setBracket(normalizedBracket);
          
          // Vérifier le champion et podium
          if (data.tournament?.champion) {
            setChampion(data.tournament.champion);
            setPodium(data.tournament.podium);
          }
          
          // Sauvegarder dans le cache localStorage
          try {
            const cacheData = {
              bracket: normalizedBracket,
              champion: data.tournament?.champion,
              podium: data.tournament?.podium,
              timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log('💾 Bracket saved to cache');
          } catch (error) {
            console.warn('⚠️ Error saving to cache:', error);
          }
        } else {
          console.error('❌ Failed to normalize bracket data');
        }
      } else {
        console.error('❌ API Response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching bracket:', error);
    } finally {
      setLoading(false);
    }
  }, [tournament._id, token]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tournament) {
      fetchBracket();
    }
  }, [tournament, fetchBracket]);

  const handleMatchClick = (match, matchId) => {
    console.log('Match clicked:', match, matchId);
    console.log('User:', user);
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Tournament manager:', tournament.manager);
    
    // Check if match has both teams (do not allow editing empty matches)
    if (!match || !match.team1 || !match.team2) {
      console.log('Match not ready for editing - missing teams');
      alert('This match is not ready yet. Teams must be determined first.');
      return;
    }
    
    // Check localStorage token as fallback
    const storedToken = localStorage.getItem('token');
    console.log('Stored token:', storedToken ? 'Present' : 'Missing');
    
    // For development, allow any authenticated user to edit (check token OR user)
    if (user || token || storedToken) {
      console.log('✅ Opening match editor for:', matchId);
      setSelectedMatch(match);
      setSelectedMatchId(matchId);
      setShowMatchEditor(true);
    } else {
      console.log('❌ No authentication found');
      alert('You must be logged in to edit matches');
    }
  };

  const handleMatchUpdated = (result) => {
    console.log('🎯 Match updated result:', result);
    
    // Invalider le cache et rafraîchir depuis l'API
    const cacheKey = `tournament_bracket_${tournament._id}`;
    localStorage.removeItem(cacheKey);
    
    // Fermer l'éditeur de match immédiatement
    setShowMatchEditor(false);
    setSelectedMatch(null);
    setSelectedMatchId('');
    
    // Refresh bracket after match update avec délai réduit
    setTimeout(() => {
      console.log('🔄 Refreshing bracket after match update...');
      fetchBracket(false); // Force refresh from API
    }, 500); // Réduire le délai à 500ms
    
    // Ajouter une deuxième actualisation pour s'assurer d'avoir les dernières données
    setTimeout(() => {
      console.log('🔄 Second refresh to ensure latest data...');
      fetchBracket(false);
    }, 1500);
    
    // Vérifier si le tournoi est terminé et afficher l'animation du champion
    if (result.tournamentFinished && result.champion) {
      console.log('🏆 Tournament finished! Champion:', result.champion);
      setChampion(result.champion);
      setPodium(result.podium);
      setShowChampionAnimation(true);
      
      // Notify parent component that tournament is complete
      if (onTournamentComplete) {
        onTournamentComplete({
          ...tournament,
          champion: result.champion,
          podium: result.podium,
          status: 'completed'
        });
      }
    }
  };

  const refreshBracket = () => {
    console.log('🔄 Force refreshing bracket...');
    const cacheKey = `tournament_bracket_${tournament._id}`;
    localStorage.removeItem(cacheKey);
    setLoading(true);
    setBracket(null); // Clear current bracket
    fetchBracket(false); // Force fetch from API
  };

  // Suppression complète de la synchronisation avec TournamentResultsAdmin
  // Le bracket fonctionne maintenant de manière autonome et parfaite

  const isUserManager = () => {
    console.log('🔐 Checking if user is manager:');
    console.log('User:', user);
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? 'Present' : 'Missing');
    console.log('Tournament manager:', tournament.manager);
    console.log('User ID:', user?.id || user?._id);
    console.log('Manager ID:', tournament.manager);
    
    // Check localStorage token as fallback
    const storedToken = localStorage.getItem('token');
    console.log('📦 Stored token exists:', !!storedToken);
    
    // Pour le développement, permettre à tout utilisateur avec un token valide d'éditer
    if (token || storedToken || user) {
      console.log('✅ User is authenticated (token or user found), allowing edit access');
      return true;
    }
    
    // Production logic (commenté pour le moment)
    // return user && String(user.id || user._id) === String(tournament.manager);
    
    console.log('❌ No authentication found');
    return false;
  };

  const TeamCard = ({ team, size = 'normal', placeholder = false }) => {
    if (placeholder) {
      return (
        <div className={`bg-slate-800/40 border border-dashed border-slate-600/50 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-slate-700/40 backdrop-blur-sm ${
          size === 'large' ? 'p-4 h-14' : size === 'small' ? 'p-2 h-9' : 'p-3 h-11'
        }`}>
          <span className="text-slate-400 text-sm font-medium animate-pulse">TBD</span>
        </div>
      );
    }

    return (
      <div className={`bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600/50 rounded-lg shadow-lg backdrop-blur-sm flex items-center transition-all duration-300 hover:shadow-xl hover:border-cyan-500/50 hover:transform hover:scale-[1.02] hover:from-slate-700/90 hover:to-slate-600/90 ${
        size === 'large' ? 'p-3 h-12' : size === 'small' ? 'p-2 h-8' : 'p-2 h-10'
      }`}>
        {team?.logo && (
          <img
            src={team.logo}
            alt={team.name}
            className={`rounded-full mr-2 flex-shrink-0 transition-transform duration-300 hover:rotate-12 border-2 border-cyan-400/30 ${
              size === 'large' ? 'w-8 h-8' : size === 'small' ? 'w-5 h-5' : 'w-6 h-6'
            }`}
          />
        )}
        <span className={`font-semibold text-white truncate ${
          size === 'large' ? 'text-base' : size === 'small' ? 'text-xs' : 'text-sm'
        }`}>
          {team?.name || 'TBD'}
        </span>
      </div>
    );
  };

  const MatchCard = ({ match, title, size = 'normal', matchId }) => {
    const isEditable = isUserManager() && match?.team1 && match?.team2;
    const isCompleted = match?.status === 'completed';
    
    return (
      <div 
        className={`text-center transition-all duration-300 group ${
          isEditable ? 'cursor-pointer hover:transform hover:scale-[1.03]' : ''
        }`}
        onClick={() => {
          console.log('🖱️ Match card clicked:', { matchId, isEditable, match });
          if (isEditable) {
            handleMatchClick(match, matchId);
          } else if (!match?.team1 || !match?.team2) {
            console.log('⚠️ Match not ready - missing teams');
          } else {
            console.log('⚠️ User is not manager');
          }
        }}
      >
        {title && (
          <h4 className={`font-bold uppercase tracking-wider mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent ${
            size === 'large' ? 'text-sm' : 'text-xs'
          }`}>
            {title}
          </h4>
        )}
        <div className={`space-y-2 rounded-xl transition-all duration-300 ${
          isEditable ? 'hover:bg-slate-700/20 hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-400/50 border-2 border-slate-600/30' : 'border-2 border-transparent'
        } ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' : ''} p-3`}>
          <div className="relative">
            <TeamCard team={match?.team1} size={size} placeholder={!match?.team1} />
            {match?.team1?.score !== undefined && (
              <div className={`absolute -right-2 top-1/2 transform -translate-y-1/2 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg transition-all duration-300 ${
                match?.winner?.teamId === match?.team1?.teamId 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 animate-pulse scale-110' 
                  : 'bg-gradient-to-r from-slate-600 to-slate-700'
              }`}>
                {match.team1.score}
              </div>
            )}
          </div>
          <div className="text-center py-1">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest">VS</span>
          </div>
          <div className="relative">
            <TeamCard team={match?.team2} size={size} placeholder={!match?.team2} />
            {match?.team2?.score !== undefined && (
              <div className={`absolute -right-2 top-1/2 transform -translate-y-1/2 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg transition-all duration-300 ${
                match?.winner?.teamId === match?.team2?.teamId 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 animate-pulse scale-110' 
                  : 'bg-gradient-to-r from-slate-600 to-slate-700'
              }`}>
                {match.team2.score}
              </div>
            )}
          </div>
          
          {/* Enhanced Match Status */}
          {isCompleted && (
            <div className="text-xs text-emerald-400 font-semibold mt-2 flex items-center justify-center gap-1 animate-fade-in">
              <span className="animate-bounce">✓</span>
              <span>Completed</span>
            </div>
          )}
          
          {match?.winner && (
            <div className="text-xs text-yellow-600 font-bold mt-1 flex items-center justify-center gap-1 bg-yellow-100 rounded px-2 py-1">
              <span className="animate-bounce">🏆</span>
              <span>{match.winner.name}</span>
            </div>
          )}
          
          {isEditable && !isCompleted && (
            <div className="text-xs text-blue-600 font-bold transition-opacity duration-300 mt-2 bg-blue-100 rounded px-2 py-1 border border-blue-300 animate-pulse">
              <span>🖱️ CLICK TO EDIT</span>
            </div>
          )}
          
          {!match?.team1 || !match?.team2 ? (
            <div className="text-xs text-gray-400 font-medium mt-1">
              <span className="animate-pulse">⏳ Waiting...</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bracket...</p>
          <p className="text-xs text-gray-400 mt-2">Fetching data from server</p>
        </div>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">No bracket available</p>
          <button
            onClick={() => fetchBracket(false)}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Header - Compact */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-3xl animate-bounce">🏆</div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
            {tournament.name}
          </h2>
        </div>
        <p className="text-cyan-300 text-sm font-semibold mb-2">Knockout Tournament Bracket</p>
        <button
          onClick={refreshBracket}
          className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-cyan-500/50 hover:scale-105 mx-auto"
          title="Refresh bracket"
        >
          <span>🔄</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Tournament Bracket - Vertical Layout (No Horizontal Scroll) */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Final Match - Top */}
        <div>
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full p-4 shadow-xl">
                <div className="text-4xl">🏆</div>
              </div>
            </div>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-400/50 rounded-xl p-4 backdrop-blur-md shadow-xl">
              <MatchCard 
                match={bracket.final} 
                title="🏆 FINAL" 
                size="large"
                matchId="final"
              />
            </div>
          </div>
        </div>

        {/* Semifinals - Side by Side */}
        <div>
          <div className="flex justify-center items-center mb-3">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
            <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-xs text-cyan-300 font-semibold">
              SEMIFINALS
            </div>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-2 border-blue-400/50 rounded-xl p-3 backdrop-blur-md shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
              <MatchCard 
                match={bracket.semiFinals?.[0]} 
                title="⚔️ SEMI 1"
                size="normal"
                matchId="semiFinal_1"
              />
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-2 border-blue-400/50 rounded-xl p-3 backdrop-blur-md shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
              <MatchCard 
                match={bracket.semiFinals?.[1]} 
                title="⚔️ SEMI 2"
                size="normal"
                matchId="semiFinal_2"
              />
            </div>
          </div>
        </div>

        {/* Quarterfinals - 2x2 Grid */}
        <div>
          <div className="flex justify-center items-center mb-3">
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs text-emerald-300 font-semibold">
              QUARTERFINALS
            </div>
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
            {bracket.quarterFinals?.map((match, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-2 border-emerald-400/50 rounded-xl p-2.5 backdrop-blur-md shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
              >
                <MatchCard 
                  match={match} 
                  title={`Q${index + 1}`}
                  size="small"
                  matchId={`quarterFinal_${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Third Place Match */}
        {bracket.thirdPlace && (
          <div>
            <div className="flex justify-center items-center mb-3">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
              <div className="px-3 py-1 bg-orange-500/20 border border-orange-400/30 rounded-full text-xs text-orange-300 font-semibold">
                3RD PLACE
              </div>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-600/20 border-2 border-orange-400/50 rounded-xl p-4 backdrop-blur-md shadow-xl">
                <MatchCard 
                  match={bracket.thirdPlace} 
                  title="🥉 THIRD PLACE"
                  size="normal"
                  matchId="thirdPlace"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tournament Info Cards - Compact */}
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-700/20 border border-blue-400/30 rounded-xl p-3 text-center backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">8</div>
            <div className="text-xs text-slate-300 font-semibold">Teams</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/20 to-green-700/20 border border-emerald-400/30 rounded-xl p-3 text-center backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <div className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">7</div>
            <div className="text-xs text-slate-300 font-semibold">Matches</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-amber-700/20 border border-yellow-400/30 rounded-xl p-3 text-center backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <div className="text-3xl animate-bounce">🏆</div>
            <div className="text-xs text-slate-300 font-semibold">Winner</div>
          </div>
        </div>

        {/* Legend - Compact */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-2 text-xs">
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-white font-medium">Quarters</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 rounded-lg p-2 text-xs">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex-shrink-0"></div>
              <span className="text-white font-medium">Semis</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-blue-400/30 rounded-lg p-2 text-xs">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex-shrink-0"></div>
              <span className="text-white font-medium">Final</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-400/30 rounded-lg p-2 text-xs">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex-shrink-0"></div>
              <span className="text-white font-medium">3rd Place</span>
            </div>
          </div>
        </div>

        {/* Manager Instructions */}


        {/* View Awards Button */}
        {(champion || tournament.champion) && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAwards(true)}
              className="group px-6 py-3 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-500 hover:from-yellow-600 hover:via-amber-700 hover:to-yellow-600 text-white rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-yellow-500/50 hover:scale-105 border-2 border-yellow-400/50"
            >
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="hidden sm:inline">View Tournament Awards & Statistics</span>
              <span className="sm:hidden">View Awards</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Match Editor Modal */}
      {showMatchEditor && selectedMatch && (
        <MatchEditor
          tournament={tournament}
          match={selectedMatch}
          matchId={selectedMatchId}
          onClose={() => setShowMatchEditor(false)}
          onMatchUpdated={handleMatchUpdated}
        />
      )}

      {/* Modern Legend and Stats */}
      <div className="mt-8 space-y-6">
        {/* Tournament Legend - Modern Cards */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50">
          <h3 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
            <span>📊</span>
            <span>Tournament Stages</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3 hover:scale-105 transition-all duration-300">
              <div className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
              <span className="text-sm text-white font-medium">Quarterfinals</span>
            </div>
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 hover:scale-105 transition-all duration-300">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></div>
              <span className="text-sm text-white font-medium">Semifinals</span>
            </div>
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 hover:scale-105 transition-all duration-300">
              <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
              <span className="text-sm text-white font-medium">Final</span>
            </div>
            <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 hover:scale-105 transition-all duration-300">
              <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"></div>
              <span className="text-sm text-white font-medium">3rd Place</span>
            </div>
          </div>
        </div>

        {/* Tournament Statistics - Enhanced Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-700/20 border-2 border-blue-400/30 rounded-2xl p-6 text-center backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">8</div>
            <div className="text-sm text-slate-300 font-semibold">Teams</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/20 to-green-700/20 border-2 border-emerald-400/30 rounded-2xl p-6 text-center backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mb-2">7</div>
            <div className="text-sm text-slate-300 font-semibold">Matches</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-amber-700/20 border-2 border-yellow-400/30 rounded-2xl p-6 text-center backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <div className="text-sm text-slate-300 font-semibold">Champion</div>
          </div>
        </div>
      </div>

      {/* View Awards Button - Enhanced */}
      {(champion || tournament.champion) && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowAwards(true)}
            className="group px-10 py-5 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-500 hover:from-yellow-600 hover:via-amber-700 hover:to-yellow-600 text-white rounded-2xl font-bold text-xl transition-all duration-300 flex items-center gap-4 shadow-2xl hover:shadow-yellow-500/60 hover:scale-110 transform border-2 border-yellow-400/50"
          >
            <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>View Tournament Awards & Statistics</span>
            <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Match Editor Modal */}
      {showMatchEditor && selectedMatch && (
        <MatchEditor
          tournament={tournament}
          match={selectedMatch}
          matchId={selectedMatchId}
          onClose={() => setShowMatchEditor(false)}
          onMatchUpdated={handleMatchUpdated}
        />
      )}

      {/* Champion Animation */}
      <ChampionAnimation 
        champion={champion}
        podium={podium}
        isVisible={showChampionAnimation}
        onClose={() => {
          setShowChampionAnimation(false);
          // Show awards after champion animation closes
          setTimeout(() => setShowAwards(true), 500);
        }}
      />

      {/* Tournament Awards Modal */}
      <TournamentAwards
        tournament={tournament}
        isVisible={showAwards}
        onClose={() => setShowAwards(false)}
      />
    </div>
  );
};

export default TournamentBracket;