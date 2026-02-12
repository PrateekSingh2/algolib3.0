import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "blue" | "purple" | "none";
}

const GlassCard = ({ children, className, hover = false, glow = "none" }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "glass rounded-xl p-6 transition-all duration-300",
        hover && "hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_30px_hsl(217_91%_60%_/_0.1)]",
        glow === "blue" && "neon-glow-blue",
        glow === "purple" && "neon-glow-purple",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
