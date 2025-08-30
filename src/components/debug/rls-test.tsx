import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useParentContext } from '@/contexts/parent-context';
import { supabase } from '@/integrations/supabase/client';

export const RLSTestComponent: React.FC = () => {
  const { user, actualUser } = useAuth();
  const { selectedChildId, isParentMode } = useParentContext();
  const [testResults, setTestResults] = useState<any>(null);
  const [authUidResult, setAuthUidResult] = useState<string | null>(null);

  useEffect(() => {
    const testRLSPolicies = async () => {
      if (!user?.id) return;
      
      try {
        // Get the current session to see what auth.uid() would return
        const { data: { session } } = await supabase.auth.getSession();
        const authUid = session?.user?.id || null;
        setAuthUidResult(authUid);
        console.log('🔍 auth.uid() should return:', authUid);

        // Test direct queries with explicit user_id filter
        const [subjectsResult, gradesResult, tasksResult] = await Promise.all([
          supabase.from('subjects').select('*').eq('user_id', user.id),
          supabase.from('grades').select('*').eq('user_id', user.id),
          supabase.from('tasks').select('*').eq('user_id', user.id)
        ]);
        
        // Test queries without explicit user_id filter (should use RLS)
        const [subjectsRLSResult, gradesRLSResult, tasksRLSResult] = await Promise.all([
          supabase.from('subjects').select('*'),
          supabase.from('grades').select('*'),
          supabase.from('tasks').select('*')
        ]);
        
        setTestResults({
          withFilter: {
            subjects: { count: subjectsResult.data?.length || 0, error: subjectsResult.error },
            grades: { count: gradesResult.data?.length || 0, error: gradesResult.error },
            tasks: { count: tasksResult.data?.length || 0, error: tasksResult.error }
          },
          withoutFilter: {
            subjects: { count: subjectsRLSResult.data?.length || 0, error: subjectsRLSResult.error },
            grades: { count: gradesRLSResult.data?.length || 0, error: gradesRLSResult.error },
            tasks: { count: tasksRLSResult.data?.length || 0, error: tasksRLSResult.error }
          }
        });
        
        console.log('🔍 RLS Test Results:', {
          authUid: authUid,
          currentUserId: user.id,
          actualUserId: actualUser?.id,
          selectedChildId,
          isParentMode,
          withFilter: {
            subjects: subjectsResult.data?.length || 0,
            grades: gradesResult.data?.length || 0,
            tasks: tasksResult.data?.length || 0
          },
          withoutFilter: {
            subjects: subjectsRLSResult.data?.length || 0,
            grades: gradesRLSResult.data?.length || 0,
            tasks: tasksRLSResult.data?.length || 0
          }
        });
        
      } catch (error) {
        console.error('🔍 RLS Test Error:', error);
      }
    };
    
    testRLSPolicies();
  }, [user?.id, actualUser?.id, selectedChildId, isParentMode]);

  return (
    <Card className="mb-6 border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="text-blue-600">🧪 RLS Policy Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold">Auth Context:</h4>
            <p>auth.uid(): <span className="font-mono text-xs">{authUidResult || 'loading...'}</span></p>
            <p>user.id: <span className="font-mono text-xs">{user?.id || 'null'}</span></p>
            <p>actualUser.id: <span className="font-mono text-xs">{actualUser?.id || 'null'}</span></p>
            <p>selectedChildId: <span className="font-mono text-xs">{selectedChildId || 'null'}</span></p>
          </div>
          
          <div>
            <h4 className="font-semibold">Query Results:</h4>
            {testResults && (
              <>
                <p>With user_id filter:</p>
                <p className="ml-4">Subjects: {testResults.withFilter.subjects.count}</p>
                <p className="ml-4">Grades: {testResults.withFilter.grades.count}</p>
                <p className="ml-4">Tasks: {testResults.withFilter.tasks.count}</p>
                <p>Without filter (RLS only):</p>
                <p className="ml-4">Subjects: {testResults.withoutFilter.subjects.count}</p>
                <p className="ml-4">Grades: {testResults.withoutFilter.grades.count}</p>
                <p className="ml-4">Tasks: {testResults.withoutFilter.tasks.count}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};