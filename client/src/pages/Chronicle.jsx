import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain } from 'lucide-react';
import FailureIntelligence from '@/components/chronicle/FailureIntelligence';
import ExpertCapture from '@/components/chronicle/ExpertCapture';

export default function Chronicle() {
  const [activeTab, setActiveTab] = useState('failure'); // 'failure' | 'expert'

  return (
    <div className="space-y-6">
      {/* Top Pill Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-nexus-border pb-4">
        <div className="flex items-center p-1 rounded-xl bg-nexus-surface border border-nexus-border">
          <button
            onClick={() => setActiveTab('failure')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'failure'
                ? 'text-white shadow-lg'
                : 'text-nexus-textMuted hover:text-white'
            }`}
          >
            {activeTab === 'failure' && (
              <motion.div
                layoutId="chronicleTab"
                className="absolute inset-0 bg-nexus-primary rounded-lg z-0"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Activity className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Failure Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab('expert')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'expert'
                ? 'text-white shadow-lg'
                : 'text-nexus-textMuted hover:text-white'
            }`}
          >
            {activeTab === 'expert' && (
              <motion.div
                layoutId="chronicleTab"
                className="absolute inset-0 bg-nexus-primary rounded-lg z-0"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Brain className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Expert Knowledge Capture</span>
          </button>
        </div>

        <span className="text-xs font-mono text-nexus-textMuted hidden sm:inline-block">
          {activeTab === 'failure' ? 'CHRONICLE Recurrence Miner' : 'PhoenixMind Tacit Engine'}
        </span>
      </div>

      {/* Tab Content */}
      {activeTab === 'failure' ? (
        <FailureIntelligence />
      ) : (
        <ExpertCapture />
      )}
    </div>
  );
}
