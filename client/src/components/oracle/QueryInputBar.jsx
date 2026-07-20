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
  const isQuerying = useNexusStore(s => s.isQuerying);
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
      

      <div style={{ background: "#FDFAF6", border: "1px solid #E2D9C8", borderRadius: "12px", padding: "12px", boxShadow: "0 4px 20px rgba(44,36,22,0.08)", margin: "12px 20px 20px", display: "flex", alignItems: "flex-end", gap: "8px" }}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={isQuerying}
          placeholder="Ask about equipment, procedures, compliance, or failures…"
          rows={1}
          style={{ background: "transparent", border: "none", outline: "none", color: "#2C2416", fontSize: "14px", lineHeight: "1.6", resize: "none", width: "100%", fontFamily: "inherit" }} className="min-h-[24px] max-h-[120px] disabled:opacity-60 placeholder:text-[#C4B49A]"
          style={{ scrollbarWidth: 'none' }}
        />

        

        {/* Actions row */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleSubmit}
            disabled={!text.trim() || isQuerying}
            className="btn-primary" style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyCenter: "center" }}
          >
            {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      
    </div>
  );
}
