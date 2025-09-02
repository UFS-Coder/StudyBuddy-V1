import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  iconColor?: string;
  onClick?: () => void;
  showProgress?: boolean;
  progressValue?: number;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon, 
  iconColor = "text-primary",
  onClick,
  showProgress = false,
  progressValue = 0
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return <TrendingUp className="h-5 w-5" />;
      case "negative":
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Minus className="h-5 w-5" />;
    }
  };

  return (
    <Card 
      className={cn(
        "p-4 shadow-card",
        onClick && "cursor-pointer hover:shadow-lg transition-shadow duration-200"
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className={cn("p-2 rounded-lg bg-muted", iconColor)}>
            <div className="h-6 w-6 flex items-center justify-center">
              {icon}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {change && (
            <div className={cn("text-xs flex items-center justify-between", getChangeColor())}>
              <span>{change}</span>
              <div className={cn("flex items-center", getChangeColor())}>
                {getChangeIcon()}
              </div>
            </div>
          )}
          {showProgress && (
            <div className="mt-2">
              <Progress value={progressValue} className="h-2" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}