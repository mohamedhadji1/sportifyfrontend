import { useCallback } from 'react';

export const useChampionsSounds = () => {
  // Créer des sons avec l'API Web Audio pour plus de contrôle
  const createAudioContext = () => {
    return new (window.AudioContext || window.webkitAudioContext)();
  };

  // Son de victoire Champions League
  const playVictoryFanfare = useCallback(() => {
    try {
      const audioContext = createAudioContext();
      
      // Créer une mélodie de victoire avec des oscillateurs
      const playNote = (frequency, startTime, duration, volume = 0.1) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Mélodie de victoire Champions League
      const now = audioContext.currentTime;
      const notes = [
        { freq: 523.25, time: 0, duration: 0.5 },    // Do
        { freq: 659.25, time: 0.3, duration: 0.5 },  // Mi
        { freq: 783.99, time: 0.6, duration: 0.5 },  // Sol
        { freq: 1046.5, time: 0.9, duration: 0.8 },  // Do aigu
      ];

      notes.forEach(note => {
        playNote(note.freq, now + note.time, note.duration, 0.15);
      });

    } catch (error) {
      console.log('Web Audio not supported:', error);
    }
  }, []);

  // Son d'explosion de confettis
  const playConfettiExplosion = useCallback(() => {
    try {
      const audioContext = createAudioContext();
      const now = audioContext.currentTime;

      // Créer un son d'explosion avec du bruit blanc
      const bufferSize = audioContext.sampleRate * 0.5; // 0.5 seconde
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = buffer.getChannelData(0);

      // Générer du bruit blanc avec envelope
      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.exp(-i / (bufferSize * 0.1)); // Décroissance exponentielle
        output[i] = (Math.random() * 2 - 1) * envelope * 0.1;
      }

      const bufferSource = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      bufferSource.buffer = buffer;
      bufferSource.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      bufferSource.start(now);
    } catch (error) {
      console.log('Confetti sound error:', error);
    }
  }, []);

  // Son de foule en délire
  const playCrowdCheer = useCallback(() => {
    try {
      const audioContext = createAudioContext();
      const now = audioContext.currentTime;

      // Simulation d'acclamations de foule
      for (let i = 0; i < 20; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Fréquences aléatoires pour simuler la foule
        const freq = 100 + Math.random() * 200;
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.type = 'sawtooth';
        
        const startTime = now + Math.random() * 2;
        const duration = 1 + Math.random() * 2;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, startTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      }
    } catch (error) {
      console.log('Crowd cheer error:', error);
    }
  }, []);

  // Son de tambour de cérémonie
  const playVictoryDrums = useCallback(() => {
    try {
      const audioContext = createAudioContext();
      const now = audioContext.currentTime;

      // Créer un rythme de tambour
      const createDrumBeat = (startTime) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(60, startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      };

      // Pattern de tambour : Boom-Boom-Clap
      const beats = [0, 0.3, 0.6, 1.2, 1.5, 1.8];
      beats.forEach(beat => {
        createDrumBeat(now + beat);
      });
    } catch (error) {
      console.log('Victory drums error:', error);
    }
  }, []);

  // Séquence complète de sons de victoire
  const playFullVictorySequence = useCallback(() => {
    playVictoryFanfare();
    
    setTimeout(() => {
      playConfettiExplosion();
      playCrowdCheer();
    }, 500);
    
    setTimeout(() => {
      playVictoryDrums();
    }, 1000);
    
    setTimeout(() => {
      playVictoryFanfare(); // Répéter la fanfare
    }, 2500);
  }, [playVictoryFanfare, playConfettiExplosion, playCrowdCheer, playVictoryDrums]);

  return {
    playVictoryFanfare,
    playConfettiExplosion,
    playCrowdCheer,
    playVictoryDrums,
    playFullVictorySequence
  };
};