import React, { useEffect, useState } from 'react';
import './ChampionAnimationSimple.css';

const ChampionAnimation = ({ champion, podium, isVisible, onClose }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showPodium, setShowPodium] = useState(false);

  // Configuration du prize pool et calculs automatiques
  const prizePool = 10000; // Prize pool total en euros
  const prizeCalculation = {
    first: Math.round(prizePool * 0.6), // 60%
    second: Math.round(prizePool * 0.3), // 30%
    third: Math.round(prizePool * 0.1) // 10%
  };

  // Créer un podium cohérent en cas de données incohérentes
  const normalizedPodium = podium || {
    first: champion,
    second: null,
    third: null
  };

  console.log('🏆 ChampionAnimation - Champion:', champion);
  console.log('🥇 ChampionAnimation - Podium:', normalizedPodium);
  console.log('💰 ChampionAnimation - Prize calculation:', prizeCalculation);

  // Fonction pour gérer la fin de la vidéo
  const handleVideoEnd = () => {
    console.log('🎬 Video ended, showing podium');
    setShowVideo(false);
    setShowPodium(true);
  };

  // Fonction pour gérer les erreurs vidéo
  const handleVideoError = (e) => {
    console.error('Video error:', e);
    console.log('🎬 Video error, showing podium directly');
    setShowVideo(false);
    setShowPodium(true);
  };

  useEffect(() => {
    if (isVisible) {
      console.log('🎯 Champion animation started');
      // Démarrer la vidéo immédiatement
      setShowVideo(true);
      setShowPodium(false);
    } else {
      setShowVideo(false);
      setShowPodium(false);
    }
  }, [isVisible]);

  if (!isVisible || !champion) return null;

  return (
    <div className="champion-overlay">
      {/* Vidéo d'intro */}
      {showVideo && (
        <div className="video-container">
          <video
            autoPlay
            muted
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          >
            <source src="/intro.mp4" type="video/mp4" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
          
          {/* Bouton pour passer la vidéo */}
          <button 
            className="skip-video-button"
            onClick={handleVideoEnd}
            title="Passer la vidéo"
          >
            Passer ⏭️
          </button>
        </div>
      )}

      {/* Podium Simple après la vidéo */}
      {showPodium && (
        <div className="simple-podium-container">
          <div className="podium-header">
            <h1 className="podium-title">🏆 FÉLICITATIONS ! 🏆</h1>
            <h2 className="champion-name">{champion.name}</h2>
            <p className="champion-subtitle">Nouveaux Champions du Tournoi</p>
          </div>

          {/* Podium visuel */}
          <div className="podium-display">
            {/* Deuxième place */}
            {normalizedPodium.second && (
              <div className="podium-position second-place">
                <div className="position-medal">🥈</div>
                <div className="position-team">
                  {normalizedPodium.second.logo ? (
                    <img src={normalizedPodium.second.logo} alt={normalizedPodium.second.name} />
                  ) : (
                    <div className="default-logo">⚽</div>
                  )}
                  <span>{normalizedPodium.second.name}</span>
                </div>
                <div className="position-step second-step">2</div>
                <div className="position-prize">{prizeCalculation.second.toLocaleString()}€</div>
              </div>
            )}

            {/* Première place */}
            <div className="podium-position first-place">
              <div className="position-medal">🥇</div>
              <div className="position-team">
                {champion.logo ? (
                  <img src={champion.logo} alt={champion.name} />
                ) : (
                  <div className="default-logo">⚽</div>
                )}
                <span>{champion.name}</span>
              </div>
              <div className="position-step first-step">1</div>
              <div className="position-prize">{prizeCalculation.first.toLocaleString()}€</div>
            </div>

            {/* Troisième place */}
            {normalizedPodium.third && (
              <div className="podium-position third-place">
                <div className="position-medal">🥉</div>
                <div className="position-team">
                  {normalizedPodium.third.logo ? (
                    <img src={normalizedPodium.third.logo} alt={normalizedPodium.third.name} />
                  ) : (
                    <div className="default-logo">⚽</div>
                  )}
                  <span>{normalizedPodium.third.name}</span>
                </div>
                <div className="position-step third-step">3</div>
                <div className="position-prize">{prizeCalculation.third.toLocaleString()}€</div>
              </div>
            )}
          </div>

          {/* Informations sur les prix */}
          <div className="prize-info">
            <h3>💰 Distribution des Prix - Total: {prizePool.toLocaleString()}€</h3>
          </div>
        </div>
      )}

      {/* Bouton Fermer */}
      <button className="close-button" onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

export default ChampionAnimation;