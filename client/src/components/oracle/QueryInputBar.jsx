/**
 * QueryInputBar — Bottom input with text, voice, and camera.
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Camera, Loader2, X } from 'lucide-react';
import VoiceButton from './VoiceButton';
import useNexusStore from '@/store/nexusStore';

export default function QueryInputBar({ onSubmit, onVoiceTranscript, answerToSpeak, onSpeakDone }) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const { isQuerying } = useNexusStore();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Auto-resize textarea
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = useCallback(() => {
    const q = text.trim();
    if (!q || isQuerying) return;
    setText('');
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSubmit(q);
  }, [text, isQuerying, onSubmit]);

  const handleVoiceTranscript = (transcript) => {
    setText(transcript);
    if (onVoiceTranscript) onVoiceTranscript(transcript);
    // Auto submit after voice
    setTimeout(() => {
      if (transcript.trim()) {
        onSubmit(transcript.trim());
        setText('');
      }
    }, 400);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      setText('Identify equipment in this image and retrieve related documentation');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-2">
      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 relative inline-block"
          >
            <img
              src={imagePreview}
              alt="Upload preview"
              className="h-16 w-auto rounded-lg border border-nexus-border object-cover"
            />
            <button
              onClick={() => { setImagePreview(null); setText(''); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white
                flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input container */}
      <div className="glass-card glow-border flex items-end gap-2 px-3 py-2.5">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={isQuerying}
          placeholder="Ask about equipment, procedures, compliance, or failures…"
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-nexus-text
            placeholder:text-nexus-muted leading-relaxed min-h-[24px] max-h-[120px]
            disabled:opacity-60 py-0.5"
          style={{ scrollbarWidth: 'none' }}
        />

        {/* Hidden camera input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Actions row */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
          {/* Camera */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isQuerying}
            className="w-9 h-9 rounded-full border border-nexus-border flex items-center justify-center
              text-nexus-muted hover:text-nexus-text hover:border-nexus-primary/50 transition-all disabled:opacity-40"
            title="Upload equipment image"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Voice */}
          <VoiceButton
            onTranscript={handleVoiceTranscript}
            answerToSpeak={answerToSpeak}
            onSpeakDone={onSpeakDone}
            disabled={isQuerying}
          />

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleSubmit}
            disabled={!text.trim() || isQuerying}
            className="w-9 h-9 rounded-full bg-nexus-primary hover:bg-nexus-primaryHover disabled:opacity-40
              disabled:cursor-not-allowed flex items-center justify-center text-white transition-all"
          >
            {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      <p className="text-[10px] text-nexus-muted mt-1.5 px-1">
        Press <kbd className="px-1 py-0.5 bg-nexus-surface rounded border border-nexus-border text-[9px]">Enter</kbd> to send ·{' '}
        <kbd className="px-1 py-0.5 bg-nexus-surface rounded border border-nexus-border text-[9px]">Shift+Enter</kbd> for newline
      </p>
    </div>
  );
}
