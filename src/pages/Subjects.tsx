import { useState } from "react";
import { Navbar } from "@/components/dashboard/navbar";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSubjects } from "@/hooks/use-subjects";
import { SubjectDetail } from "@/components/subjects/subject-detail";
import { BookOpen, Plus, Target } from "lucide-react";

const Subjects = () => {
  const { language, setLanguage, t } = useTranslations();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const studentName = profile?.display_name || user?.email?.split("@")[0] || "Student";



  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        language={language} 
        onLanguageChange={setLanguage} 
        studentName={studentName} 
        t={t} 
      />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {selectedSubject ? (
          <SubjectDetail 
            subject={subjects.find(s => s.id === selectedSubject)!}
            onBack={() => setSelectedSubject(null)}
            t={t}
          />
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Fächer</h1>
                  <p className="text-muted-foreground">Übersicht deiner Schulfächer und Noten</p>
                </div>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Fach hinzufügen
                </Button>
              </div>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Card key={subject.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedSubject(subject.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: `${subject.color}20` }}
                        >
                          <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {subject.credits} Credits
                            </Badge>
                            {subject.teacher && (
                              <span className="text-sm text-muted-foreground">
                                {subject.teacher}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Current Grade */}
                    {subject.current_grade && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Aktuelle Note:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: subject.color }}>
                            {subject.current_grade}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Target Grade */}
                    {subject.target_grade && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Ziel:</span>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" style={{ color: subject.color }} />
                          <span className="text-sm font-medium">
                            {subject.target_grade}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Subject Info */}
                    {subject.room && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Raum:</span>
                        <span className="text-sm text-muted-foreground">{subject.room}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        Note hinzufügen
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {subjects.length === 0 && (
              <Card className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Fächer gefunden</h3>
                <p className="text-muted-foreground mb-4">
                  Füge deine ersten Schulfächer hinzu, um mit der Notenverfolgung zu beginnen.
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Fach hinzufügen
                </Button>
              </Card>
            )}
          </>
        )}
      </main>
      
      <BottomNavigation t={t} />
    </div>
  );
};

export default Subjects;