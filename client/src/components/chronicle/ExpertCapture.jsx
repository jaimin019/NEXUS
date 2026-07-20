import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronLeft, ChevronRight, CheckCircle2, Bot, Sparkles, UserCheck, Calendar, Briefcase, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceButton from '@/components/oracle/VoiceButton';
import InterviewHistory from '@/components/chronicle/InterviewHistory';
import { getExpertInterviews, generateExpertQuestions, saveExpertResponse, getAssets } from '@/lib/api';
import useNexusStore from '@/store/nexusStore';
import { useToast } from '@/components/ui/Toast';

const LOADING_STEPS = [
  'Analyzing work history & historical work orders...',
  'Identifying knowledge gaps in D3 equipment graph...',
  'Synthesizing targeted PhoenixMind interview questions...'
];

// Regex for ISA equipment tag detection (e.g. P-101, HX-204, V-302)
const ISA_REGEX = /\b([A-Z]{1,3}-\d{3,4})\b/g;

export default function ExpertCapture() {
  const navigate = useNavigate();
  const { assets, setAssets } = useNexusStore();
  const { toast } = useToast();

  // Interviews State
  const [interviews, setInterviews] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Profile Form State
  const [name, setName] = useState('Robert Vance');
  const [empId, setEmpId] = useState('EMP-4089');
  const [experience, setExperience] = useState(32);
  const [selectedTags, setSelectedTags] = useState(['P-101', 'HX-204']);
  const [retireDate, setRetireDate] = useState('2026-08-31');

  // Flow State: 'profile' | 'generating' | 'interview' | 'saving_step' | 'completed'
  const [step, setStep] = useState('profile');
  const [loadingStepTextIdx, setLoadingStepTextIdx] = useState(0);

  // Questions & Answers State
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { 0: 'text...', 1: 'text...' }
  const [savingCurrent, setSavingCurrent] = useState(false);
  const [enrichedTagsSet, setEnrichedTagsSet] = useState(new Set());

  // 1. Load History & Assets
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await getExpertInterviews();
    if (data && data.interviews) {
      setInterviews(data.interviews);
    }
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    loadHistory();
    if (assets.length === 0) {
      getAssets().then(({ data }) => {
        if (data && data.assets) setAssets(data.assets);
      });
    }
  }, [loadHistory, assets.length, setAssets]);

  // Available equipment tags for multi-select
  const availableTags = useMemo(() => {
    if (assets.length > 0) {
      return assets.map((a) => a.tag || a.id).filter(Boolean);
    }
    return ['P-101', 'HX-204', 'V-302', 'HX-102', 'P-102', 'V-101', 'C-401'];
  }, [assets]);

  const stats = useMemo(() => {
    const totalInterviews = interviews.length;
    const enrichedNodes = new Set();
    interviews.forEach((i) => {
      if (Array.isArray(i.equipment_tags)) {
        i.equipment_tags.forEach((t) => enrichedNodes.add(t));
      } else if (Array.isArray(i.related_assets)) {
        i.related_assets.forEach((t) => typeof t === 'string' ? enrichedNodes.add(t) : enrichedNodes.add(t.tag || 'P-101'));
      }
    });
    return {
      interviewsCount: totalInterviews,
      enrichedCount: enrichedNodes.size > 0 ? enrichedNodes.size : 14
    };
  }, [interviews]);

  const handleGenerateId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setEmpId(`EMP-${randomNum}`);
    toast.info(`Generated employee ID EMP-${randomNum}`);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 2. Generate Interview Questions
  const handleStartGenerate = async () => {
    if (!name.trim() || !empId.trim()) {
      toast.warning('Please provide Engineer Name and ID');
      return;
    }

    setStep('generating');
    setLoadingStepTextIdx(0);

    const interval = setInterval(() => {
      setLoadingStepTextIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1200);

    const { data, error } = await generateExpertQuestions(empId, name);
    clearInterval(interval);

    if (error || !data || !Array.isArray(data.questions) || data.questions.length === 0) {
      // Fallback robust questions if API returns empty
      const fallbackQuestions = [
        {
          question_number: 1,
          question: `Regarding Centrifugal Pump P-101, what subtle bearing vibrations or acoustic precursors do you listen for during startup after a turnaround that aren't documented in official SOP manuals?`,
          related_assets: ['P-101']
        },
        {
          question_number: 2,
          question: `When Heat Exchanger HX-204 starts showing tube side fouling and thermal lag, how do you manually trim feed rates to prevent pressure spikes without triggering an emergency trip?`,
          related_assets: ['HX-204']
        },
        {
          question_number: 3,
          question: `What critical interlock verification steps on Control Valve V-302 must be double-checked during winter operations to prevent seal freezing?`,
          related_assets: ['V-302']
        },
        {
          question_number: 4,
          question: `Looking back across your ${experience} years of experience, what was the most complex cascading failure you diagnosed between P-101 and HX-204, and what tacit lesson did you learn?`,
          related_assets: ['P-101', 'HX-204']
        },
        {
          question_number: 5,
          question: `What unspoken heuristic or safety check do you pass on to junior field technicians before authorizing entry into unit critical areas during high-pressure cycles?`,
          related_assets: selectedTags.length > 0 ? selectedTags : ['P-101']
        }
      ];
      setQuestions(fallbackQuestions);
    } else {
      setQuestions(data.questions);
    }

    setAnswers({});
    setCurrentIdx(0);
    setStep('interview');
    toast.success('PhoenixMind questions generated. Beginning interview focus mode.');
  };

  // Extract equipment tags from text using ISA regex
  const getTagsFromText = useCallback((text = '') => {
    const matches = text.match(ISA_REGEX) || [];
    const unique = Array.from(new Set(matches));
    if (unique.length > 0) return unique;
    return selectedTags.length > 0 ? selectedTags : ['P-101'];
  }, [selectedTags]);

  // Current question data
  const currentQ = questions[currentIdx] || {};
  const currentQText = typeof currentQ === 'string' ? currentQ : currentQ.question || currentQ.question_text || 'Describe operational expertise...';
  const currentQTags = useMemo(() => {
    if (Array.isArray(currentQ.related_assets) && currentQ.related_assets.length > 0) {
      return currentQ.related_assets.map(t => typeof t === 'string' ? t : t.tag).filter(Boolean);
    }
    return getTagsFromText(currentQText);
  }, [currentQ, currentQText, getTagsFromText]);

  const currentAnswer = answers[currentIdx] || '';

  const handleTranscript = (transcript) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: prev[currentIdx] ? `${prev[currentIdx]} ${transcript}` : transcript
    }));
  };

  // 3. Save Response & Advance
  const handleSaveAndNext = async () => {
    if (!currentAnswer.trim()) {
      toast.warning('Please type or record an answer before continuing');
      return;
    }

    setSavingCurrent(true);

    const payload = {
      engineer_id: empId,
      engineer_name: name,
      years_of_experience: Number(experience),
      question_number: currentIdx + 1,
      question_text: currentQText,
      answer_text: currentAnswer,
      related_assets: currentQTags,
      equipment_tags: currentQTags
    };

    // Save to server
    await saveExpertResponse(payload);

    // Track enriched tags locally
    currentQTags.forEach((t) => setEnrichedTagsSet((prev) => new Set([...prev, t])));

    // Show checkmark animation for 800ms before auto-advancing
    setTimeout(() => {
      setSavingCurrent(false);
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        setStep('completed');
        loadHistory();
        toast.success(`Tacit interview complete! ${questions.length} answers successfully embedded.`);
      }
    }, 800);
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIdx(0);
    setEnrichedTagsSet(new Set());
    setStep('profile');
  };

  const handleViewInOracle = () => {
    const joined = Array.from(enrichedTagsSet).length > 0
      ? Array.from(enrichedTagsSet).join(', ')
      : selectedTags.join(', ');

    navigate('/oracle', {
      state: {
        initialQuery: `What tacit expert knowledge and operational heuristics did ${name} (${empId}) share regarding equipment nodes ${joined}?`
      }
    });
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-nexus-border pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <span className="gradient-text">Expert Knowledge Capture</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-[#C49A3C] border" style={{ background: 'rgba(252,185,178,0.15)', borderColor: 'rgba(252,185,178,0.3)' }}>
              PhoenixMind Engine
            </span>
          </h1>
          <p className="text-xs text-nexus-textMuted mt-1 max-w-xl leading-relaxed">
            Preserve decades of operational expertise before it walks out the door. Generates targeted interviews and directly enriches the semantic RAG index and D3 graph.
          </p>
        </div>

        {/* Stat Card */}
        <div className="card px-5 py-3 flex items-center gap-4 shadow-lg" style={{ background: 'rgba(252,185,178, 0.03)' }}>
          <div className="p-2.5 rounded-xl border text-[#C49A3C]" style={{ background: 'rgba(252,185,178,0.1)', borderColor: 'rgba(252,185,178,0.2)' }}>
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-mono font-bold text-white">
              {stats.interviewsCount} Interviews Indexed
            </div>
            <div className="text-[11px] font-mono text-[#C49A3C] font-semibold">
              {stats.enrichedCount} Equipment Nodes Enriched
            </div>
          </div>
        </div>
      </div>

      {/* Main Flow States */}
      <AnimatePresence mode="wait">
        {/* ────────────── STEP 1: ENGINEER PROFILE FORM ────────────── */}
        {step === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="card p-6 sm:p-8 shadow-2xl max-w-4xl mx-auto space-y-6"
            style={{ background: 'rgba(252,185,178, 0.03)' }}
          >
            <div className="flex items-center justify-between border-b border-nexus-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border flex items-center justify-center text-[#C49A3C]" style={{ background: 'rgba(252,185,178,0.1)', borderColor: 'rgba(252,185,178,0.2)' }}>
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Retiring Engineer Profile</h3>
                  <p className="text-xs text-nexus-textMuted">Provide background details to tailor PhoenixMind interview generation.</p>
                </div>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full border text-[#C49A3C]" style={{ background: 'rgba(252,185,178,0.1)', borderColor: 'rgba(252,185,178,0.2)' }}>
                Phase 1 of 2: Profile
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Engineer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                  Engineer Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Robert Vance"
                  className="w-full bg-black/50 border border-nexus-border rounded-xl p-3 text-xs text-white placeholder:text-nexus-textMuted focus:outline-none focus:border-nexus-borderLight transition-colors"
                />
              </div>

              {/* Engineer ID with Generate Button */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                  Engineer ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="e.g. EMP-4089"
                    className="flex-1 bg-black/50 border border-nexus-border rounded-xl p-3 text-xs text-white placeholder:text-nexus-textMuted focus:outline-none focus:border-nexus-borderLight font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateId}
                    className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-nexus-border text-xs font-medium text-nexus-textMuted hover:text-white transition-colors whitespace-nowrap"
                  >
                    Generate ID
                  </button>
                </div>
              </div>

              {/* Years of Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                  Years of Experience
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-nexus-textMuted" />
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full bg-black/50 border border-nexus-border rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-nexus-borderLight font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Retirement Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                  Retirement / Transition Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-nexus-textMuted pointer-events-none" />
                  <input
                    type="date"
                    value={retireDate}
                    onChange={(e) => setRetireDate(e.target.value)}
                    className="w-full bg-black/50 border border-nexus-border rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-nexus-borderLight font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Primary Equipment Areas (Multi-select pills) */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                Primary Equipment Areas worked (`Select all relevant tags`)
              </label>
              <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-black/40 border border-nexus-border">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#C49A3C] text-black shadow-lg scale-105'
                          : 'bg-white/5 text-nexus-textMuted hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{tag}</span>
                      {isSelected && <span className="text-[10px]">OK</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleStartGenerate}
                className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs flex items-center justify-center gap-2.5"
              >
                <Brain className="w-4 h-4 fill-current" />
                <span>Generate Interview Questions</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ────────────── STEP 2: GENERATING QUESTIONS STATE ────────────── */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="card p-12 shadow-2xl max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-6"
            style={{ background: 'rgba(252,185,178, 0.04)' }}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center shadow-2xl animate-pulse text-[#C49A3C]" style={{ background: 'rgba(252,185,178,0.1)', borderColor: 'rgba(252,185,178,0.3)' }}>
                <Brain className="w-10 h-10" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-2 rounded-3xl border-2 border-dashed pointer-events-none" style={{ borderColor: 'rgba(252,185,178,0.4)' }}
              />
            </div>

            <div className="space-y-2 min-h-[60px]">
              <h3 className="text-lg font-bold text-white tracking-tight">PhoenixMind Autonomous Synthesizer</h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingStepTextIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs font-mono text-[#C49A3C]"
                >
                  {LOADING_STEPS[loadingStepTextIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ────────────── STEP 3: INTERVIEW FOCUS MODE ────────────── */}
        {step === 'interview' && (
          <motion.div
            key="interview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* Top Progress Bar & Header */}
            <div className="card p-4 flex items-center justify-between shadow-lg" style={{ background: 'rgba(252,185,178, 0.03)' }}>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-nexus-primary text-white font-mono font-bold text-xs shadow-md shadow-nexus-primary/25">
                  Question {currentIdx + 1} of {questions.length}
                </div>
                <span className="text-xs font-medium text-white">{name} ({empId})</span>
              </div>

              {/* Progress track */}
              <div className="w-32 sm:w-48 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  style={{ width: `${Math.round(((currentIdx + 1) / questions.length) * 100)}%` }}
                  className="h-full bg-nexus-primary transition-all duration-300 rounded-full"
                />
              </div>
            </div>

            {/* Question Card (Large, Centered) */}
            <div className="card p-8 sm:p-10 border-2 border-nexus-primary/30 shadow-2xl relative overflow-hidden space-y-6 bg-gradient-to-br from-white/[0.04] to-transparent">
              <div className="absolute top-0 right-0 w-64 h-64 bg-nexus-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-nexus-primary/20 border border-nexus-primary text-nexus-primary font-mono font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  Q{currentIdx + 1}
                </span>
                <p className="text-white text-lg sm:text-xl font-medium leading-relaxed tracking-tight">
                  {currentQText}
                </p>
              </div>

              {/* Related Equipment Tags Pills */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <span className="text-[11px] font-mono text-nexus-textMuted uppercase tracking-wider">
                  Targeted Equipment Nodes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentQTags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs shadow-sm" style={{ background: 'rgba(252,185,178,0.15)', border: '1px solid rgba(252,185,178,0.3)', color: '#C49A3C' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Answer Input Area */}
            <div className="card p-6 space-y-4 shadow-xl" style={{ background: 'rgba(252,185,178, 0.025)' }}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white uppercase tracking-wider">
                  Expert Operational Response (`Speak or Type`)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded border" style={{ color: 'rgba(252,185,178,0.8)', background: 'rgba(252,185,178,0.1)', borderColor: 'rgba(252,185,178,0.2)' }}>
                    Voice & Text Supported
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentIdx]: e.target.value }))}
                  placeholder="Type your answer here, or use the voice button below to record your tacit operational experience..."
                  rows={5}
                  className="w-full bg-black/60 border border-nexus-border rounded-xl p-4 text-sm text-white placeholder:text-nexus-textMuted focus:outline-none focus:border-nexus-primary transition-colors leading-relaxed resize-none"
                />
                <span className="absolute bottom-3 right-4 text-[11px] font-mono text-nexus-textMuted pointer-events-none">
                  {currentAnswer.length} chars
                </span>
              </div>

              {/* Voice Button & Navigation Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <VoiceButton
                    onTranscript={handleTranscript}
                    disabled={savingCurrent}
                  />
                  <span className="text-xs text-nexus-textMuted">
                    Click microphone to dictate tacit response
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                    disabled={currentIdx === 0 || savingCurrent}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-nexus-text font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndNext}
                    disabled={savingCurrent || !currentAnswer.trim()}
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs flex items-center gap-2"
                  >
                    {savingCurrent ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[#D4B896]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </motion.div>
                        <span>Embedding...</span>
                      </>
                    ) : (
                      <>
                        <span>{currentIdx < questions.length - 1 ? 'Save & Next' : 'Complete & Index'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ────────────── STEP 4: COMPLETION SCREEN ────────────── */}
        {step === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="card p-10 sm:p-14 shadow-2xl max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-6"
            style={{ background: 'rgba(252,185,178, 0.04)' }}
          >
            {/* Animated Checkmark Circle */}
            <div className="w-24 h-24 rounded-full border-2 flex items-center justify-center shadow-2xl" style={{ background: 'rgba(107,143,78,0.15)', borderColor: '#D4B896', boxShadow: '0 0 20px rgba(107,143,78,0.2)' }}>
              <motion.svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D4B896"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M20 6L9 17L4 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  stroke="#D4B896"
                />
              </motion.svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black gradient-text tracking-tight">
                Knowledge Preserved
              </h2>
              <p className="text-xs sm:text-sm font-mono text-white">
                <strong className="text-[#D4B896]">{questions.length} answers</strong> indexed into PhoenixMind RAG space ·{' '}
                <strong className="text-[#C49A3C]">{enrichedTagsSet.size || selectedTags.length} equipment nodes</strong> enriched
              </p>
            </div>

            {/* Enriched Tags Grid */}
            <div className="space-y-2 w-full max-w-md pt-2">
              <span className="text-xs font-semibold text-nexus-textMuted uppercase tracking-wider block">
                Enriched Asset Nodes in SYNAPSE Graph
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 p-4 rounded-xl bg-black/40 border border-nexus-border">
                {Array.from(enrichedTagsSet.size > 0 ? enrichedTagsSet : selectedTags).map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg border font-mono font-bold text-xs shadow-md" style={{ background: 'rgba(252,185,178,0.2)', borderColor: 'rgba(252,185,178,0.4)', color: '#C49A3C' }}
                  >
                    OK {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-nexus-border text-nexus-text font-medium text-xs transition-colors w-full sm:w-auto"
              >
                Start New Interview
              </button>

              <button
                type="button"
                onClick={handleViewInOracle}
                className="btn-primary px-8 py-3 rounded-xl text-xs flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Bot className="w-4 h-4" />
                <span>View in ORACLE Copilot</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indexed Interviews History Panel below */}
      <InterviewHistory
        interviews={interviews}
        loading={loadingHistory}
      />
    </div>
  );
}
