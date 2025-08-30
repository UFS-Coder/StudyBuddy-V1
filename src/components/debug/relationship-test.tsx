import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useParentContext } from '@/contexts/parent-context';

export const RelationshipTestComponent: React.FC = () => {
  const { user, actualUser } = useAuth();
  const { selectedChildId } = useParentContext();
  const [relationshipData, setRelationshipData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    const testRelationship = async () => {
      if (!actualUser?.id || !selectedChildId) return;

      console.log('🔍 Testing parent-child relationship:', {
        parentId: actualUser.id,
        childId: selectedChildId
      });

      try {
        // Test 1: Check if parent-child relationship exists
        const { data: relationship, error: relError } = await supabase
          .from('parent_child_relationships')
          .select('*')
          .eq('parent_id', actualUser.id)
          .eq('child_id', selectedChildId)
          .single();

        console.log('🔍 Parent-child relationship query result:', { relationship, relError });

        // Test 2: Check if child has any subjects
        const { data: childSubjects, error: subError } = await supabase
          .from('subjects')
          .select('*')
          .eq('user_id', selectedChildId);

        console.log('🔍 Child subjects query result:', { childSubjects, subError });

        // Test 3: Test RLS policy by querying subjects as parent
        const { data: rlsSubjects, error: rlsError } = await supabase
          .from('subjects')
          .select('*');

        console.log('🔍 RLS subjects query result:', { rlsSubjects, rlsError });

        setRelationshipData(relationship);
        setTestResults({
          relationship: { data: relationship, error: relError },
          childSubjects: { data: childSubjects, error: subError },
          rlsSubjects: { data: rlsSubjects, error: rlsError }
        });

      } catch (error) {
        console.error('🔍 Relationship test error:', error);
        setTestResults({ error: error.message });
      }
    };

    testRelationship();
  }, [actualUser?.id, selectedChildId]);

  return (
    <Card className="mb-6 border-2 border-purple-500">
      <CardHeader>
        <CardTitle className="text-purple-600">🔗 Parent-Child Relationship Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <h4 className="font-semibold">Test Parameters:</h4>
            <p>Parent ID: <span className="font-mono text-xs">{actualUser?.id || 'null'}</span></p>
            <p>Selected Child ID: <span className="font-mono text-xs">{selectedChildId || 'null'}</span></p>
          </div>
          
          {testResults && (
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-purple-600">Relationship Exists:</h4>
                <p className={relationshipData ? 'text-green-600' : 'text-red-600'}>
                  {relationshipData ? 'YES - Relationship found' : 'NO - No relationship found'}
                </p>
                {testResults.relationship?.error && (
                  <p className="text-red-500 text-xs">Error: {JSON.stringify(testResults.relationship.error)}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-purple-600">Child Has Data:</h4>
                <p>Subjects: {testResults.childSubjects?.data?.length || 0}</p>
                {testResults.childSubjects?.error && (
                  <p className="text-red-500 text-xs">Error: {JSON.stringify(testResults.childSubjects.error)}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-purple-600">RLS Query Result:</h4>
                <p>Subjects via RLS: {testResults.rlsSubjects?.data?.length || 0}</p>
                {testResults.rlsSubjects?.error && (
                  <p className="text-red-500 text-xs">RLS Error: {JSON.stringify(testResults.rlsSubjects.error)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};