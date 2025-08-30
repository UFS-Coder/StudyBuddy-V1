import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Target, Plus, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCanEdit } from '@/hooks/use-parent-permissions';

import { Tables } from '@/integrations/supabase/types';

type SyllabusTopic = Tables<'syllabus_topics'>;
type Subtopic = Tables<'subtopics'>;
type Subject = Tables<'subjects'>;

interface TopicWithSubtopics extends SyllabusTopic {
  subtopics: Subtopic[];
}

interface SubjectWithTopics extends Subject {
  description?: string;
  topics: TopicWithSubtopics[];
}

type Theme = Tables<'themes'>;

export const SyllabusManager = () => {
  const { user } = useAuth();
  const canEdit = useCanEdit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isSubtopicDialogOpen, setIsSubtopicDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [topicFormData, setTopicFormData] = useState({ title: '', description: '' });
  const [subtopicFormData, setSubtopicFormData] = useState({ title: '', description: '' });
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithTopics | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicWithSubtopics | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');
  const [newSubtopicDescription, setNewSubtopicDescription] = useState('');
  const [editingTopic, setEditingTopic] = useState<SyllabusTopic | null>(null);
  const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [isDeleteTopicDialogOpen, setIsDeleteTopicDialogOpen] = useState(false);
  const [topicToDeleteId, setTopicToDeleteId] = useState<string | null>(null);

  // Fetch syllabus topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['syllabus-topics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('syllabus_topics')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch subtopics
  const { data: subtopics = [], isLoading: subtopicsLoading } = useQuery({
    queryKey: ['subtopics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('subtopics')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch subjects
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; subject_id: string }) => {
      if (!user) throw new Error('No user found');
      const { error } = await supabase
        .from('syllabus_topics')
        .insert([{
          user_id: user.id,
          title: data.title,
          description: data.description,
          subject_id: data.subject_id,
          order_index: topics.length,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus-topics', user?.id] });
      setTopicFormData({ title: '', description: '' });
      setSelectedSubjectId('');
      setIsTopicDialogOpen(false);
      setEditingTopic(null);
      toast({ title: 'Success', description: 'Topic created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create topic', variant: 'destructive' });
      console.error('Error creating topic:', error);
    },
  });

  // Create subtopic mutation
  const createSubtopicMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; topic_id: string }) => {
      if (!user) throw new Error('No user found');
      const { error } = await supabase
        .from('subtopics')
        .insert([{
          user_id: user.id,
          title: data.title,
          description: data.description,
          topic_id: data.topic_id,
          order_index: subtopics.filter(s => s.topic_id === data.topic_id).length,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtopics', user?.id] });
      setSubtopicFormData({ title: '', description: '' });
      setSelectedTopicId('');
      setIsSubtopicDialogOpen(false);
      setEditingSubtopic(null);
      toast({ title: 'Success', description: 'Subtopic created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create subtopic', variant: 'destructive' });
      console.error('Error creating subtopic:', error);
    },
  });

  // Toggle subtopic completion
  const toggleSubtopicMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('subtopics')
        .update({ completed })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtopics', user?.id] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update subtopic', variant: 'destructive' });
      console.error('Error updating subtopic:', error);
    },
  });

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string; theme_id?: string | null }) => {
      const { error } = await supabase
        .from('syllabus_topics')
        .update({
          title: data.title,
          description: data.description,
          theme_id: data.theme_id || null,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus-topics', user?.id] });
      toast({ title: 'Success', description: 'Topic updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update topic', variant: 'destructive' });
      console.error('Error updating topic:', error);
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from('syllabus_topics')
        .delete()
        .eq('id', topicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus-topics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subtopics', user?.id] });
      toast({ title: 'Success', description: 'Topic deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete topic', variant: 'destructive' });
      console.error('Error deleting topic:', error);
    },
  });

  // Update subtopic mutation
  const updateSubtopicMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string }) => {
      const { error } = await supabase
        .from('subtopics')
        .update({
          title: data.title,
          description: data.description,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtopics', user?.id] });
      toast({ title: 'Success', description: 'Subtopic updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update subtopic', variant: 'destructive' });
      console.error('Error updating subtopic:', error);
    },
  });

  // Delete subtopic mutation
  const deleteSubtopicMutation = useMutation({
    mutationFn: async (subtopicId: string) => {
      const { error } = await supabase
        .from('subtopics')
        .delete()
        .eq('id', subtopicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtopics', user?.id] });
      toast({ title: 'Success', description: 'Subtopic deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete subtopic', variant: 'destructive' });
      console.error('Error deleting subtopic:', error);
    },
  });

  // Handler functions for editing and deleting
  const handleEditTopic = (topic: SyllabusTopic) => {
    setEditingTopic(topic);
    setTopicFormData({ title: topic.title, description: topic.description || '' });
    setSelectedSubjectId(topic.subject_id);
    setIsTopicDialogOpen(true);
  };

  const handleUpdateTopic = () => {
    if (!topicFormData.title.trim()) {
      toast({ title: "Error", description: "Topic title is required", variant: "destructive" });
      return;
    }

    if (editingTopic) {
      updateTopicMutation.mutate({
        id: editingTopic.id,
        title: topicFormData.title,
        description: topicFormData.description,
      });
    } else {
      createTopicMutation.mutate({
        title: topicFormData.title,
        description: topicFormData.description,
        subject_id: selectedSubjectId,
      });
    }
  };

  const handleDeleteTopic = (topicId: string) => {
    setTopicToDeleteId(topicId);
    setIsDeleteTopicDialogOpen(true);
  };

  const handleConfirmDeleteTopic = () => {
    if (topicToDeleteId) {
      deleteTopicMutation.mutate(topicToDeleteId);
    }
    setIsDeleteTopicDialogOpen(false);
    setTopicToDeleteId(null);
  };

  const handleEditSubtopic = (subtopic: Subtopic) => {
    setEditingSubtopic(subtopic);
    setSubtopicFormData({ title: subtopic.title, description: subtopic.description || '' });
    setSelectedTopicId(subtopic.topic_id);
    setIsSubtopicDialogOpen(true);
  };

  const handleUpdateSubtopic = () => {
    if (editingSubtopic && subtopicFormData.title.trim()) {
      updateSubtopicMutation.mutate({
        id: editingSubtopic.id,
        title: subtopicFormData.title,
        description: subtopicFormData.description
      });
      setEditingSubtopic(null);
      setSubtopicFormData({ title: '', description: '' });
      setIsSubtopicDialogOpen(false);
    }
  };

  const handleDeleteSubtopic = (subtopicId: string) => {
    if (confirm('Are you sure you want to delete this subtopic?')) {
      deleteSubtopicMutation.mutate(subtopicId);
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getSubjectsWithTopicsAndSubtopics = (): SubjectWithTopics[] => {
    return subjects.map(subject => {
      const subjectTopics = topics.filter(topic => topic.subject_id === subject.id);
      const topicsWithSubtopics = subjectTopics.map(topic => ({
        ...topic,
        subtopics: subtopics.filter(subtopic => subtopic.topic_id === topic.id),
      }));
      
      return {
        ...subject,
        description: subject.name, // Using name as description fallback since description doesn't exist in Subject table
        topics: topicsWithSubtopics,
      } as SubjectWithTopics;
    });
  };

  const subjectsWithData = getSubjectsWithTopicsAndSubtopics();

  if (topicsLoading || subtopicsLoading || subjectsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={isDeleteTopicDialogOpen} onOpenChange={setIsDeleteTopicDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this topic? This will also delete all associated subtopics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteTopic}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Syllabus Management</h3>
        <div className="flex gap-2">
          <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={!canEdit}
                onClick={() => {
                  setEditingTopic(null);
                  setTopicFormData({ title: '', description: '' });
                  setSelectedSubjectId('');
                }}
              >
                <Target className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add Syllabus Topic'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingTopic) {
                  handleUpdateTopic();
                } else if (selectedSubjectId && topicFormData.title.trim()) {
                  createTopicMutation.mutate({
                    title: topicFormData.title,
                    description: topicFormData.description,
                    subject_id: selectedSubjectId
                  });
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_select">Subject *</Label>
                  <select
                    id="subject_select"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic_title">Topic Title *</Label>
                  <Input
                    id="topic_title"
                    value={topicFormData.title}
                    onChange={(e) => setTopicFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter topic title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic_description">Description</Label>
                  <Textarea
                    id="topic_description"
                    value={topicFormData.description}
                    onChange={(e) => setTopicFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter topic description (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createTopicMutation.isPending || updateTopicMutation.isPending} className="flex-1">
                    {editingTopic 
                      ? (updateTopicMutation.isPending ? "Updating..." : "Update Topic")
                      : (createTopicMutation.isPending ? "Creating..." : "Create Topic")
                    }
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsTopicDialogOpen(false);
                    setEditingTopic(null);
                    setTopicFormData({ title: '', description: '' });
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isSubtopicDialogOpen} onOpenChange={setIsSubtopicDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={!canEdit}
                onClick={() => {
                  setEditingSubtopic(null);
                  setSubtopicFormData({ title: '', description: '' });
                  setSelectedTopicId('');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subtopic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubtopic ? 'Edit Subtopic' : 'Add Subtopic'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingSubtopic) {
                  handleUpdateSubtopic();
                } else if (selectedTopicId && subtopicFormData.title.trim()) {
                  createSubtopicMutation.mutate({
                    title: subtopicFormData.title,
                    description: subtopicFormData.description,
                    topic_id: selectedTopicId
                  });
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic_select">Topic *</Label>
                  <select
                    id="topic_select"
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select a topic</option>
                    {topics.map(topic => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title} ({getSubjectName(topic.subject_id)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtopic_title">Subtopic Title *</Label>
                  <Input
                    id="subtopic_title"
                    value={subtopicFormData.title}
                    onChange={(e) => setSubtopicFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter subtopic title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtopic_description">Description</Label>
                  <Textarea
                    id="subtopic_description"
                    value={subtopicFormData.description}
                    onChange={(e) => setSubtopicFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter subtopic description (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createSubtopicMutation.isPending || updateSubtopicMutation.isPending} className="flex-1">
                    {editingSubtopic 
                      ? (updateSubtopicMutation.isPending ? "Updating..." : "Update Subtopic")
                      : (createSubtopicMutation.isPending ? "Creating..." : "Create Subtopic")
                    }
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsSubtopicDialogOpen(false);
                    setEditingSubtopic(null);
                    setSubtopicFormData({ title: '', description: '' });
                    setSelectedTopicId('');
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectsWithData.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No subjects found</p>
            <p className="text-sm">Create a subject first to get started</p>
          </div>
        ) : (
          subjectsWithData.map((subject) => (
            <Card key={subject.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary">
              <CardHeader onClick={() => {
                setSelectedSubject(subject as SubjectWithTopics);
                setIsSubjectModalOpen(true);
              }}>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                {subject.description && (
                  <p className="text-sm text-muted-foreground mb-3">{subject.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-sm">
                    {subject.topics?.length || 0} topics
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {subject.topics?.reduce((total, topic) => total + (topic.subtopics?.length || 0), 0) || 0} subtopics
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Subject Detail Modal */}
      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{selectedSubject?.name}</DialogTitle>
                {selectedSubject?.description && (
                  <p className="text-muted-foreground">{selectedSubject.description}</p>
                )}
              </div>
              {canEdit && (
                <Button
                  onClick={() => {
                    setEditingTopic(null);
                    setTopicFormData({ title: '', description: '' });
                    setSelectedSubjectId(selectedSubject?.id || '');
                    setIsTopicDialogOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topic
                </Button>
              )}
            </div>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(selectedSubject as SubjectWithTopics).topics?.map((topic) => (
                  <Card
                    key={topic.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedTopic(topic);
                      setIsTopicModalOpen(true);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{topic.title}</h3>
                          <Badge variant="outline" className="mt-2">
                            {topic.subtopics?.length || 0} subtopics
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTopic(topic);
                            }}
                            className="h-8 w-8 p-0"
                            disabled={!canEdit}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTopic(topic.id);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={!canEdit}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                      )}
                    </CardHeader>
                  </Card>
                )) || []}
                {(!(selectedSubject as SubjectWithTopics).topics || (selectedSubject as SubjectWithTopics).topics.length === 0) && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No topics yet for this subject</p>
                    <p className="text-sm">Add your first topic to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Topic Detail Modal */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedTopic?.title}</DialogTitle>
            {selectedTopic?.description && (
              <p className="text-muted-foreground">{selectedTopic.description}</p>
            )}
          </DialogHeader>
          {selectedTopic && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Subtopics</h4>
                <Button 
                  onClick={() => {
                    setEditingSubtopic(null);
                    setSubtopicFormData({ title: '', description: '' });
                    setSelectedTopicId(selectedTopic.id);
                    setIsSubtopicDialogOpen(true);
                  }}
                  size="sm"
                  disabled={!canEdit}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subtopic
                </Button>
              </div>
              <div className="space-y-3">
                {selectedTopic.subtopics?.map((subtopic) => (
                  <div
                    key={subtopic.id}
                    className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30"
                  >
                    <input
                      type="checkbox"
                      checked={subtopic.completed}
                      onChange={(e) => toggleSubtopicMutation.mutate({
                        id: subtopic.id,
                        completed: e.target.checked
                      })}
                      className="rounded"
                      disabled={!canEdit}
                    />
                    <div className="flex-1">
                      <h4 className={`font-medium ${subtopic.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {subtopic.title}
                      </h4>
                      {subtopic.description && (
                        <p className="text-sm text-muted-foreground">{subtopic.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSubtopic(subtopic);
                        }}
                        className="h-8 w-8 p-0"
                        disabled={!canEdit}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubtopic(subtopic.id);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={!canEdit}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) || []}
                {(!selectedTopic.subtopics || selectedTopic.subtopics.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No subtopics yet for this topic</p>
                    <p className="text-sm">Add your first subtopic to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* End of component */}
    </div>
  );
};