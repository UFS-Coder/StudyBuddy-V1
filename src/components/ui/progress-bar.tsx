import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  variant?: "default" | "academic" | "success" | "warning";
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  variant = "default",
  className,
  showPercentage = true 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getVariantStyles = () => {
    switch (variant) {
      case "academic":
        return "bg-gradient-academic";
      case "success":
        return "bg-gradient-success";
      case "warning":
        return "bg-gradient-warning";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">{label}</span>
          {showPercentage && (
            <span className="text-muted-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getVariantStyles()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}