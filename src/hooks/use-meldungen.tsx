import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Europe/Berlin';

export interface Meldung {
  id: string;
  subject_id: string;
  user_id: string;
  date: string; // ISO date string YYYY-MM-DD
  count: number;
  updated_at: string;
  created_at: string;
}

export interface MeldungWithSubject extends Meldung {
  subject: {
    id: string;
    name: string;
  };
}

// Helper function to get today's date in Berlin timezone
export const getTodayInBerlin = (): string => {
  const now = new Date();
  const berlinTime = toZonedTime(now, TIMEZONE);
  return format(berlinTime, 'yyyy-MM-dd');
};

// Helper function to get date range for current week (Monday to Sunday)
export const getCurrentWeekRange = (): { start: string; end: string } => {
  const today = toZonedTime(new Date(), TIMEZONE);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
  
  return {
    start: format(weekStart, 'yyyy-MM-dd'),
    end: format(weekEnd, 'yyyy-MM-dd')
  };
};

// Helper function to get date range for current month
export const getCurrentMonthRange = (): { start: string; end: string } => {
  const today = toZonedTime(new Date(), TIMEZONE);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  return {
    start: format(monthStart, 'yyyy-MM-dd'),
    end: format(monthEnd, 'yyyy-MM-dd')
  };
};

export const useMeldungen = (dateRange?: { start: string; end: string }) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['meldungen', user?.id, dateRange],
    queryFn: async (): Promise<MeldungWithSubject[]> => {
      if (!user) throw new Error('User not authenticated');
      
      // Using any type for now until meldungen table is properly created
      let query = (supabase as any)
        .from('meldungen')
        .select(`
          id,
          subject_id,
          user_id,
          date,
          count,
          updated_at,
          created_at,
          subject:subjects(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (dateRange) {
        query = query
          .gte('date', dateRange.start)
          .lte('date', dateRange.end);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as MeldungWithSubject[];
    },
    enabled: !!user,
  });
};

// Hook for today's meldungen
export const useTodayMeldungen = () => {
  const today = getTodayInBerlin();
  return useMeldungen({ start: today, end: today });
};

// Hook for current week's meldungen
export const useWeekMeldungen = () => {
  const weekRange = getCurrentWeekRange();
  return useMeldungen(weekRange);
};

// Hook for current month's meldungen
export const useMonthMeldungen = () => {
  const monthRange = getCurrentMonthRange();
  return useMeldungen(monthRange);
};

// Hook for last school day (most recent day with entries, excluding today)
export const useLastSchoolDayMeldungen = () => {
  const { user } = useAuth();
  const today = getTodayInBerlin();
  
  return useQuery({
    queryKey: ['last-school-day-meldungen', user?.id],
    queryFn: async (): Promise<{ date: string; meldungen: MeldungWithSubject[] }> => {
      if (!user) throw new Error('User not authenticated');
      
      // First, find the most recent date with meldungen (excluding today)
      const { data: recentDates, error: datesError } = await (supabase as any)
        .from('meldungen')
        .select('date')
        .eq('user_id', user.id)
        .lt('date', today)
        .gt('count', 0)
        .order('date', { ascending: false })
        .limit(1);
      
      if (datesError) throw datesError;
      
      if (!recentDates || recentDates.length === 0) {
        return { date: '', meldungen: [] };
      }
      
      const lastSchoolDay = recentDates[0].date;
      
      // Now get all meldungen for that date
      const { data: meldungen, error: meldungenError } = await (supabase as any)
        .from('meldungen')
        .select(`
          id,
          subject_id,
          user_id,
          date,
          count,
          updated_at,
          created_at,
          subject:subjects(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('date', lastSchoolDay)
        .order('count', { ascending: false });
      
      if (meldungenError) throw meldungenError;
      
      return {
        date: lastSchoolDay,
        meldungen: (meldungen || []) as MeldungWithSubject[]
      };
    },
    enabled: !!user,
  });
};

// Mutation for updating meldungen
export const useUpdateMeldungen = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: { subject_id: string; date: string; count: number }[]) => {
      if (!user) throw new Error('User not authenticated');
      
      const upsertPromises = updates.map(async (update) => {
        const { data, error } = await (supabase as any)
          .from('meldungen')
          .upsert({
            user_id: user.id,
            subject_id: update.subject_id,
            date: update.date,
            count: update.count,
          }, {
            onConflict: 'user_id,subject_id,date'
          })
          .select();
        
        if (error) throw error;
        return data;
      });
      
      return Promise.all(upsertPromises);
    },
    onSuccess: () => {
      // Invalidate all meldungen queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['meldungen'] });
      queryClient.invalidateQueries({ queryKey: ['last-school-day-meldungen'] });
      toast({
        title: 'Gespeichert',
        description: 'Meldungen wurden erfolgreich aktualisiert.',
      });
    },
    onError: (error) => {
      console.error('Error updating meldungen:', error);
      toast({
        title: 'Fehler',
        description: 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
        variant: 'destructive',
      });
    },
  });
};

// Helper function to calculate totals and averages
export const calculateMeldungenStats = (meldungen: MeldungWithSubject[]) => {
  const total = meldungen.reduce((sum, m) => sum + m.count, 0);
  const subjectCount = meldungen.filter(m => m.count > 0).length;
  const average = subjectCount > 0 ? Math.round((total / subjectCount) * 10) / 10 : 0;
  
  return { total, average, subjectCount };
};