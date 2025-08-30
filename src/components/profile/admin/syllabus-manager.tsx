import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Target, List, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

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
  const { data: subjects = [] } = useSubjects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isSubtopicDialogOpen, setIsSubtopicDialogOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [topicFormData, setTopicFormData] = useState({
    title: "",
    description: "",
    subject_id: "",
  });
  const [subtopicFormData, setSubtopicFormData] = useState({
    title: "",
    description: "",
  });

  // Fetch syllabus topics
  const { data: topics = [] } = useQuery({
    queryKey: ["syllabus_topics", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("syllabus_topics")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index");
      
      if (error) throw error;
      return data as SyllabusTopic[];
    },
    enabled: !!user,
  });

  // Fetch subtopics
  const { data: subtopics = [] } = useQuery({
    queryKey: ["subtopics", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("subtopics")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index");
      
      if (error) throw error;
      return data as Subtopic[];
    },
    enabled: !!user,
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: typeof topicFormData) => {
      if (!user) throw new Error("No user found");
      
      const { error } = await supabase
        .from("syllabus_topics")
        .insert([{
          user_id: user.id,
          subject_id: data.subject_id,
          title: data.title,
          description: data.description,
          order_index: topics.length,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus_topics", user?.id] });
      setIsTopicDialogOpen(false);
      setTopicFormData({ title: "", description: "", subject_id: "" });
      toast({ title: "Success", description: "Topic created successfully" });
    },
  });

  const createSubtopicMutation = useMutation({
    mutationFn: async (data: typeof subtopicFormData & { topic_id: string }) => {
      if (!user) throw new Error("No user found");
      
      const { error } = await supabase
        .from("subtopics")
        .insert([{
          user_id: user.id,
          topic_id: data.topic_id,
          title: data.title,
          description: data.description,
          order_index: subtopics.filter(st => st.topic_id === data.topic_id).length,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtopics", user?.id] });
      setIsSubtopicDialogOpen(false);
      setSubtopicFormData({ title: "", description: "" });
      setSelectedTopicId("");
      toast({ title: "Success", description: "Subtopic created successfully" });
    },
  });

  const toggleSubtopicMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("subtopics")
        .update({ completed })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtopics", user?.id] });
    },
  });

  const getTopicsWithSubtopics = () => {
    return topics.map(topic => ({
      ...topic,
      subtopics: subtopics.filter(st => st.topic_id === topic.id),
    }));
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "Unknown Subject";
  };

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
                if (topicFormData.title && topicFormData.subject_id) {
                  createTopicMutation.mutate(topicFormData);
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={topicFormData.subject_id} onValueChange={(value) => 
                    setTopicFormData(prev => ({ ...prev, subject_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Topic Title *</Label>
                  <Input
                    id="title"
                    value={topicFormData.title}
                    onChange={(e) => setTopicFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter topic title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
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
                <List className="h-4 w-4 mr-2" />
                Add Subtopic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subtopic</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (subtopicFormData.title && selectedTopicId) {
                  createSubtopicMutation.mutate({ ...subtopicFormData, topic_id: selectedTopicId });
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map(topic => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.title} - {getSubjectName(topic.subject_id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      <div className="space-y-4">
        {getTopicsWithSubtopics().map((topic) => (
          <Card key={topic.id}>
            <Collapsible defaultOpen>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                      <Badge variant="secondary">{getSubjectName(topic.subject_id)}</Badge>
                    </div>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                    )}
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {topic.subtopics?.map((subtopic) => (
                      <div
                        key={subtopic.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
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
                    ))}
                    {(!topic.subtopics || topic.subtopics.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">
                        No subtopics yet. Add some to track your progress.
                      </p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {topics.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No syllabus topics yet</h3>
            <p className="text-muted-foreground">Create your first topic to organize your curriculum</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};