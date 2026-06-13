import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description: string;
}

interface ProgressStepsProps {
  currentStep: number;
  steps: Step[];
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                    {
                      'bg-primary text-primary-foreground': isCompleted,
                      'bg-primary text-primary-foreground ring-4 ring-primary/20': isCurrent,
                      'bg-muted text-muted-foreground': isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p
                    className={cn('font-medium text-sm', {
                      'text-primary': isCurrent,
                      'text-foreground': isCompleted,
                      'text-muted-foreground': isUpcoming,
                    })}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 flex items-center">
                  <div
                    className={cn(
                      'h-1 w-full transition-all duration-300',
                      {
                        'bg-primary': stepNumber < currentStep,
                        'bg-muted': stepNumber >= currentStep,
                      }
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;
