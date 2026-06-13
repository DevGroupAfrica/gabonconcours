import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string | React.ReactNode;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  title,
  subtitle,
  align = "center",
  className
}) => {
  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end"
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <motion.div
      {...fadeInUp}
      className={cn(
        "flex flex-col gap-4 mb-12 md:mb-16",
        alignClasses[align],
        className
      )}
    >
      {badge && (
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-500 text-sm font-semibold border border-blue-500/20 w-fit">
          {badge}
        </span>
      )}
      
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      
      {subtitle && (
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
