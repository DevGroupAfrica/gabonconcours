
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: 'inscription' | 'documents' | 'paiement' | 'termine';
  className?: string;
  // Supprimer toute prop inattendue comme data-lov-id
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, className }) => {
  const steps = [
    { id: 'inscription', label: 'Inscription', number: 1 },
    { id: 'documents', label: 'Documents', number: 2 },
    { id: 'paiement', label: 'Paiement', number: 3 },
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (currentStep === 'termine') return 'completed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className={cn("w-full py-6", className)}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center z-10 bg-background">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-all",
                      {
                        "bg-primary text-primary-foreground": isCompleted || isCurrent,
                        "bg-muted text-muted-foreground": !isCompleted && !isCurrent,
                        "ring-4 ring-primary/20": isCurrent,
                      }
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        {
                          "text-foreground": isCompleted || isCurrent,
                          "text-muted-foreground": !isCompleted && !isCurrent,
                        }
                      )}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 -mx-1 transition-all",
                      {
                        "bg-primary": isCompleted,
                        "bg-muted": !isCompleted,
                      }
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
