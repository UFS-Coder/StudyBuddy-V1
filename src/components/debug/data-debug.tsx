import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { useSubjects } from '@/hooks/use-subjects';
import { useGradesBySubject } from '@/hooks/use-grades';
import { useTasks } from '@/hooks/use-tasks';
import { useParentContext } from '@/contexts/parent-context';
import { supabase } from '@/integrations/supabase/client';

export const DataDebugInfo: React.FC = () => {
  const { user, actualUser } = useAuth();
  const { selectedChildId, isParentMode, children } = useParentContext();
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const { data: gradesBySubject = {} } = useGradesBySubject();
  const { data: tasks = [] } = useTasks();
  const [dbQueryResults, setDbQueryResults] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Direct database query to verify data exists
  useEffect(() => {
    const testDirectQuery = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔍 Debug: Testing direct queries with user.id:', user.id);
        console.log('🔍 Debug: actualUser.id:', actualUser?.id);
        console.log('🔍 Debug: selectedChildId:', selectedChildId);
        console.log('🔍 Debug: isParentMode:', isParentMode);
        
        // Test direct queries to the database
        const [subjectsResult, gradesResult, tasksResult] = await Promise.all([
          supabase.from('subjects').select('*').eq('user_id', user.id),
          supabase.from('grades').select('*').eq('user_id', user.id),
          supabase.from('tasks').select('*').eq('user_id', user.id)
        ]);
        
        console.log('🔍 Debug: Direct query results:', {
          subjects: subjectsResult.data?.length || 0,
          grades: gradesResult.data?.length || 0,
          tasks: tasksResult.data?.length || 0
        });
        
        setDbQueryResults({
          subjects: { data: subjectsResult.data, error: subjectsResult.error, count: subjectsResult.data?.length || 0 },
          grades: { data: gradesResult.data, error: gradesResult.error, count: gradesResult.data?.length || 0 },
          tasks: { data: tasksResult.data, error: tasksResult.error, count: tasksResult.data?.length || 0 }
        });
        setQueryError(null);
      } catch (error) {
        console.error('🔍 Debug: Query error:', error);
        setQueryError(error instanceof Error ? error.message : 'Unknown error');
      }
    };
    
    testDirectQuery();
  }, [user?.id, actualUser?.id, selectedChildId, isParentMode]);

  return (
    <Card className="mb-6 border-2 border-red-500">
      <CardHeader>
        <CardTitle className="text-red-600">🐛 Data Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold">User Context:</h4>
            <p>Current User ID: <span className="font-mono text-xs">{user?.id || 'null'}</span></p>
            <p>Actual User ID: <span className="font-mono text-xs">{actualUser?.id || 'null'}</span></p>
            <p>Is Parent Mode: <span className={isParentMode ? 'text-green-600 font-semibold' : 'text-red-600'}>{isParentMode ? 'Yes' : 'No'}</span></p>
            <p>Selected Child ID: <span className="font-mono text-xs">{selectedChildId || 'null'}</span></p>
            <p>Children Count: {children.length}</p>
            <p>User Context Switch: <span className={user?.id !== actualUser?.id ? 'text-blue-600 font-semibold' : 'text-gray-600'}>{'{'}{user?.id !== actualUser?.id ? 'SWITCHED' : 'NORMAL'}{'}'}</span></p>
          </div>
          
          <div>
            <h4 className="font-semibold">Profile Data:</h4>
            <p>Profile Loaded: {profile ? 'Yes' : 'No'}</p>
            <p>Profile User ID: {profile?.user_id || 'null'}</p>
            <p>Profile Name: {profile?.display_name || 'null'}</p>
            <p>Account Type: {profile?.account_type || 'null'}</p>
          </div>
          
          <div>
            <h4 className="font-semibold">Subjects Data:</h4>
            <p>Subjects Count: {subjects.length}</p>
            <p>Subjects User IDs: {subjects.map(s => s.user_id).join(', ')}</p>
            <p>First Subject: {subjects[0]?.name || 'none'}</p>
          </div>
          
          <div>
            <h4 className="font-semibold">Grades Data:</h4>
            <p>Grades Subjects: {Object.keys(gradesBySubject).length}</p>
            <p>Total Grades: {Object.values(gradesBySubject).flat().length}</p>
          </div>
          
          <div>
            <h4 className="font-semibold">Tasks Data:</h4>
            <p>Tasks Count: {tasks.length}</p>
            <p>Tasks User IDs: {tasks.map(t => t.user_id).join(', ')}</p>
          </div>
          
          <div className="col-span-2 border-t pt-4">
            <h4 className="font-semibold text-red-600">🔍 Direct Database Queries:</h4>
            {queryError && (
              <p className="text-sm text-red-500">Query Error: {queryError}</p>
            )}
            {dbQueryResults && (
              <div className="space-y-1 text-sm">
                <p>Direct Subjects Query: {dbQueryResults.subjects.count} results</p>
                {dbQueryResults.subjects.error && (
                  <p className="text-red-500">Subjects Error: {JSON.stringify(dbQueryResults.subjects.error)}</p>
                )}
                <p>Direct Grades Query: {dbQueryResults.grades.count} results</p>
                {dbQueryResults.grades.error && (
                  <p className="text-red-500">Grades Error: {JSON.stringify(dbQueryResults.grades.error)}</p>
                )}
                <p>Direct Tasks Query: {dbQueryResults.tasks.count} results</p>
                {dbQueryResults.tasks.error && (
                  <p className="text-red-500">Tasks Error: {JSON.stringify(dbQueryResults.tasks.error)}</p>
                )}
                <p className="text-blue-600">Database URL: {import.meta.env.VITE_SUPABASE_URL}</p>
                <p className="text-blue-600">Auth User: {user?.email}</p>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold">Children List:</h4>
            {children.map(child => (
               <p key={child.child_id}>• {child.child_display_name} ({child.child_id})</p>
             ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};