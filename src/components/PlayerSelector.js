import React, { useState, useEffect } from 'react';
import usePlayersAPI from '../hooks/usePlayersAPI';

const PlayerSelector = ({ 
  team1Id, 
  team2Id, 
  onPlayerSelect, 
  selectedPlayers = [], 
  label = "Sélectionner un joueur",
  allowMultiple = false 
}) => {
  const { getMatchTeamsPlayers, isLoading } = usePlayersAPI();
  const [teamsData, setTeamsData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (team1Id && team2Id) {
      loadTeamsPlayers();
    }
  }, [team1Id, team2Id]);

  const loadTeamsPlayers = async () => {
    try {
      const data = await getMatchTeamsPlayers(team1Id, team2Id);
      if (data) {
        setTeamsData(data);
      }
    } catch (error) {
      console.error('Error loading teams players:', error);
    }
  };

  const handlePlayerSelect = (player) => {
    if (allowMultiple) {
      const isSelected = selectedPlayers.some(p => p._id === player._id);
      if (isSelected) {
        // Désélectionner
        onPlayerSelect(selectedPlayers.filter(p => p._id !== player._id));
      } else {
        // Ajouter
        onPlayerSelect([...selectedPlayers, player]);
      }
    } else {
      onPlayerSelect(player);
      setIsOpen(false);
    }
  };

  const isPlayerSelected = (player) => {
    return selectedPlayers.some(p => p._id === player._id);
  };

  const getPlayerDisplayName = (player) => {
    return `#${player.jerseyNumber} ${player.name} (${player.position})`;
  };

  const getSelectedDisplayText = () => {
    if (selectedPlayers.length === 0) {
      return label;
    }
    
    if (allowMultiple) {
      return `${selectedPlayers.length} joueur(s) sélectionné(s)`;
    } else {
      return getPlayerDisplayName(selectedPlayers[0] || selectedPlayers);
    }
  };

  if (isLoading) {
    return (
      <div className="player-selector loading">
        <div className="loading-spinner">Chargement des joueurs...</div>
      </div>
    );
  }

  if (!teamsData) {
    return (
      <div className="player-selector error">
        <div className="error-message">Erreur lors du chargement des joueurs</div>
      </div>
    );
  }

  return (
    <div className="player-selector">
      <div 
        className={`selector-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="selected-text">{getSelectedDisplayText()}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="dropdown-content">
          {/* Équipe 1 */}
          <div className="team-section">
            <div className="team-header">
              <img 
                src={teamsData.team1.info.logo || '/placeholder-logo.png'} 
                alt={teamsData.team1.info.name}
                className="team-logo"
              />
              <span className="team-name">{teamsData.team1.info.name}</span>
            </div>
            <div className="players-list">
              {teamsData.team1.players.map(player => (
                <div
                  key={player._id}
                  className={`player-option ${isPlayerSelected(player) ? 'selected' : ''}`}
                  onClick={() => handlePlayerSelect(player)}
                >
                  <span className="player-number">#{player.jerseyNumber}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-position">{player.position}</span>
                  {isPlayerSelected(player) && <span className="checkmark">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Équipe 2 */}
          <div className="team-section">
            <div className="team-header">
              <img 
                src={teamsData.team2.info.logo || '/placeholder-logo.png'} 
                alt={teamsData.team2.info.name}
                className="team-logo"
              />
              <span className="team-name">{teamsData.team2.info.name}</span>
            </div>
            <div className="players-list">
              {teamsData.team2.players.map(player => (
                <div
                  key={player._id}
                  className={`player-option ${isPlayerSelected(player) ? 'selected' : ''}`}
                  onClick={() => handlePlayerSelect(player)}
                >
                  <span className="player-number">#{player.jerseyNumber}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-position">{player.position}</span>
                  {isPlayerSelected(player) && <span className="checkmark">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .player-selector {
          position: relative;
          width: 100%;
          margin-bottom: 1rem;
        }

        .selector-button {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .selector-button:hover {
          border-color: #007bff;
        }

        .selector-button.open {
          border-color: #007bff;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }

        .selected-text {
          flex: 1;
          color: #333;
        }

        .dropdown-arrow {
          color: #666;
          font-size: 0.8rem;
        }

        .dropdown-content {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #007bff;
          border-top: none;
          border-radius: 0 0 8px 8px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .team-section {
          border-bottom: 1px solid #e1e5e9;
        }

        .team-section:last-child {
          border-bottom: none;
        }

        .team-header {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          background: #f8f9fa;
          border-bottom: 1px solid #e1e5e9;
          font-weight: bold;
        }

        .team-logo {
          width: 24px;
          height: 24px;
          margin-right: 0.5rem;
          border-radius: 50%;
        }

        .team-name {
          color: #333;
        }

        .players-list {
          max-height: 150px;
          overflow-y: auto;
        }

        .player-option {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid #f1f3f4;
        }

        .player-option:hover {
          background-color: #f8f9fa;
        }

        .player-option.selected {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .player-number {
          font-weight: bold;
          margin-right: 0.5rem;
          min-width: 30px;
        }

        .player-name {
          flex: 1;
          margin-right: 0.5rem;
        }

        .player-position {
          font-size: 0.8rem;
          color: #666;
          background: #e1e5e9;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          margin-right: 0.5rem;
        }

        .checkmark {
          color: #4caf50;
          font-weight: bold;
        }

        .loading, .error {
          padding: 1rem;
          text-align: center;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .loading-spinner {
          color: #666;
        }

        .error-message {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default PlayerSelector;