import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  className?: string;
  variant?: "default" | "gradient" | "minimal";
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  delay = 0,
  className,
  variant = "default"
}) => {
  const variants = {
    default: "bg-white dark:bg-gray-800",
    gradient: "bg-gradient-to-br from-blue-500/5 to-blue-400/5",
    minimal: "bg-transparent border-0 shadow-none hover:shadow-none"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8 }}
      className="group h-full"
    >
      <Card className={cn(
        "h-full p-6 md:p-8 transition-all duration-300",
        variants[variant],
        className
      )}>
        <CardContent className="p-0 space-y-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-7 h-7 md:w-8 md:h-8 text-blue-500" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface FeatureGridProps {
  features: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
  }>;
  columns?: 2 | 3 | 4;
  variant?: "default" | "gradient" | "minimal";
  className?: string;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  features,
  columns = 3,
  variant = "default",
  className
}) => {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn(
      "grid gap-6 md:gap-8",
      gridCols[columns],
      className
    )}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          delay={index * 0.1}
          variant={variant}
        />
      ))}
    </div>
  );
};
