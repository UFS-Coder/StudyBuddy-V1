import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isValidGermanGrade, formatGrade } from '@/lib/grade-calculations';
import { useAuth } from '@/hooks/use-auth';
import { useCanEdit } from '@/hooks/use-parent-permissions';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface GradeInputProps {
  subjectId: string;
  subjectName: string;
  onGradeAdded?: () => void;
}

interface GradeFormData {
  title: string;
  grade: string;
  weight: string;
  type: string;
  notes: string;
  date_received: string;
}

const GRADE_TYPES = [
  // 1. Written exams
  'Klausur',
  'Klassenarbeit',
  'Test',
  
  // 2. SoMi (Sonstige Mitarbeit)
  'Meldung',
  'Hausaufgabe',
  'Mitarbeit',
  'Mündliche Note',
  
  // 3. Projects, presentations, Facharbeit
  'Referat',
  'Präsentation',
  'Projekt',
  'Facharbeit',
  
  // 4. Special/practical subject elements
  'Praktikum',
  'Laborarbeit',
  'Experiment',
  'Exkursion',
  
  // 5. Effort & progress (qualitative assessment)
  'Lernfortschritt',
  'Anstrengungsbereitschaft',
  
  'Sonstiges'
];

export const GradeInput: React.FC<GradeInputProps> = ({ 
  subjectId, 
  subjectName, 
  onGradeAdded 
}) => {
  const { user } = useAuth();
  const canEdit = useCanEdit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<GradeFormData>({
    title: '',
    grade: '',
    weight: '1.0',
    type: 'Test',
    notes: '',
    date_received: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<Partial<GradeFormData>>({});

  const addGradeMutation = useMutation({
    mutationFn: async (data: GradeFormData) => {
      if (!user) throw new Error('No user found');
      
      const { error } = await supabase
        .from('grades')
        .insert([{
          user_id: user.id,
          subject_id: subjectId,
          title: data.title,
          grade: parseFloat(data.grade),
          weight: parseFloat(data.weight),
          type: data.type,
          notes: data.notes || null,
          date_received: data.date_received
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subjects', user?.id] });
      setIsOpen(false);
      resetForm();
      onGradeAdded?.();
      toast({
        title: 'Erfolg',
        description: 'Note erfolgreich hinzugefügt',
      });
    },
    onError: (error) => {
      console.error('Error adding grade:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Hinzufügen der Note. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      grade: '',
      weight: '1.0',
      type: 'Test',
      notes: '',
      date_received: new Date().toISOString().split('T')[0]
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<GradeFormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    
    if (!formData.grade.trim()) {
      newErrors.grade = 'Note ist erforderlich';
    } else {
      const gradeValue = parseFloat(formData.grade);
      if (isNaN(gradeValue) || !isValidGermanGrade(gradeValue)) {
        newErrors.grade = 'Note muss zwischen 1,0 und 6,0 liegen';
      }
    }
    
    if (!formData.weight.trim()) {
      newErrors.weight = 'Gewichtung ist erforderlich';
    } else {
      const weightValue = parseFloat(formData.weight);
      if (isNaN(weightValue) || weightValue <= 0 || weightValue > 10) {
        newErrors.weight = 'Gewichtung muss zwischen 0,1 und 10,0 liegen';
      }
    }
    
    if (!formData.date_received) {
      newErrors.date_received = 'Datum ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      addGradeMutation.mutate(formData);
    }
  };

  const getGradeInputColor = (grade: string): string => {
    if (!grade) return '';
    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue)) return 'border-red-300';
    if (!isValidGermanGrade(gradeValue)) return 'border-red-300';
    
    if (gradeValue <= 1.5) return 'border-green-300';
    if (gradeValue <= 2.5) return 'border-blue-300';
    if (gradeValue <= 3.5) return 'border-yellow-300';
    if (gradeValue <= 4.0) return 'border-orange-300';
    return 'border-red-300';
  };

  // Don't render the add grade button if user can't edit (parent mode)
  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={resetForm} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Note hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Note hinzufügen - {subjectName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="z.B. Klassenarbeit Kapitel 3"
              className={errors.title ? 'border-red-300' : ''}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Note (1-6) *</Label>
              <Input
                id="grade"
                type="number"
                step="0.1"
                min="1.0"
                max="6.0"
                value={formData.grade}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="z.B. 2.3"
                className={`${errors.grade ? 'border-red-300' : getGradeInputColor(formData.grade)}`}
              />
              {errors.grade && <p className="text-sm text-red-600">{errors.grade}</p>}
              {formData.grade && isValidGermanGrade(parseFloat(formData.grade)) && (
                <p className="text-xs text-muted-foreground">
                  Formatiert: {formatGrade(parseFloat(formData.grade))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Gewichtung *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0.1"
                max="10.0"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className={errors.weight ? 'border-red-300' : ''}
              />
              {errors.weight && <p className="text-sm text-red-600">{errors.weight}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <Select value={formData.type} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_received">Datum *</Label>
              <Input
                id="date_received"
                type="date"
                value={formData.date_received}
                onChange={(e) => setFormData(prev => ({ ...prev, date_received: e.target.value }))}
                className={errors.date_received ? 'border-red-300' : ''}
              />
              {errors.date_received && <p className="text-sm text-red-600">{errors.date_received}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={addGradeMutation.isPending} 
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {addGradeMutation.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};