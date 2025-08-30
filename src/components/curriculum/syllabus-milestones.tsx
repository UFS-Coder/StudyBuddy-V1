import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Edit2,
  Trash2,
  Flag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { format, isAfter, isBefore, addDays } from 'date-fns';

type SyllabusMilestone = Tables<'syllabus_milestones'>;

interface SyllabusMilestonesProps {
  subjectId: string;
  userId: string;
}

const MILESTONE_TYPES = [
  { value: 'exam', label: 'Exam', icon: '📝' },
  { value: 'assignment', label: 'Assignment', icon: '📋' },
  { value: 'project', label: 'Project', icon: '🎯' },
  { value: 'presentation', label: 'Presentation', icon: '🎤' },
  { value: 'quiz', label: 'Quiz', icon: '❓' },
  { value: 'target_date', label: 'Target Date', icon: '⏰' },
  { value: 'review', label: 'Review', icon: '🔍' },
  { value: 'other', label: 'Other', icon: '📌' },
];

export function SyllabusMilestones({ subjectId, userId }: SyllabusMilestonesProps) {
  const [milestones, setMilestones] = useState<SyllabusMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    milestone_type: '',
    target_date: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMilestones();
  }, [subjectId]);

  const fetchMilestones = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('syllabus_milestones')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', userId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast({
        title: 'Error',
        description: 'Failed to load milestones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMilestone = async () => {
    if (!newMilestone.title.trim() || !newMilestone.milestone_type || !newMilestone.target_date) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('syllabus_milestones')
        .insert({
          title: newMilestone.title,
          description: newMilestone.description || null,
          milestone_type: newMilestone.milestone_type,
          target_date: newMilestone.target_date,
          subject_id: subjectId,
          user_id: userId,
          order_index: milestones.length,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setMilestones([...milestones, data].sort((a, b) => 
        new Date(a.target_date || '').getTime() - new Date(b.target_date || '').getTime()
      ));
      setNewMilestone({ title: '', description: '', milestone_type: '', target_date: '' });
      setIsAdding(false);
      toast({
        title: 'Success',
        description: 'Milestone added successfully',
      });
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to add milestone',
        variant: 'destructive',
      });
    }
  };

  const updateMilestone = async (id: string, updates: Partial<SyllabusMilestone>) => {
    try {
      const { error } = await supabase
        .from('syllabus_milestones')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setMilestones(milestones.map(milestone => 
        milestone.id === id ? { ...milestone, ...updates } : milestone
      ));
      
      if (updates.completed !== undefined) {
        toast({
          title: 'Success',
          description: `Milestone marked as ${updates.completed ? 'completed' : 'incomplete'}`,
        });
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update milestone',
        variant: 'destructive',
      });
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('syllabus_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMilestones(milestones.filter(milestone => milestone.id !== id));
      toast({
        title: 'Success',
        description: 'Milestone deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete milestone',
        variant: 'destructive',
      });
    }
  };

  const getMilestoneStatus = (milestone: SyllabusMilestone) => {
    if (milestone.completed) return 'completed';
    if (!milestone.target_date) return 'no-deadline';

    const targetDate = new Date(milestone.target_date);
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);

    if (isBefore(targetDate, now)) return 'overdue';
    if (isBefore(targetDate, threeDaysFromNow)) return 'due-soon';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-300 text-green-800';
      case 'overdue': return 'bg-red-100 border-red-300 text-red-800';
      case 'due-soon': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'upcoming': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'due-soon': return <Clock className="h-4 w-4" />;
      case 'upcoming': return <Calendar className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;
  const upcomingMilestones = milestones.filter(m => !m.completed && m.target_date && isAfter(new Date(m.target_date), new Date()));
  const overdueMilestones = milestones.filter(m => !m.completed && m.target_date && isBefore(new Date(m.target_date), new Date()));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Syllabus Milestones
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
            <Flag className="h-5 w-5" />
            Syllabus Milestones
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
            Add Milestone
          </Button>
        </CardTitle>
        
        {/* Summary Stats */}
        {totalCount > 0 && (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-700">{completedCount}</div>
              <div className="text-green-600">Completed</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-700">{upcomingMilestones.length}</div>
              <div className="text-blue-600">Upcoming</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="font-semibold text-red-700">{overdueMilestones.length}</div>
              <div className="text-red-600">Overdue</div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {milestones.map((milestone) => {
          const status = getMilestoneStatus(milestone);
          const milestoneType = MILESTONE_TYPES.find(t => t.value === milestone.milestone_type);
          
          return (
            <div
              key={milestone.id}
              className={`p-4 rounded-lg border-2 ${getStatusColor(status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={milestone.completed || false}
                    onCheckedChange={(checked) => 
                      updateMilestone(milestone.id, { completed: !!checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{milestoneType?.icon}</span>
                      <h4 className={`font-semibold ${
                        milestone.completed ? 'line-through opacity-60' : ''
                      }`}>
                        {milestone.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {milestoneType?.label}
                      </Badge>
                    </div>
                    
                    {milestone.description && (
                      <p className={`text-sm mb-2 ${
                        milestone.completed ? 'line-through opacity-60' : ''
                      }`}>
                        {milestone.description}
                      </p>
                    )}
                    
                    {milestone.target_date && (
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon(status)}
                        <span className={milestone.completed ? 'line-through opacity-60' : ''}>
                          {format(new Date(milestone.target_date), 'MMM dd, yyyy')}
                        </span>
                        {status === 'due-soon' && !milestone.completed && (
                          <Badge variant="destructive" className="text-xs">
                            Due Soon
                          </Badge>
                        )}
                        {status === 'overdue' && !milestone.completed && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    onClick={() => setEditingId(milestone.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => deleteMilestone(milestone.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {isAdding && (
          <div className="p-4 border rounded-lg bg-white space-y-3">
            <Input
              placeholder="Milestone title"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={newMilestone.milestone_type}
                onValueChange={(value) => setNewMilestone({ ...newMilestone, milestone_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={newMilestone.target_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, target_date: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addMilestone} size="sm">
                Add Milestone
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setNewMilestone({ title: '', description: '', milestone_type: '', target_date: '' });
                }}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {milestones.length === 0 && !isAdding && (
          <div className="text-center py-6 text-gray-500">
            <Flag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No milestones set yet</p>
            <p className="text-sm">Add milestones to track important deadlines</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}