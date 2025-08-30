import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, X } from 'lucide-react';
import { 
  useTodayMeldungen, 
  useLastSchoolDayMeldungen, 
  useWeekMeldungen, 
  useMonthMeldungen,
  calculateMeldungenStats 
} from '@/hooks/use-meldungen';
import { QuickAddModal } from './quick-add-modal';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface MeldungenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MeldungenModal({ isOpen, onClose }: MeldungenModalProps) {
  const [activeTab, setActiveTab] = useState('heute');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const { data: todayMeldungen = [], isLoading: todayLoading } = useTodayMeldungen();
  const { data: lastSchoolDay, isLoading: lastDayLoading } = useLastSchoolDayMeldungen();
  const { data: weekMeldungen = [], isLoading: weekLoading } = useWeekMeldungen();
  const { data: monthMeldungen = [], isLoading: monthLoading } = useMonthMeldungen();

  const todayStats = calculateMeldungenStats(todayMeldungen);
  const lastDayStats = lastSchoolDay ? calculateMeldungenStats(lastSchoolDay.meldungen) : null;
  const weekStats = calculateMeldungenStats(weekMeldungen);
  const monthStats = calculateMeldungenStats(monthMeldungen);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const renderSubjectDistribution = (meldungen: any[], maxCount?: number) => {
    if (!meldungen.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Keine Meldungen vorhanden
        </div>
      );
    }

    const max = maxCount || Math.max(...meldungen.map(m => m.count));
    
    return (
      <div className="space-y-3">
        {meldungen
          .filter(m => m.count > 0)
          .sort((a, b) => b.count - a.count)
          .map((meldung) => (
            <div key={`${meldung.subject_id}-${meldung.date}`} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{meldung.subject?.name || 'Unbekanntes Fach'}</span>
                <Badge variant="secondary">{meldung.count}</Badge>
              </div>
              <Progress 
                value={(meldung.count / max) * 100} 
                className="h-2" 
              />
            </div>
          ))
        }
      </div>
    );
  };

  const renderKPIs = (stats: { total: number; average: number; subjectCount: number }, period: string) => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Total {period}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.average}</div>
          <p className="text-xs text-muted-foreground">Ø pro Fach</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.subjectCount}</div>
          <p className="text-xs text-muted-foreground">Aktive Fächer</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Meldungen – Heute</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuickAddOpen(true)}
                className="ml-auto mr-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="heute">Heute</TabsTrigger>
              <TabsTrigger value="letzter">Letzter Schultag</TabsTrigger>
              <TabsTrigger value="woche">Woche</TabsTrigger>
              <TabsTrigger value="monat">Monat</TabsTrigger>
            </TabsList>

            <TabsContent value="heute" className="space-y-4">
              {todayLoading ? (
                <div className="text-center py-8">Lade...</div>
              ) : (
                <>
                  {renderKPIs(todayStats, 'heute')}
                  {renderSubjectDistribution(todayMeldungen)}
                </>
              )}
            </TabsContent>

            <TabsContent value="letzter" className="space-y-4">
              {lastDayLoading ? (
                <div className="text-center py-8">Lade...</div>
              ) : lastSchoolDay && lastSchoolDay.date ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {formatDate(lastSchoolDay.date)}
                    </h3>
                  </div>
                  {lastDayStats && renderKPIs(lastDayStats, 'am letzten Schultag')}
                  {renderSubjectDistribution(lastSchoolDay.meldungen)}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Keine vorherigen Schultage mit Meldungen gefunden
                </div>
              )}
            </TabsContent>

            <TabsContent value="woche" className="space-y-4">
              {weekLoading ? (
                <div className="text-center py-8">Lade...</div>
              ) : (
                <>
                  {renderKPIs(weekStats, 'diese Woche')}
                  {renderSubjectDistribution(weekMeldungen)}
                </>
              )}
            </TabsContent>

            <TabsContent value="monat" className="space-y-4">
              {monthLoading ? (
                <div className="text-center py-8">Lade...</div>
              ) : (
                <>
                  {renderKPIs(monthStats, 'diesen Monat')}
                  {renderSubjectDistribution(monthMeldungen)}
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <QuickAddModal 
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </>
  );
}