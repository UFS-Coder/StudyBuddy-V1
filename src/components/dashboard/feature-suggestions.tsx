import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar, 
  Target, 
  TrendingUp,
  BookOpen,
  Users,
  Settings,
  FileText,
  Bell,
  Award,
  Clock,
  BarChart3
} from "lucide-react";

interface FeatureSuggestionProps {
  t: any;
}

export function FeatureSuggestions({ t }: FeatureSuggestionProps) {
  const upcomingFeatures = [
    {
      category: "Noten Management",
      icon: <TrendingUp className="h-5 w-5" />,
      items: [
        "Add/Edit individual test scores",
        "Noten Rechner mit Gewichtungen", 
        "Photo upload for test papers",
        "Noten Trend Analyse & Vorhersagen"
      ]
    },
    {
      category: "Assessment Planning",
      icon: <Calendar className="h-5 w-5" />,
      items: [
        "Upcoming test calendar",
        "Study schedule generator",
        "Reminder notifications",
        "Test preparation tracker"
      ]
    },
    {
      category: "Oral Participation",
      icon: <Users className="h-5 w-5" />,
      items: [
        "Daily participation logging",
        "Quality assessment rubrics",
        "Teacher feedback integration",
        "Participation goal setting"
      ]
    },
    {
      category: "Curriculum Tracking",
      icon: <BookOpen className="h-5 w-5" />,
      items: [
        "Topic-by-topic progress",
        "Learning objectives checklist",
        "Resource attachment system",
        "Syllabus milestone tracking"
      ]
    },
    {
      category: "Analytics & Reports",
      icon: <BarChart3 className="h-5 w-5" />,
      items: [
        "Subject performance comparison",
        "Abitur Noten Prognosen",
        "Strength/weakness analysis",
        "Parent progress reports"
      ]
    },
    {
      category: "Collaboration",
      icon: <Users className="h-5 w-5" />,
      items: [
        "Teacher gradebook integration",
        "Parent dashboard access",
        "Study group coordination",
        "Class performance benchmarks"
      ]
    }
  ];

  return (
    <div className="space-y-6 mt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
        <p className="text-muted-foreground">
          Comprehensive features to make AbiTrackr your complete academic companion
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingFeatures.map((feature, index) => (
          <Card key={index} className="p-6 shadow-card">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-foreground">{feature.category}</h3>
                <Badge variant="outline" className="ml-auto">Planned</Badge>
              </div>
              
              <ul className="space-y-2">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Plus className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-6 bg-gradient-academic text-primary-foreground">
        <div className="text-center space-y-3">
          <Award className="h-12 w-12 mx-auto" />
          <h3 className="text-xl font-bold">Ready for Your Abitur Success!</h3>
          <p className="text-primary-foreground/80">
            Track every note, master every subject, and achieve your academic goals with confidence.
          </p>
        </div>
      </Card>
    </div>
  );
}