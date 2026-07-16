/**
 * ProgressStepper — 5-step ingestion pipeline stepper.
 */
import { Check } from 'lucide-react';

const STEPS = ['pending', 'parsing', 'chunking', 'embedding', 'graphing', 'complete'];

const STEP_LABELS = {
  pending: 'Pending',
  parsing: 'Parse',
  chunking: 'Chunk',
  embedding: 'Embed',
  graphing: 'Graph',
  complete: 'Done',
};

function getStepStatus(step, currentStep) {
  const currentIdx = STEPS.indexOf(currentStep);
  const stepIdx = STEPS.indexOf(step);

  if (currentStep === 'failed') return stepIdx === 0 ? 'failed' : 'pending';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export default function ProgressStepper({ currentStep = 'pending', compact = false }) {
  // Display steps (skip 'pending' as step 0, start from parsing to complete)
  const displaySteps = ['parsing', 'chunking', 'embedding', 'graphing', 'complete'];

  return (
    <div className="flex items-center gap-1">
      {displaySteps.map((step, idx) => {
        const status = getStepStatus(step, currentStep);
        const isLast = idx === displaySteps.length - 1;

        return (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center rounded-full transition-all duration-300
                  ${compact ? 'w-4 h-4' : 'w-5 h-5'}
                  ${status === 'done' || status === 'active' && step === 'complete'
                    ? 'bg-emerald-500 border-emerald-500'
                    : status === 'active'
                    ? 'bg-nexus-primary border-nexus-primary ring-2 ring-nexus-primary/30'
                    : status === 'failed'
                    ? 'bg-red-500 border-red-500'
                    : 'bg-nexus-surface border-nexus-border border'}
                `}
              >
                {status === 'done' || (status === 'active' && step === 'complete') ? (
                  <Check className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white`} />
                ) : status === 'active' ? (
                  <div className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-white rounded-full animate-pulse`} />
                ) : null}
              </div>
              {!compact && (
                <span className={`text-[9px] mt-0.5 font-medium whitespace-nowrap
                  ${status === 'done' ? 'text-emerald-400'
                    : status === 'active' ? 'text-nexus-primary'
                    : 'text-nexus-muted'}`}>
                  {STEP_LABELS[step]}
                </span>
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`h-px mx-0.5 transition-all duration-500
                  ${compact ? 'w-3' : 'w-4'}
                  ${status === 'done' ? 'bg-emerald-500' : 'bg-nexus-border'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
