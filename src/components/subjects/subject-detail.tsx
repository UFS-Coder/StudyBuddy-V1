import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Calendar,
  Plus,
  BarChart3,
  FileText,
  Users,
  Settings
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { CurriculumDashboard } from '@/components/curriculum/curriculum-dashboard';
import { useAuth } from '@/hooks/use-auth';

type Subject = Tables<'subjects'>;

interface SubjectDetailProps {
  subject: Subject;
  onBack: () => void;
  t: any;
}

export function SubjectDetail({ subject, onBack, t }: SubjectDetailProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please log in to view subject details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
      </div>

      {/* Subject Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{subject.name}</CardTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary">
                    {subject.credits} Credits
                  </Badge>
                  {subject.teacher && (
                    <span className="text-muted-foreground">
                      Teacher: {subject.teacher}
                    </span>
                  )}
                  {subject.room && (
                    <span className="text-muted-foreground">
                      Room: {subject.room}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Grade */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {subject.current_grade ? `${subject.current_grade}%` : 'N/A'}
              </div>
              <div className="text-sm text-blue-600">Current Grade</div>
            </div>
            
            {/* Target Grade */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {subject.target_grade ? `${subject.target_grade}%` : 'N/A'}
              </div>
              <div className="text-sm text-green-600">Target Grade</div>
            </div>
            
            {/* Progress */}
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {subject.current_grade && subject.target_grade 
                  ? Math.round((subject.current_grade / subject.target_grade) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-purple-600">Progress to Goal</div>
            </div>
          </div>
          

        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="curriculum" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Curriculum</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Grades</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Assignments</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Tasks</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Upcoming Deadlines</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Grade Entries</span>
                  <Badge variant="outline">0</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start adding grades and assignments to see activity here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  <span className="text-sm">Add Grade</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">New Assignment</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Schedule Test</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Log Participation</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-6">
          <CurriculumDashboard 
            subjectId={subject.id} 
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="grades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Grade Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Grade Management</h3>
                <p className="mb-4">Track and manage your grades for this subject</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Grade
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assignments & Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                <p className="mb-4">Create and track assignments for this subject</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="mb-4">Detailed performance analytics and insights</p>
                <p className="text-sm">Add more grades and assignments to see analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}