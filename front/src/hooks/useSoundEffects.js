// Hook pour jouer des sons d'effets
import { useCallback } from 'react';

export const useSoundEffects = () => {
  const playVictorySound = useCallback(() => {
    try {
      // Créer un son de victoire simple avec Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Créer une séquence de notes pour un son de victoire
      const playNote = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Mélodie de victoire simple
      const now = audioContext.currentTime;
      playNote(523.25, now, 0.2);        // C5
      playNote(659.25, now + 0.2, 0.2);  // E5
      playNote(783.99, now + 0.4, 0.2);  // G5
      playNote(1046.50, now + 0.6, 0.4); // C6
      
    } catch (error) {
      console.log('Impossible de jouer le son de victoire:', error);
    }
  }, []);

  const playConfettiSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Son de confettis (bruit blanc court)
      const bufferSize = audioContext.sampleRate * 0.1;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      
    } catch (error) {
      console.log('Impossible de jouer le son de confettis:', error);
    }
  }, []);

  return {
    playVictorySound,
    playConfettiSound
  };
};