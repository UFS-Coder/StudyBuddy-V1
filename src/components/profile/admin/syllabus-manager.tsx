import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Target, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface SyllabusTopic {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  order_index: number;
  subtopics?: Subtopic[];
}

interface Subtopic {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order_index: number;
  topic_id: string;
}

export const SyllabusManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isSubtopicDialogOpen, setIsSubtopicDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [topicFormData, setTopicFormData] = useState({ title: '', description: '' });
  const [subtopicFormData, setSubtopicFormData] = useState({ title: '', description: '' });
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');
  const [newSubtopicDescription, setNewSubtopicDescription] = useState('');

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
      setIsTopicDialogOpen(false);
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
          completed: false,
          order_index: subtopics.filter(s => s.topic_id === data.topic_id).length,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtopics', user?.id] });
      setSubtopicFormData({ title: '', description: '' });
      setIsSubtopicDialogOpen(false);
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

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getSubjectsWithTopicsAndSubtopics = () => {
    return subjects.map(subject => {
      const subjectTopics = topics.filter(topic => topic.subject_id === subject.id);
      const topicsWithSubtopics = subjectTopics.map(topic => ({
        ...topic,
        subtopics: subtopics.filter(subtopic => subtopic.topic_id === topic.id),
      }));
      
      return {
        ...subject,
        topics: topicsWithSubtopics,
      };
    });
  };

  const subjectsWithData = getSubjectsWithTopicsAndSubtopics();

  if (topicsLoading || subtopicsLoading || subjectsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Syllabus Management</h3>
        <div className="flex gap-2">
          <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Target className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Syllabus Topic</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedSubjectId && topicFormData.title.trim()) {
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
                    placeholder="Enter topic description"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createTopicMutation.isPending} className="flex-1">
                    {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsTopicDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isSubtopicDialogOpen} onOpenChange={setIsSubtopicDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Subtopic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subtopic</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedTopicId && subtopicFormData.title.trim()) {
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
                        {topic.title} - {getSubjectName(topic.subject_id)}
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
                    placeholder="Enter subtopic description"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createSubtopicMutation.isPending} className="flex-1">
                    {createSubtopicMutation.isPending ? "Creating..." : "Create Subtopic"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsSubtopicDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectsWithData.map((subject) => (
          <Card key={subject.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
            setSelectedSubject(subject);
            setIsSubjectModalOpen(true);
          }}>
            <Collapsible>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: subject.color }}
                      />
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">{subject.topics?.length || 0} topics</Badge>
                    <div className="text-xs text-muted-foreground">
                      {subject.teacher && <div>Teacher: {subject.teacher}</div>}
                      {subject.room && <div>Room: {subject.room}</div>}
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {subject.topics?.map((topic) => (
                    <div key={topic.id} className="border rounded-lg p-3 bg-muted/30">
                      <Collapsible>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Target className="h-3 w-3" />
                              <h4 className="font-medium text-sm">{topic.title}</h4>
                              <Badge variant="secondary" className="text-xs">{topic.subtopics?.length || 0}</Badge>
                            </div>
                            {topic.description && (
                              <p className="text-xs text-muted-foreground mt-1">{topic.description}</p>
                            )}
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className="mt-3 space-y-2">
                            {topic.subtopics?.map((subtopic) => (
                              <div
                                key={subtopic.id}
                                className="flex items-center gap-2 p-2 rounded bg-background/50"
                              >
                                <input
                                  type="checkbox"
                                  checked={subtopic.completed}
                                  onChange={(e) => toggleSubtopicMutation.mutate({
                                    id: subtopic.id,
                                    completed: e.target.checked
                                  })}
                                  className="rounded"
                                />
                                <div className="flex-1">
                                  <span className={`text-xs ${subtopic.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {subtopic.title}
                                  </span>
                                  {subtopic.description && (
                                    <p className="text-xs text-muted-foreground">{subtopic.description}</p>
                                  )}
                                </div>
                              </div>
                            )) || []}
                            {(!topic.subtopics || topic.subtopics.length === 0) && (
                              <p className="text-xs text-muted-foreground text-center py-2">No subtopics yet</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )) || []}
                  {(!subject.topics || subject.topics.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No topics yet</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {subjectsWithData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No subjects yet</h3>
            <p className="text-muted-foreground">Create subjects first, then add topics and subtopics to organize your curriculum</p>
          </CardContent>
        </Card>
      )}

      {/* Subject Modal */}
      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSubject && (
                <>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: selectedSubject.color }}
                  />
                  {selectedSubject.name} - Topics
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {selectedSubject.teacher && <span>Teacher: {selectedSubject.teacher}</span>}
                  {selectedSubject.room && <span className="ml-4">Room: {selectedSubject.room}</span>}
                </div>
                <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedSubjectId(selectedSubject.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Topic
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Topic</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="topic-title">Topic Title</Label>
                        <Input
                          id="topic-title"
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          placeholder="Enter topic title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="topic-description">Description</Label>
                        <Textarea
                          id="topic-description"
                          value={newTopicDescription}
                          onChange={(e) => setNewTopicDescription(e.target.value)}
                          placeholder="Enter topic description"
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          createTopicMutation.mutate({
                            title: newTopicTitle,
                            description: newTopicDescription,
                            subject_id: selectedSubjectId
                          });
                          setIsTopicDialogOpen(false);
                          setNewTopicTitle('');
                          setNewTopicDescription('');
                        }}
                        disabled={!newTopicTitle.trim()}
                      >
                        Create Topic
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSubject.topics?.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                    setSelectedTopic(topic);
                    setIsTopicModalOpen(true);
                  }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <Badge variant="secondary">{topic.subtopics?.length || 0} subtopics</Badge>
                      </div>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                      )}
                    </CardHeader>
                  </Card>
                )) || []}
                {(!selectedSubject.topics || selectedSubject.topics.length === 0) && (
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

      {/* Topic Modal */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTopic && (
                <>
                  <Target className="h-5 w-5" />
                  {selectedTopic.title} - Subtopics
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTopic && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {selectedTopic.description && <p>{selectedTopic.description}</p>}
                </div>
                <Dialog open={isSubtopicDialogOpen} onOpenChange={setIsSubtopicDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedTopicId(selectedTopic.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subtopic
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subtopic</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subtopic-title">Subtopic Title</Label>
                        <Input
                          id="subtopic-title"
                          value={newSubtopicTitle}
                          onChange={(e) => setNewSubtopicTitle(e.target.value)}
                          placeholder="Enter subtopic title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subtopic-description">Description</Label>
                        <Textarea
                          id="subtopic-description"
                          value={newSubtopicDescription}
                          onChange={(e) => setNewSubtopicDescription(e.target.value)}
                          placeholder="Enter subtopic description"
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          createSubtopicMutation.mutate({
                            title: newSubtopicTitle,
                            description: newSubtopicDescription,
                            topic_id: selectedTopicId
                          });
                          setIsSubtopicDialogOpen(false);
                          setNewSubtopicTitle('');
                          setNewSubtopicDescription('');
                        }}
                        disabled={!newSubtopicTitle.trim()}
                      >
                        Create Subtopic
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                    />
                    <div className="flex-1">
                      <h4 className={`font-medium ${subtopic.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {subtopic.title}
                      </h4>
                      {subtopic.description && (
                        <p className="text-sm text-muted-foreground">{subtopic.description}</p>
                      )}
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
    </div>
  );
};