import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type LearningObjective = Tables<'learning_objectives'>;

interface LearningObjectivesProps {
  topicId?: string;
  subtopicId?: string;
  userId: string;
}

export function LearningObjectives({ topicId, subtopicId, userId }: LearningObjectivesProps) {
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newObjective, setNewObjective] = useState({ title: '', description: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchObjectives();
  }, [topicId, subtopicId, userId]);

  const fetchObjectives = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('learning_objectives')
        .select('*')
        .eq('user_id', userId)
        .order('order_index', { ascending: true });

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }
      if (subtopicId) {
        query = query.eq('subtopic_id', subtopicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setObjectives(data || []);
    } catch (error) {
      console.error('Error fetching learning objectives:', error);
      toast({
        title: 'Error',
        description: 'Failed to load learning objectives',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addObjective = async () => {
    if (!newObjective.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('learning_objectives')
        .insert({
          title: newObjective.title,
          description: newObjective.description || null,
          topic_id: topicId || null,
          subtopic_id: subtopicId || null,
          user_id: userId,
          order_index: objectives.length,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setObjectives([...objectives, data]);
      setNewObjective({ title: '', description: '' });
      setIsAdding(false);
      toast({
        title: 'Success',
        description: 'Learning objective added successfully',
      });
    } catch (error) {
      console.error('Error adding learning objective:', error);
      toast({
        title: 'Error',
        description: 'Failed to add learning objective',
        variant: 'destructive',
      });
    }
  };

  const updateObjective = async (id: string, updates: Partial<LearningObjective>) => {
    try {
      const { error } = await supabase
        .from('learning_objectives')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setObjectives(objectives.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      ));
      
      if (updates.completed !== undefined) {
        toast({
          title: 'Success',
          description: `Objective marked as ${updates.completed ? 'completed' : 'incomplete'}`,
        });
      }
    } catch (error) {
      console.error('Error updating learning objective:', error);
      toast({
        title: 'Error',
        description: 'Failed to update learning objective',
        variant: 'destructive',
      });
    }
  };

  const deleteObjective = async (id: string) => {
    try {
      const { error } = await supabase
        .from('learning_objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setObjectives(objectives.filter(obj => obj.id !== id));
      toast({
        title: 'Success',
        description: 'Learning objective deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting learning objective:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete learning objective',
        variant: 'destructive',
      });
    }
  };

  const completedCount = objectives.filter(obj => obj.completed).length;
  const totalCount = objectives.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Objectives
            {totalCount > 0 && (
              <Badge variant="outline">
                {completedCount}/{totalCount}
              </Badge>
            )}
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Objective
          </Button>
        </CardTitle>
        {totalCount > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {objectives.map((objective) => (
          <div
            key={objective.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              objective.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50'
            }`}
          >
            <Checkbox
              checked={objective.completed || false}
              onCheckedChange={(checked) => 
                updateObjective(objective.id, { completed: !!checked })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <h4 className={`font-medium ${
                objective.completed ? 'line-through text-gray-500' : ''
              }`}>
                {objective.title}
              </h4>
              {objective.description && (
                <p className={`text-sm text-gray-600 mt-1 ${
                  objective.completed ? 'line-through' : ''
                }`}>
                  {objective.description}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => setEditingId(objective.id)}
                size="sm"
                variant="ghost"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => deleteObjective(objective.id)}
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        {isAdding && (
          <div className="p-3 border rounded-lg bg-white space-y-3">
            <Input
              placeholder="Objective title"
              value={newObjective.title}
              onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newObjective.description}
              onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={addObjective} size="sm">
                Add
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setNewObjective({ title: '', description: '' });
                }}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {objectives.length === 0 && !isAdding && (
          <div className="text-center py-6 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No learning objectives yet</p>
            <p className="text-sm">Add objectives to track your learning progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}