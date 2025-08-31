import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
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
  Palette,
  ChevronDown,
  ChevronRight,
  FileText,
  Paperclip as AttachmentIcon,
  Plus,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
// COMMENTED OUT - Objectives and Milestones related imports
// import { LearningObjectives } from './learning-objectives';
// import { ResourceAttachments } from './resource-attachments';
// import { SyllabusMilestones } from './syllabus-milestones';
import { format, isAfter, isBefore, addDays } from 'date-fns';

type SyllabusTopic = Tables<'syllabus_topics'>;
type Subtopic = Tables<'subtopics'>;
type LearningObjective = Tables<'learning_objectives'>;
type ResourceAttachment = Tables<'resource_attachments'>;
type SyllabusMilestone = Tables<'syllabus_milestones'>;
type Theme = Tables<'themes'>;
type Subject = Tables<'subjects'>;

interface Note {
  id: string;
  title: string;
  content: string;
  time_period: "day" | "week" | "month" | "quarter" | "half_year";
  subject_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
  created_at: string;
  updated_at: string;
}

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
  // COMMENTED OUT - Objectives and Milestones state
  // const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [resources, setResources] = useState<ResourceAttachment[]>([]);
  // const [milestones, setMilestones] = useState<SyllabusMilestone[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
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
  const navigate = useNavigate();
  
  // Overlay state for notes
  const [showSubtopicOverlay, setShowSubtopicOverlay] = useState(false);
  const [subtopicNotes, setSubtopicNotes] = useState<Note[]>([]);
  const [overlaySubtopicInfo, setOverlaySubtopicInfo] = useState<{subjectId: string, topicId: string, subtopicId: string} | null>(null);

  // Fetch notes for overlay functionality
  const { data: notes = [] } = useQuery({
    queryKey: ['notes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    fetchAllData();
  }, [subjectId, userId]);

  const toggleSubtopicCompletion = async (subtopicId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subtopics')
        .update({ completed: !currentStatus })
        .eq('id', subtopicId);

      if (error) throw error;

      // Update local state
      setSubtopics(prev => prev.map(subtopic => 
        subtopic.id === subtopicId 
          ? { ...subtopic, completed: !currentStatus }
          : subtopic
      ));

      toast({
        title: !currentStatus ? "Subtopic completed!" : "Subtopic marked as incomplete",
        description: "Progress updated successfully.",
      });
    } catch (error) {
      console.error('Error updating subtopic:', error);
      toast({
        title: "Error",
        description: "Failed to update subtopic completion status.",
        variant: "destructive",
      });
    }
  };

  const toggleSubtopicExpansion = (subtopicId: string) => {
    setExpandedSubtopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subtopicId)) {
        newSet.delete(subtopicId);
      } else {
        newSet.add(subtopicId);
      }
      return newSet;
    });
  };

  const handleNotesClick = (topicId: string, subtopicId: string) => {
    // Filter notes for this specific subtopic
    const existingNotes = notes.filter(note => {
      const matchesSubject = note.subject_id === subjectId;
      const matchesTopic = note.topic_id === topicId;
      const matchesSubtopic = note.subtopic_id === subtopicId;
      return matchesSubject && matchesTopic && matchesSubtopic;
    });
    
    setSubtopicNotes(existingNotes);
    setOverlaySubtopicInfo({ subjectId, topicId, subtopicId });
    setShowSubtopicOverlay(true);
  };

  const handleViewNote = (note: Note) => {
    // Navigate to notes page with the specific note
    navigate(`/notes?subject_id=${note.subject_id}&topic_id=${note.topic_id}&subtopic_id=${note.subtopic_id}`);
  };

  const handleCreateNote = () => {
    if (overlaySubtopicInfo) {
      navigate(`/notes?subject_id=${overlaySubtopicInfo.subjectId}&topic_id=${overlaySubtopicInfo.topicId}&subtopic_id=${overlaySubtopicInfo.subtopicId}`);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [topics, subtopics, /* objectives, */ resources, /* milestones */]);

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
       const [subtopicsRes, /* objectivesRes, */ resourcesRes, /* milestonesRes */] = await Promise.all([
         topicIds.length > 0 
           ? supabase.from('subtopics').select('*').in('topic_id', topicIds).eq('user_id', userId).order('order_index')
           : Promise.resolve({ data: [], error: null }),
        // COMMENTED OUT - Objectives and Milestones data fetching
        // supabase.from('learning_objectives').select('*').eq('user_id', userId).order('order_index'),
        supabase.from('resource_attachments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        // supabase.from('syllabus_milestones').select('*').eq('subject_id', subjectId).eq('user_id', userId).order('target_date'),
      ]);
      
      // Get subtopic IDs for filtering objectives and resources
      const subtopicIds = (subtopicsRes.data || []).map(subtopic => subtopic.id);

      if (subtopicsRes.error) throw subtopicsRes.error;
      // COMMENTED OUT - Objectives and Milestones error checking
      // if (objectivesRes.error) throw objectivesRes.error;
      if (resourcesRes.error) throw resourcesRes.error;
      // if (milestonesRes.error) throw milestonesRes.error;

      setThemes(themesRes.data || []);
      setTopics(topicsRes.data || []);
      setSubtopics(subtopicsRes.data || []);
      // COMMENTED OUT - Objectives and Milestones state setting
      // setObjectives(objectivesRes.data || []);
      setResources(resourcesRes.data || []);
      // setMilestones(milestonesRes.data || []);
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
    // COMMENTED OUT - Objectives and Milestones calculations
    // const topicObjectives = objectives.filter(o => 
    //   (o.topic_id && topicIds.includes(o.topic_id)) || 
    //   (o.subtopic_id && topicSubtopics.some(s => s.id === o.subtopic_id))
    // );
    const topicResources = resources.filter(r => 
      (r.topic_id && topicIds.includes(r.topic_id)) || 
      (r.subtopic_id && topicSubtopics.some(s => s.id === r.subtopic_id))
    );

    // const now = new Date();
    // const upcomingMilestones = milestones.filter(m => 
    //   !m.completed && m.target_date && isAfter(new Date(m.target_date), now)
    // );
    // const overdueMilestones = milestones.filter(m => 
    //   !m.completed && m.target_date && isBefore(new Date(m.target_date), now)
    // );

    setStats({
      totalTopics: topics.length,
      completedTopics: topics.filter(t => {
        const topicSubtopics = subtopics.filter(s => s.topic_id === t.id);
        return topicSubtopics.length > 0 ? topicSubtopics.every(s => s.completed) : false;
      }).length,
      totalSubtopics: topicSubtopics.length,
      completedSubtopics: topicSubtopics.filter(s => s.completed).length,
      // COMMENTED OUT - Objectives and Milestones stats
      totalObjectives: 0, // topicObjectives.length,
      completedObjectives: 0, // topicObjectives.filter(o => o.completed).length,
      totalResources: topicResources.length,
      totalMilestones: 0, // milestones.length,
      completedMilestones: 0, // milestones.filter(m => m.completed).length,
      upcomingMilestones: 0, // upcomingMilestones.length,
      overdueMilestones: 0, // overdueMilestones.length,
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
      {/* Merged Curriculum Overview and Topics Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Curriculum Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Compact Overview Stats */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-700">{stats.completedSubtopics}</div>
                <div className="text-xs text-blue-600">of {stats.totalSubtopics}</div>
                <div className="text-xs text-gray-500">Topics</div>
              </div>
            </div>
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="font-semibold text-indigo-600">{Math.round(getOverallProgress())}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getOverallProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Topics Progress Section */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Topics Progress
            </h3>
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
                                      <div key={subtopic.id} className="space-y-2">
                                        <div
                                          className={`p-3 border rounded transition-colors ${
                                            selectedSubtopicId === subtopic.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                                          } ${
                                            subtopic.completed ? 'bg-green-100 border-green-300' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <CheckCircle 
                                              className={`h-4 w-4 cursor-pointer ${
                                                subtopic.completed ? 'text-green-600' : 'text-gray-400'
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSubtopicCompletion(subtopic.id, subtopic.completed);
                                              }}
                                            />
                                            <span className={`flex-1 ${
                                              subtopic.completed ? 'line-through text-gray-500' : ''
                                            }`}>
                                              {subtopic.title}
                                            </span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSubtopicExpansion(subtopic.id);
                                              }}
                                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                                            >
                                              {expandedSubtopics.has(subtopic.id) ? (
                                                <ChevronDown className="h-4 w-4 text-gray-600" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-600" />
                                              )}
                                            </button>
                                          </div>
                                          {subtopic.description && (
                                            <p className="text-sm text-gray-600 mt-1 ml-6">{subtopic.description}</p>
                                          )}
                                        </div>
                                        
                                        {/* Expandable Options */}
                                        {expandedSubtopics.has(subtopic.id) && (
                                          <div className="ml-6 p-3 bg-gray-50 border rounded-lg space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={() => handleNotesClick(topic.id, subtopic.id)}
                                              >
                                                <FileText className="h-3 w-3" />
                                                Notes
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={() => {
                                                  // TODO: Implement attachments functionality
                                                  toast({
                                                    title: "Attachments",
                                                    description: "Attachments functionality coming soon!",
                                                  });
                                                }}
                                              >
                                                <AttachmentIcon className="h-3 w-3" />
                                                Attachments
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={() => {
                                                  // TODO: Implement additional options
                                                  toast({
                                                    title: "More Options",
                                                    description: "Additional options coming soon!",
                                                  });
                                                }}
                                              >
                                                <Target className="h-3 w-3" />
                                                More
                                              </Button>
                                            </div>
                                          </div>
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
                                  <div key={subtopic.id} className="space-y-2">
                                    <div
                                      className={`p-3 border rounded transition-colors ${
                                        selectedSubtopicId === subtopic.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                                      } ${
                                        subtopic.completed ? 'bg-green-100 border-green-300' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <CheckCircle 
                                          className={`h-4 w-4 cursor-pointer ${
                                            subtopic.completed ? 'text-green-600' : 'text-gray-400'
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtopicCompletion(subtopic.id, subtopic.completed);
                                          }}
                                        />
                                        <span className={`flex-1 ${
                                          subtopic.completed ? 'line-through text-gray-500' : ''
                                        }`}>
                                          {subtopic.title}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtopicExpansion(subtopic.id);
                                          }}
                                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        >
                                          {expandedSubtopics.has(subtopic.id) ? (
                                            <ChevronDown className="h-4 w-4 text-gray-600" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                          )}
                                        </button>
                                      </div>
                                      {subtopic.description && (
                                        <p className="text-sm text-gray-600 mt-1 ml-6">{subtopic.description}</p>
                                      )}
                                    </div>
                                    
                                    {/* Expandable Options */}
                                    {expandedSubtopics.has(subtopic.id) && (
                                      <div className="ml-6 p-3 bg-gray-50 border rounded-lg space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => handleNotesClick(topic.id, subtopic.id)}
                                          >
                                            <FileText className="h-3 w-3" />
                                            Notes
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => {
                                              // TODO: Implement attachments functionality
                                              toast({
                                                title: "Attachments",
                                                description: "Attachments functionality coming soon!",
                                              });
                                            }}
                                          >
                                            <AttachmentIcon className="h-3 w-3" />
                                            Attachments
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => {
                                              // TODO: Implement additional options
                                              toast({
                                                title: "More Options",
                                                description: "Additional options coming soon!",
                                              });
                                            }}
                                          >
                                            <Target className="h-3 w-3" />
                                            More
                                          </Button>
                                        </div>
                                      </div>
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
            })()
          }
          </div>
          </div>
        </CardContent>
      </Card>

      {/* COMMENTED OUT - Resources tab removed as it was the only remaining tab after objectives and milestones were commented out */}
      {/* 
      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <ResourceAttachments
            topicId={selectedTopicId || undefined}
            subtopicId={selectedSubtopicId || undefined}
            userId={userId}
          />
        </TabsContent>
      </Tabs>
      */}
      
      {/* Subtopic Notes Overlay */}
      {showSubtopicOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {subtopicNotes.length > 0 ? 'Notizen für dieses Unterthema' : 'Keine Notizen gefunden'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSubtopicOverlay(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            
            {subtopicNotes.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Wähle eine Notiz aus, um sie zu öffnen:
                </p>
                {subtopicNotes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      handleViewNote(note);
                      setShowSubtopicOverlay(false);
                    }}
                  >
                    <h4 className="font-medium text-sm">{note.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.updated_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <Button 
                    onClick={() => {
                      setShowSubtopicOverlay(false);
                      handleCreateNote();
                    }}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Neue Notiz erstellen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Für dieses Unterthema wurden noch keine Notizen erstellt.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowSubtopicOverlay(false)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowSubtopicOverlay(false);
                      handleCreateNote();
                    }}
                    className="flex-1 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Erstellen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}