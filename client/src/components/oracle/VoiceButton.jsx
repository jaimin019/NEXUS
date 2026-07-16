/**
 * VoiceButton — Full voice state machine for ORACLE.
 * States: 'idle' | 'listening' | 'processing' | 'speaking'
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Volume2, Square } from 'lucide-react';

const hasRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const hasSynthesis =
  typeof window !== 'undefined' && window.speechSynthesis;

export default function VoiceButton({ onTranscript, answerToSpeak, onSpeakDone, disabled }) {
  const [voiceState, setVoiceState] = useState('idle'); // idle | listening | processing | speaking
  const [interimText, setInterimText] = useState('');
  const [waveHeights, setWaveHeights] = useState([30, 50, 40, 60, 35]);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const waveIntervalRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Animate waveform while listening
  useEffect(() => {
    if (voiceState === 'listening') {
      waveIntervalRef.current = setInterval(() => {
        setWaveHeights([
          Math.random() * 30 + 10,
          Math.random() * 40 + 20,
          Math.random() * 50 + 15,
          Math.random() * 40 + 20,
          Math.random() * 30 + 10,
        ]);
      }, 100);
    } else {
      clearInterval(waveIntervalRef.current);
      setWaveHeights([30, 50, 40, 60, 35]);
    }
    return () => clearInterval(waveIntervalRef.current);
  }, [voiceState]);

  // When an answer comes in while in processing state, speak it
  useEffect(() => {
    if (answerToSpeak && voiceState === 'processing' && hasSynthesis) {
      speakAnswer(answerToSpeak);
    }
  }, [answerToSpeak, voiceState]);

  const speakAnswer = useCallback((text) => {
    if (!hasSynthesis) return;
    window.speechSynthesis.cancel();
    setVoiceState('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    // Prefer female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
    ) || voices.find((v) => v.lang.startsWith('en'));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => {
      setVoiceState('idle');
      if (onSpeakDone) onSpeakDone();
    };
    utterance.onerror = () => setVoiceState('idle');

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [onSpeakDone]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setVoiceState('idle');
  };

  const startListening = useCallback(() => {
    if (!hasRecognition) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setVoiceState('listening');
      setInterimText('');
    };

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setInterimText(interim || final);
      if (final) {
        setVoiceState('processing');
        setInterimText('');
        if (onTranscript) onTranscript(final.trim());
      }
    };

    recognition.onerror = (e) => {
      console.warn('[voice] recognition error:', e.error);
      setVoiceState('idle');
      setInterimText('');
    };

    recognition.onend = () => {
      if (voiceState === 'listening') setVoiceState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript, voiceState]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setVoiceState('idle');
    setInterimText('');
  };

  const handleClick = () => {
    if (disabled && voiceState === 'idle') return;
    if (voiceState === 'idle') startListening();
    else if (voiceState === 'listening') stopListening();
    else if (voiceState === 'speaking') stopSpeaking();
  };

  // Button appearance
  const getButtonStyle = () => {
    if (voiceState === 'listening') return 'bg-red-500/20 border-red-500 text-red-400';
    if (voiceState === 'processing') return 'bg-cyan-500/20 border-cyan-500 text-cyan-400';
    if (voiceState === 'speaking') return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
    return 'bg-nexus-surface border-nexus-border text-nexus-muted hover:text-nexus-text hover:border-nexus-primary/50';
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Interim transcript bubble */}
      <AnimatePresence>
        {interimText && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-2 glass-card glow-border px-3 py-2 text-xs text-nexus-text
              max-w-[200px] text-center whitespace-nowrap overflow-hidden text-ellipsis z-10"
          >
            "{interimText}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* No SpeechRecognition tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-2 glass-card border border-amber-500/30 px-3 py-2
              text-xs text-amber-300 whitespace-nowrap z-10"
          >
            Voice input requires Chrome or Edge
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waveform (listening state) */}
      <AnimatePresence>
        {voiceState === 'listening' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-full mb-2 flex items-end gap-0.5 h-8"
          >
            {waveHeights.map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: h }}
                transition={{ duration: 0.1, ease: 'easeInOut' }}
                className="w-1 bg-red-400 rounded-full"
                style={{ height: h }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        disabled={disabled && voiceState === 'idle'}
        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 ${getButtonStyle()}
          disabled:opacity-40 disabled:cursor-not-allowed relative`}
        title={
          voiceState === 'listening' ? 'Click to stop listening'
            : voiceState === 'speaking' ? 'Click to stop speaking'
            : !hasRecognition ? 'Voice requires Chrome or Edge'
            : 'Click to speak'
        }
      >
        {/* Pulsing ring while listening */}
        {voiceState === 'listening' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-500"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        {voiceState === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
        {voiceState === 'speaking' && <Volume2 className="w-4 h-4" />}
        {(voiceState === 'listening') && <Mic className="w-4 h-4" />}
        {voiceState === 'idle' && <Mic className="w-4 h-4" />}
      </motion.button>

      {/* Speaking label */}
      {voiceState === 'speaking' && (
        <span className="text-[10px] text-emerald-400 mt-0.5 whitespace-nowrap">Speaking…</span>
      )}
    </div>
  );
}
