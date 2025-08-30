import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, Info } from 'lucide-react';
import { 
  calculateDurchschnittsnote, 
  formatGrade, 
  getGradeColorClass, 
  getGermanGradeName, 
  isAbiturSafe,
  type SubjectWithGrades 
} from '@/lib/grade-calculations';

interface DurchschnittDashboardProps {
  subjectsWithGrades: SubjectWithGrades[];
  className?: string;
}

export const DurchschnittDashboard: React.FC<DurchschnittDashboardProps> = ({ 
  subjectsWithGrades, 
  className = '' 
}) => {
  const result = calculateDurchschnittsnote(subjectsWithGrades);
  const isSafe = isAbiturSafe(result.overallAverage);
  
  const lkSubjects = result.subjectAverages.filter(s => s.courseType === 'LK');
  const gkSubjects = result.subjectAverages.filter(s => s.courseType === 'GK');
  
  const getProgressValue = (grade: number): number => {
    // Convert grade (1-6) to progress (100-0)
    return Math.max(0, Math.min(100, (6 - grade) / 5 * 100));
  };
  
  const getProgressColor = (grade: number): string => {
    if (grade <= 1.5) return 'bg-green-500';
    if (grade <= 2.5) return 'bg-blue-500';
    if (grade <= 3.5) return 'bg-yellow-500';
    if (grade <= 4.0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (result.subjectAverages.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Keine Noten vorhanden</h3>
          <p className="text-muted-foreground">Fügen Sie Noten hinzu, um Ihren Durchschnitt zu sehen</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Average Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Durchschnittsnote</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Berechnungsformel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                      <div className="text-center">
                        Durchschnittsnote = (Σ Note × Gewichtung) ÷ Σ Gewichtung
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><strong>Gewichtung:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>LK (Leistungskurs): Gewichtung = 2</li>
                        <li>GK (Grundkurs): Gewichtung = 1</li>
                      </ul>
                      <p className="pt-2"><strong>Abitur-Bestehensgrenze:</strong></p>
                      <p className="ml-2">Durchschnitt ≤ 4,0 (Note "ausreichend")</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center gap-2">
              {isSafe ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Award className="h-3 w-3 mr-1" />
                  Abitur sicher
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Verbesserung nötig
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getGradeColorClass(result.overallAverage).split(' ')[0]}`}>
                {formatGrade(result.overallAverage)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getGermanGradeName(result.overallAverage)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fortschritt</span>
                <span>{getProgressValue(result.overallAverage).toFixed(0)}%</span>
              </div>
              <Progress 
                value={getProgressValue(result.overallAverage)} 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Gewichtete Punkte</p>
                <p className="font-semibold">{result.totalWeightedPoints.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Gesamtgewichtung</p>
                <p className="font-semibold">{result.totalWeight}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LK/GK Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LK Average */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Leistungskurse (LK)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.lkAverage !== null ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getGradeColorClass(result.lkAverage).split(' ')[0]}`}>
                    {formatGrade(result.lkAverage)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getGermanGradeName(result.lkAverage)}
                  </p>
                </div>
                <div className="space-y-1">
                  {lkSubjects.map(subject => (
                    <div key={subject.subjectId} className="flex justify-between items-center text-sm">
                      <span className="truncate">{subject.subjectName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatGrade(subject.average!)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">×{subject.weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Keine LK-Noten vorhanden</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GK Average */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Grundkurse (GK)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.gkAverage !== null ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getGradeColorClass(result.gkAverage).split(' ')[0]}`}>
                    {formatGrade(result.gkAverage)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getGermanGradeName(result.gkAverage)}
                  </p>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {gkSubjects.map(subject => (
                    <div key={subject.subjectId} className="flex justify-between items-center text-sm">
                      <span className="truncate">{subject.subjectName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatGrade(subject.average!)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">×{subject.weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Keine GK-Noten vorhanden</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
};