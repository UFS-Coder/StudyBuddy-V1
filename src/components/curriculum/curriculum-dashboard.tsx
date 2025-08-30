import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Target, 
  Paperclip, 
  Flag, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Palette
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { LearningObjectives } from './learning-objectives';
import { ResourceAttachments } from './resource-attachments';
import { SyllabusMilestones } from './syllabus-milestones';
import { format, isAfter, isBefore, addDays } from 'date-fns';

type SyllabusTopic = Tables<'syllabus_topics'>;
type Subtopic = Tables<'subtopics'>;
type LearningObjective = Tables<'learning_objectives'>;
type ResourceAttachment = Tables<'resource_attachments'>;
type SyllabusMilestone = Tables<'syllabus_milestones'>;
type Theme = Tables<'themes'>;
type Subject = Tables<'subjects'>;

interface CurriculumDashboardProps {
  subjectId: string;
  userId: string;
}

interface CurriculumStats {
  totalTopics: number;
  completedTopics: number;
  totalSubtopics: number;
  completedSubtopics: number;
  totalObjectives: number;
  completedObjectives: number;
  totalResources: number;
  totalMilestones: number;
  completedMilestones: number;
  upcomingMilestones: number;
  overdueMilestones: number;
}

export function CurriculumDashboard({ subjectId, userId }: CurriculumDashboardProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [resources, setResources] = useState<ResourceAttachment[]>([]);
  const [milestones, setMilestones] = useState<SyllabusMilestone[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CurriculumStats>({
    totalTopics: 0,
    completedTopics: 0,
    totalSubtopics: 0,
    completedSubtopics: 0,
    totalObjectives: 0,
    completedObjectives: 0,
    totalResources: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    upcomingMilestones: 0,
    overdueMilestones: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, [subjectId, userId]);

  useEffect(() => {
    calculateStats();
  }, [topics, subtopics, objectives, resources, milestones]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      // First fetch themes and topics for this subject
      const [themesRes, topicsRes] = await Promise.all([
        supabase.from('themes').select('*').eq('subject_id', subjectId).eq('user_id', userId).order('order_index'),
        supabase.from('syllabus_topics').select('*').eq('subject_id', subjectId).eq('user_id', userId).order('order_index')
      ]);
      
      if (themesRes.error) throw themesRes.error;
      if (topicsRes.error) throw topicsRes.error;
      
      const topicIds = (topicsRes.data || []).map(topic => topic.id);
      
      // Fetch all data in parallel, filtering subtopics by topic IDs
       const [subtopicsRes, objectivesRes, resourcesRes, milestonesRes] = await Promise.all([
         topicIds.length > 0 
           ? supabase.from('subtopics').select('*').in('topic_id', topicIds).eq('user_id', userId).order('order_index')
           : Promise.resolve({ data: [], error: null }),
        supabase.from('learning_objectives').select('*').eq('user_id', userId).order('order_index'),
        supabase.from('resource_attachments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('syllabus_milestones').select('*').eq('subject_id', subjectId).eq('user_id', userId).order('target_date'),
      ]);
      
      // Get subtopic IDs for filtering objectives and resources
      const subtopicIds = (subtopicsRes.data || []).map(subtopic => subtopic.id);

      if (subtopicsRes.error) throw subtopicsRes.error;
      if (objectivesRes.error) throw objectivesRes.error;
      if (resourcesRes.error) throw resourcesRes.error;
      if (milestonesRes.error) throw milestonesRes.error;

      setThemes(themesRes.data || []);
      setTopics(topicsRes.data || []);
      setSubtopics(subtopicsRes.data || []);
      setObjectives(objectivesRes.data || []);
      setResources(resourcesRes.data || []);
      setMilestones(milestonesRes.data || []);
    } catch (error) {
      console.error('Error fetching curriculum data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load curriculum data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const topicIds = topics.map(t => t.id);
    const topicSubtopics = subtopics.filter(s => topicIds.includes(s.topic_id));
    const topicObjectives = objectives.filter(o => 
      (o.topic_id && topicIds.includes(o.topic_id)) || 
      (o.subtopic_id && topicSubtopics.some(s => s.id === o.subtopic_id))
    );
    const topicResources = resources.filter(r => 
      (r.topic_id && topicIds.includes(r.topic_id)) || 
      (r.subtopic_id && topicSubtopics.some(s => s.id === r.subtopic_id))
    );

    const now = new Date();
    const upcomingMilestones = milestones.filter(m => 
      !m.completed && m.target_date && isAfter(new Date(m.target_date), now)
    );
    const overdueMilestones = milestones.filter(m => 
      !m.completed && m.target_date && isBefore(new Date(m.target_date), now)
    );

    setStats({
      totalTopics: topics.length,
      completedTopics: topics.filter(t => {
        const topicSubtopics = subtopics.filter(s => s.topic_id === t.id);
        return topicSubtopics.length > 0 ? topicSubtopics.every(s => s.completed) : false;
      }).length,
      totalSubtopics: topicSubtopics.length,
      completedSubtopics: topicSubtopics.filter(s => s.completed).length,
      totalObjectives: topicObjectives.length,
      completedObjectives: topicObjectives.filter(o => o.completed).length,
      totalResources: topicResources.length,
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.completed).length,
      upcomingMilestones: upcomingMilestones.length,
      overdueMilestones: overdueMilestones.length,
    });
  };

  const getTopicProgress = (topicId: string) => {
    const topicSubtopics = subtopics.filter(s => s.topic_id === topicId);
    if (topicSubtopics.length === 0) return 0;
    const completed = topicSubtopics.filter(s => s.completed).length;
    return (completed / topicSubtopics.length) * 100;
  };

  const getOverallProgress = () => {
    if (stats.totalSubtopics === 0) return 0;
    return (stats.completedSubtopics / stats.totalSubtopics) * 100;
  };

  const getTopicsByTheme = () => {
    const topicsWithThemes = topics.filter(topic => topic.theme_id);
    const topicsWithoutThemes = topics.filter(topic => !topic.theme_id);
    
    const themeGroups = themes.map(theme => ({
      theme,
      topics: topicsWithThemes.filter(topic => topic.theme_id === theme.id)
    })).filter(group => group.topics.length > 0);
    
    return {
      themeGroups,
      ungroupedTopics: topicsWithoutThemes
    };
  };

  const getThemeProgress = (themeId: string) => {
    const themeTopics = topics.filter(topic => topic.theme_id === themeId);
    if (themeTopics.length === 0) return 0;
    
    const themeSubtopics = subtopics.filter(subtopic => 
      themeTopics.some(topic => topic.id === subtopic.topic_id)
    );
    
    if (themeSubtopics.length === 0) return 0;
    const completed = themeSubtopics.filter(s => s.completed).length;
    return (completed / themeSubtopics.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Curriculum Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Curriculum Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{stats.completedSubtopics}</div>
              <div className="text-sm text-blue-600">of {stats.totalSubtopics} Topics</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{stats.completedObjectives}</div>
              <div className="text-sm text-green-600">of {stats.totalObjectives} Objectives</div>
              <div className="text-xs text-gray-500">Achieved</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{stats.totalResources}</div>
              <div className="text-sm text-purple-600">Resources</div>
              <div className="text-xs text-gray-500">Available</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">{stats.upcomingMilestones}</div>
              <div className="text-sm text-orange-600">Upcoming</div>
              <div className="text-xs text-gray-500">Milestones</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>

          {stats.overdueMilestones > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  {stats.overdueMilestones} overdue milestone{stats.overdueMilestones > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Topics Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              const { themeGroups, ungroupedTopics } = getTopicsByTheme();
              
              return (
                <>
                  {/* Themed Topics */}
                  {themeGroups.map(({ theme, topics: themeTopics }) => {
                    const themeProgress = getThemeProgress(theme.id);
                    const themeSubtopics = subtopics.filter(subtopic => 
                      themeTopics.some(topic => topic.id === subtopic.topic_id)
                    );
                    const completedThemeSubtopics = themeSubtopics.filter(s => s.completed).length;
                    
                    return (
                      <div key={theme.id} className="border rounded-lg p-4 space-y-3">
                        {/* Theme Header */}
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: theme.color || '#6B7280' }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                {theme.title}
                              </h3>
                              <Badge variant="secondary">
                                {completedThemeSubtopics}/{themeSubtopics.length} subtopics
                              </Badge>
                            </div>
                            {theme.description && (
                              <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Progress value={themeProgress} className="flex-1 h-2" />
                              <span className="text-sm text-gray-500">{Math.round(themeProgress)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Topics within Theme */}
                        <div className="ml-6 space-y-3">
                          {themeTopics.map((topic) => {
                            const progress = getTopicProgress(topic.id);
                            const topicSubtopics = subtopics.filter(s => s.topic_id === topic.id);
                            const completedSubtopics = topicSubtopics.filter(s => s.completed).length;
                            
                            return (
                              <div
                                key={topic.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedTopicId === topic.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedTopicId(selectedTopicId === topic.id ? null : topic.id)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{topic.title}</h4>
                                  <Badge variant="outline">
                                    {completedSubtopics}/{topicSubtopics.length}
                                  </Badge>
                                </div>
                                {topic.description && (
                                  <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                                )}
                                <div className="flex items-center gap-2">
                                  <Progress value={progress} className="flex-1 h-2" />
                                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                                </div>
                                
                                {/* Subtopics */}
                                {selectedTopicId === topic.id && topicSubtopics.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {topicSubtopics.map((subtopic) => (
                                      <div
                                        key={subtopic.id}
                                        className={`p-3 border rounded cursor-pointer transition-colors ${
                                          selectedSubtopicId === subtopic.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                                        } ${
                                          subtopic.completed ? 'bg-green-100 border-green-300' : ''
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSubtopicId(selectedSubtopicId === subtopic.id ? null : subtopic.id);
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className={`h-4 w-4 ${
                                            subtopic.completed ? 'text-green-600' : 'text-gray-400'
                                          }`} />
                                          <span className={subtopic.completed ? 'line-through text-gray-500' : ''}>
                                            {subtopic.title}
                                          </span>
                                        </div>
                                        {subtopic.description && (
                                          <p className="text-sm text-gray-600 mt-1 ml-6">{subtopic.description}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Ungrouped Topics */}
                  {ungroupedTopics.length > 0 && (
                    <div className="space-y-3">
                      {ungroupedTopics.length > 0 && themeGroups.length > 0 && (
                        <div className="border-t pt-4">
                          <h3 className="font-semibold text-lg mb-3 text-gray-700">Other Topics</h3>
                        </div>
                      )}
                      {ungroupedTopics.map((topic) => {
                        const progress = getTopicProgress(topic.id);
                        const topicSubtopics = subtopics.filter(s => s.topic_id === topic.id);
                        const completedSubtopics = topicSubtopics.filter(s => s.completed).length;
                        
                        return (
                          <div
                            key={topic.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedTopicId === topic.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedTopicId(selectedTopicId === topic.id ? null : topic.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{topic.title}</h3>
                              <Badge variant="outline">
                                {completedSubtopics}/{topicSubtopics.length}
                              </Badge>
                            </div>
                            {topic.description && (
                              <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="flex-1 h-2" />
                              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                            </div>
                            
                            {/* Subtopics */}
                            {selectedTopicId === topic.id && topicSubtopics.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {topicSubtopics.map((subtopic) => (
                                  <div
                                    key={subtopic.id}
                                    className={`p-3 border rounded cursor-pointer transition-colors ${
                                      selectedSubtopicId === subtopic.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                                    } ${
                                      subtopic.completed ? 'bg-green-100 border-green-300' : ''
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSubtopicId(selectedSubtopicId === subtopic.id ? null : subtopic.id);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className={`h-4 w-4 ${
                                        subtopic.completed ? 'text-green-600' : 'text-gray-400'
                                      }`} />
                                      <span className={subtopic.completed ? 'line-through text-gray-500' : ''}>
                                        {subtopic.title}
                                      </span>
                                    </div>
                                    {subtopic.description && (
                                      <p className="text-sm text-gray-600 mt-1 ml-6">{subtopic.description}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {topics.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No topics found</p>
                      <p className="text-sm">Topics are managed in the Syllabus section</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Components */}
      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objectives
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Milestones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="space-y-4">
          <LearningObjectives
            topicId={selectedTopicId || undefined}
            subtopicId={selectedSubtopicId || undefined}
            userId={userId}
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourceAttachments
            topicId={selectedTopicId || undefined}
            subtopicId={selectedSubtopicId || undefined}
            userId={userId}
          />
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <SyllabusMilestones
            subjectId={subjectId}
            userId={userId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}