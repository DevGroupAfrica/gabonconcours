import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  badge?: {
    icon?: React.ReactNode;
    text: string;
  };
  title: string | React.ReactNode;
  subtitle: string;
  primaryAction?: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  stats?: Array<{
    value: string;
    label: string;
  }>;
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  badge,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  stats,
  className
}) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <section className={cn("relative overflow-hidden py-20 md:py-32", className)}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-background to-blue-400/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeInUp} className="space-y-8">
            {badge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-500 text-sm font-semibold border border-blue-500/20">
                {badge.icon}
                {badge.text}
              </div>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              {title}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {subtitle}
            </p>

            {(primaryAction || secondaryAction) && (
              <div className="flex flex-col sm:flex-row gap-4">
                {primaryAction && (
                  <Button
                    size="lg"
                    className="text-base"
                    onClick={primaryAction.onClick}
                  >
                    {primaryAction.text}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                )}
                {secondaryAction && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base"
                    onClick={secondaryAction.onClick}
                  >
                    {secondaryAction.text}
                  </Button>
                )}
              </div>
            )}
          </motion.div>

          {stats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-400/20 rounded-3xl blur-3xl animate-pulse-glow" />
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-6 text-center">
                  {stats.map((stat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="text-3xl md:text-4xl font-bold gradient-text">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
