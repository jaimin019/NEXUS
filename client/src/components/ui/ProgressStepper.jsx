/**
 * ProgressStepper — 5-step ingestion pipeline stepper. Autumn Sunset palette.
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
  const displaySteps = ['parsing', 'chunking', 'embedding', 'graphing', 'complete'];

  return (
    <div className="flex items-center gap-1">
      {displaySteps.map((step, idx) => {
        const status = getStepStatus(step, currentStep);
        const isLast = idx === displaySteps.length - 1;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex items-center justify-center rounded-full transition-all duration-300"
                style={{
                  width: compact ? 16 : 20,
                  height: compact ? 16 : 20,
                  background:
                    status === 'done' || (status === 'active' && step === 'complete')
                      ? '#D4B896'
                      : status === 'active'
                      ? '#C49A3C'
                      : status === 'failed'
                      ? '#B87070'
                      : 'var(--surface)',
                  border: `1px solid ${
                    status === 'done' || (status === 'active' && step === 'complete')
                      ? '#D4B896'
                      : status === 'active'
                      ? '#C49A3C'
                      : status === 'failed'
                      ? '#B87070'
                      : 'var(--border)'
                  }`,
                  boxShadow: status === 'active' ? '0 0 0 3px rgba(196,154,60,0.3)' : 'none',
                }}
              >
                {status === 'done' || (status === 'active' && step === 'complete') ? (
                  <Check
                    style={{ width: compact ? 10 : 12, height: compact ? 10 : 12, color: 'var(--text)' }}
                  />
                ) : status === 'active' ? (
                  <div
                    className="rounded-full animate-pulse"
                    style={{
                      width: compact ? 6 : 8,
                      height: compact ? 6 : 8,
                      background: '#C49A3C',
                    }}
                  />
                ) : null}
              </div>
              {!compact && (
                <span
                  className="mt-0.5 font-medium whitespace-nowrap"
                  style={{
                    fontSize: 9,
                    color:
                      status === 'done' ? '#D4B896' :
                      status === 'active' ? '#C49A3C' :
                      'var(--text-faint)',
                  }}
                >
                  {STEP_LABELS[step]}
                </span>
              )}
            </div>

            {!isLast && (
              <div
                className="mx-0.5 transition-all duration-500"
                style={{
                  height: 1,
                  width: compact ? 12 : 16,
                  background: status === 'done' ? '#D4B896' : 'var(--border)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
