import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus } from 'lucide-react';
import { useTodayMeldungen, useLastSchoolDayMeldungen, calculateMeldungenStats } from '@/hooks/use-meldungen';
import { MeldungenModal } from './meldungen-modal';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function MeldungenCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: todayMeldungen = [], isLoading: todayLoading } = useTodayMeldungen();
  const { data: lastSchoolDay, isLoading: lastDayLoading } = useLastSchoolDayMeldungen();

  const todayStats = calculateMeldungenStats(todayMeldungen);
  const lastDayStats = lastSchoolDay ? calculateMeldungenStats(lastSchoolDay.meldungen) : null;

  const formatLastSchoolDay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  if (todayLoading || lastDayLoading) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meldungen heute</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
          <div className="mt-2 animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow" 
        onClick={handleCardClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meldungen heute</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayStats.total}</div>
          
          {/* Last school day badge or empty state hint */}
          {todayStats.total === 0 ? (
            <p className="text-xs text-muted-foreground mt-2">
              Klicke, um zu erfassen
            </p>
          ) : lastDayStats && lastSchoolDay?.date ? (
            <Badge variant="secondary" className="mt-2 text-xs">
              Letzter Schultag: {lastDayStats.total} ({formatLastSchoolDay(lastSchoolDay.date)})
            </Badge>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Klicke, um zu erfassen
            </p>
          )}
          
          {/* Show last school day even when today has entries */}
          {todayStats.total > 0 && lastDayStats && lastSchoolDay?.date && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                Letzter Schultag: {lastDayStats.total} ({formatLastSchoolDay(lastSchoolDay.date)})
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <MeldungenModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}