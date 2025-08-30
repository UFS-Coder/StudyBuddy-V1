import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  iconColor?: string;
  onClick?: () => void;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon, 
  iconColor = "text-primary",
  onClick 
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-success";
      case "negative":
        return "text-destructive";
      default:
        return "text-success";
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
          <div className={cn("p-1.5 rounded-lg bg-muted", iconColor)}>
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {change && (
            <div className={cn("text-xs", getChangeColor())}>
              {change}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}