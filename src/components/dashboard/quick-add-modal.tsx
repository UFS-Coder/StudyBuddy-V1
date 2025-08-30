import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { useSubjects } from '@/hooks/use-subjects';
import { useTodayMeldungen, useUpdateMeldungen, getTodayInBerlin } from '@/hooks/use-meldungen';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubjectCount {
  subject_id: string;
  subject_name: string;
  count: number;
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getTodayInBerlin());
  const [subjectCounts, setSubjectCounts] = useState<SubjectCount[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: subjects = [] } = useSubjects();
  const { data: todayMeldungen = [] } = useTodayMeldungen();
  const updateMeldungen = useUpdateMeldungen();

  // Initialize subject counts when modal opens or data changes
  useEffect(() => {
    if (isOpen && subjects.length > 0) {
      const initialCounts: SubjectCount[] = subjects
        .map(subject => {
          const existingMeldung = todayMeldungen?.find(
            m => m.subject_id === subject.id
          );
          return {
            subject_id: subject.id,
            subject_name: subject.name,
            count: existingMeldung?.count || 0
          };
        });
      
      setSubjectCounts(initialCounts);
      setHasChanges(false);
    }
  }, [isOpen, subjects]);

  const updateCount = (subjectId: string, delta: number) => {
    setSubjectCounts(prev => 
      prev.map(item => {
        if (item.subject_id === subjectId) {
          return { ...item, count: Math.max(0, item.count + delta) };
        }
        return item;
      })
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    const updates = subjectCounts.map(item => ({
      subject_id: item.subject_id,
      date: selectedDate,
      count: item.count
    }));

    try {
      await updateMeldungen.mutateAsync(updates);
      onClose();
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving meldungen:', error);
      // Error handling is done in the mutation
    }
  };

  const handleCancel = () => {
    onClose();
    setHasChanges(false);
  };

  const formatSelectedDate = () => {
    try {
      const date = new Date(selectedDate);
      return format(date, 'dd.MM.yyyy', { locale: de });
    } catch {
      return selectedDate;
    }
  };

  const totalToday = subjectCounts.reduce((sum, item) => sum + item.count, 0);

  if (subjects.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keine Fächer verfügbar</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <p>Du hast noch keine aktiven Fächer.</p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => {
                onClose();
                navigate('/subjects');
              }}
            >
              Fächer verwalten
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Meldungen hinzufügen – {formatSelectedDate()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date selector - for future enhancement */}
          <div className="space-y-2">
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Total display */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalToday}</div>
              <div className="text-sm text-muted-foreground">Gesamt heute</div>
            </div>
          </div>

          {/* Subject controls */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {subjectCounts.map((item, index) => (
              <div 
                key={`${item.subject_id}-${index}`} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-medium">{item.subject_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateCount(item.subject_id, -1);
                        }}
                        disabled={item.count === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                  
                  <span className="min-w-[2rem] text-center font-medium">
                    {item.count}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateCount(item.subject_id, 1);
                    }}
                    aria-label={`${item.subject_name} Meldungen erhöhen`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={updateMeldungen.isPending}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateMeldungen.isPending || !hasChanges}
          >
            {updateMeldungen.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              'Speichern'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}