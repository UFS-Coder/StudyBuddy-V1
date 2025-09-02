import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  Paperclip, 
  Flag, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Palette,
  ChevronDown,
  ChevronRight,
  FileText,
  Paperclip as AttachmentIcon,
  Plus,
  Eye,
  Brain,
  Loader2,
  X,
  Search,
  Copy,
  Download,
  RefreshCw,
  Globe,
  Languages,
  GraduationCap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
// COMMENTED OUT - Objectives and Milestones related imports
// import { LearningObjectives } from './learning-objectives';
// import { ResourceAttachments } from './resource-attachments';
// import { SyllabusMilestones } from './syllabus-milestones';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { groqAPI, GroqMessage } from '@/lib/groq-api';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

type SyllabusTopic = Tables<'syllabus_topics'>;
type Subtopic = Tables<'subtopics'>;
type LearningObjective = Tables<'learning_objectives'>;
type ResourceAttachment = Tables<'resource_attachments'>;
type SyllabusMilestone = Tables<'syllabus_milestones'>;
type Theme = Tables<'themes'>;
type Subject = Tables<'subjects'>;

interface Note {
  id: string;
  title: string;
  content: string;
  time_period: "day" | "week" | "month" | "quarter" | "half_year";
  subject_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface CurriculumDashboardProps {
  subjectId: string;
  userId: string;
}

interface CurriculumStats {
  totalTopics: number;
  completedTopics: number;
  totalSubtopics: number;
  completedSubtopics: number;
  totalObjectives: number;
  completedObjectives: number;
  totalResources: number;
  totalMilestones: number;
  completedMilestones: number;
  upcomingMilestones: number;
  overdueMilestones: number;
}

export function CurriculumDashboard({ subjectId, userId }: CurriculumDashboardProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  // COMMENTED OUT - Objectives and Milestones state
  // const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [resources, setResources] = useState<ResourceAttachment[]>([]);
  // const [milestones, setMilestones] = useState<SyllabusMilestone[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CurriculumStats>({
    totalTopics: 0,
    completedTopics: 0,
    totalSubtopics: 0,
    completedSubtopics: 0,
    totalObjectives: 0,
    completedObjectives: 0,
    totalResources: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    upcomingMilestones: 0,
    overdueMilestones: 0,
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Overlay state for notes
  const [showSubtopicOverlay, setShowSubtopicOverlay] = useState(false);
  const [subtopicNotes, setSubtopicNotes] = useState<Note[]>([]);
  const [overlaySubtopicInfo, setOverlaySubtopicInfo] = useState<{subjectId: string, topicId: string, subtopicId: string} | null>(null);
  
  // AI Notes state
  const [aiNotesLoading, setAiNotesLoading] = useState<Set<string>>(new Set());
  const [showAiNotesOverlay, setShowAiNotesOverlay] = useState(false);
  const [aiNotesContent, setAiNotesContent] = useState<{english: any, german: any, youtube_video?: string | {url: string, title: string}} | null>(null);
  const [aiNotesSubtopicInfo, setAiNotesSubtopicInfo] = useState<{subjectId: string, topicId: string, subtopicId: string, subtopicTitle: string} | null>(null);
  // New: Modal UI state for redesigned AI Notes
  const [aiNotesLang, setAiNotesLang] = useState<'english' | 'german'>('english');
  const [aiNotesSearch, setAiNotesSearch] = useState('');
  const englishContentRef = useRef<HTMLDivElement | null>(null);
  const germanContentRef = useRef<HTMLDivElement | null>(null);
  
  // Practice modal state
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  // Disable body scroll when practice modal is open
  useEffect(() => {
    if (showPracticeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPracticeModal]);

  // Disable body scroll when AI notes modal is open
  useEffect(() => {
    if (showAiNotesOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAiNotesOverlay]);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [practiceSubtopicInfo, setPracticeSubtopicInfo] = useState<{subjectId: string, topicId: string, subtopicId: string, subtopicTitle: string, topicTitle: string} | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<{[key: number]: string}>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [practiceScore, setPracticeScore] = useState<{correct: number; total: number} | null>(null);

  // Fetch notes for overlay functionality
  const { data: notes = [] } = useQuery({
    queryKey: ['notes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    fetchAllData();
  }, [subjectId, userId]);

  const toggleSubtopicCompletion = async (subtopicId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subtopics')
        .update({ completed: !currentStatus })
        .eq('id', subtopicId);

      if (error) throw error;

      // Update local state
      setSubtopics(prev => prev.map(subtopic => 
        subtopic.id === subtopicId 
          ? { ...subtopic, completed: !currentStatus }
          : subtopic
      ));

      toast({
        title: !currentStatus ? "Subtopic completed!" : "Subtopic marked as incomplete",
        description: "Progress updated successfully.",
      });
    } catch (error) {
      console.error('Error updating subtopic:', error);
      toast({
        title: "Error",
        description: "Failed to update subtopic completion status.",
        variant: "destructive",
      });
    }
  };

  const toggleSubtopicExpansion = (subtopicId: string) => {
    setExpandedSubtopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subtopicId)) {
        newSet.delete(subtopicId);
      } else {
        newSet.add(subtopicId);
      }
      return newSet;
    });
  };

  const handleNotesClick = (topicId: string, subtopicId: string) => {
    // Filter notes for this specific subtopic
    const existingNotes = notes.filter(note => {
      const matchesSubject = note.subject_id === subjectId;
      const matchesTopic = note.topic_id === topicId;
      const matchesSubtopic = note.subtopic_id === subtopicId;
      return matchesSubject && matchesTopic && matchesSubtopic;
    });
    
    setSubtopicNotes(existingNotes);
    setOverlaySubtopicInfo({ subjectId, topicId, subtopicId });
    setShowSubtopicOverlay(true);
  };

  const handleViewNote = (note: Note) => {
    // Navigate to notes page with the specific note
    navigate(`/notes?subject_id=${note.subject_id}&topic_id=${note.topic_id}&subtopic_id=${note.subtopic_id}`);
  };

  const handleCreateNote = () => {
    if (overlaySubtopicInfo) {
      navigate(`/notes?subject_id=${overlaySubtopicInfo.subjectId}&topic_id=${overlaySubtopicInfo.topicId}&subtopic_id=${overlaySubtopicInfo.subtopicId}`);
    }
  };

  const generateAiNotes = async (subtopicTitle: string, topicTitle?: string) => {
    const messages: GroqMessage[] = [
      {
        role: 'system',
        content: `You are a friendly teacher who explains things in simple ways. Create easy-to-understand study notes about the given topic.

Provide your response in the following JSON format:
{
  "english": "Simple notes in English with easy words, fun examples, and important points",
  "german": "Simple notes in German with easy words, fun examples, and important points",
  "youtube_video": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "title": "A recommended educational YouTube video title that helps explain this topic"
  }
}

Make the notes:
- Easy to read and understand
- Use simple words (avoid overly complicated terminology)
- Break information into small, clear sections
- Include fun examples that students can relate to
- Use bullet points to make it easy to follow
- Explain things step by step
- Connect new ideas to things students already know
- Make learning fun and interesting
- Include a relevant educational YouTube video recommendation with a real video URL and descriptive title`
      },
      {
        role: 'user',
        content: `Create fun and easy study notes about: "${subtopicTitle}"${topicTitle ? `\n\nThis topic is part of a bigger subject called "${topicTitle}". Please explain how this topic connects to the bigger subject and show how it relates to other things students might already know.` : ''}\n\nMake sure the notes are easy to read and understand. Use simple words and fun examples that students can relate to! Also include a recommended educational YouTube video that would help explain this topic.`
      }
    ];

    const response = await groqAPI.chatCompletion(messages, {}, 'student', `Generating study notes for ${subtopicTitle}`);
     const content = response.choices[0]?.message?.content || '';
    
    try {
       const parsedResponse = JSON.parse(content);
       if (parsedResponse.english && parsedResponse.german) {
         return parsedResponse;
       } else {
         throw new Error('Invalid response format');
       }
     } catch (parseError) {
       console.error('Failed to parse AI response as JSON:', parseError);
       console.log('Raw AI response:', content);
       
       // Try to extract JSON from the response if it's wrapped in markdown or other text
       const jsonMatch = content.match(/\{[\s\S]*\}/);
       if (jsonMatch) {
         try {
           const extractedJson = JSON.parse(jsonMatch[0]);
           if (extractedJson.english && extractedJson.german) {
             return extractedJson;
           }
         } catch (extractError) {
           console.error('Failed to parse extracted JSON:', extractError);
         }
       }
       
       // Enhanced fallback: better content separation
       let englishContent = content;
       let germanContent = null;
       
       // Try to split by various German indicators
       const germanIndicators = ['German:', 'Deutsch:', '"german":', 'GERMAN:', 'German Translation:'];
       
       for (const indicator of germanIndicators) {
         if (content.includes(indicator)) {
           const parts = content.split(indicator);
           englishContent = parts[0]
             .replace(/English:/i, '')
             .replace(/\{\s*"english":\s*"/g, '')
             .replace(/No Italics in formatting/g, '')
             .replace(/Reduce the modal size by removing outline/g, '')
             .replace(/Text below "/g, '')
             .trim();
           
           germanContent = parts[1] ? parts[1]
             .replace(/should move to Deutsch section where it is throwing error - German translation not available\./g, '')
             .replace(/Please try regenerating the notes\./g, '')
             .replace(/\}\s*$/g, '')
             .replace(/"\s*$/g, '')
             .trim() : null;
           break;
         }
       }
       
       // Clean up any remaining JSON artifacts
       if (englishContent.startsWith('"') && englishContent.endsWith('"')) {
         englishContent = englishContent.slice(1, -1);
       }
       
       if (germanContent && germanContent.startsWith('"') && germanContent.endsWith('"')) {
         germanContent = germanContent.slice(1, -1);
       }
       
       return {
         english: englishContent || content,
         german: germanContent
       };
     }
  };

  // Helper function to render structured AI notes content
  const renderAiNotesContent = (content: any, options?: { anchorPrefix?: string }) => {
    // Handle null, undefined, or empty content
    if (!content) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">German translation not available.</p>
          <p className="text-sm text-gray-400">Please try regenerating the notes.</p>
        </div>
      );
    }
    
    if (typeof content === 'string') {
      // Handle plain text content - Remove formatting instructions and clean up
      const cleanContent = content
        .replace(/\{\s*"english":\s*"/g, '')
        .replace(/\{\s*"german":\s*"/g, '')
        .replace(/No Italics in formatting/g, '')
        .replace(/Reduce the modal size by removing outline/g, '')
        .replace(/Text below "/g, '')
        .replace(/should move to Deutsch section where it is throwing error - German translation not available\./g, '')
        .replace(/Please try regenerating the notes\./g, '')
        .trim();
      
      return (
        <div className="prose prose-lg max-w-none leading-relaxed">
          <div 
            className="text-gray-700 space-y-4"
            dangerouslySetInnerHTML={{ 
              __html: cleanContent
                .replace(/\n\n/g, '</p><p class="mb-4">')
                .replace(/\n/g, '<br>')
                .replace(/^/, '<p class="mb-4">')
                .replace(/$/, '</p>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
            }} 
          />
        </div>
      );
    }
    
    if (Array.isArray(content)) {
      // Handle array of structured content
      return (
        <div className="space-y-6">
          {content.map((section: any, index: number) => (
            <div id={options?.anchorPrefix ? `${options.anchorPrefix}-section-${index}` : undefined} key={index} className="bg-gray-50 rounded-lg p-4">
              {section.title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
              )}
              {section.text && (
                <p className="text-gray-700 mb-3 leading-relaxed">{section.text}</p>
              )}
              {section.stages && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Stages:</h4>
                  <div className="grid gap-3">
                    {section.stages.map((stage: any, stageIndex: number) => (
                      <div key={stageIndex} className="bg-white border rounded p-3">
                        <div className="font-medium text-gray-900">{stage.name || `Stage ${stageIndex + 1}`}</div>
                        {stage.description && (
                          <p className="text-gray-700 text-sm mt-1">{stage.description}</p>
                        )}
                        {stage.key_points && Array.isArray(stage.key_points) && (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {stage.key_points.map((point: string, i: number) => (
                              <li key={i} className="text-gray-700 text-sm">{point}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {section.importance && Array.isArray(section.importance) && (
                <div className="mt-3">
                  <h4 className="font-medium text-gray-800">Why it matters:</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {section.importance.map((item: string, i: number) => (
                      <li key={i} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {section.related_concepts && Array.isArray(section.related_concepts) && (
                <div className="mt-3">
                  <h4 className="font-medium text-gray-800">Related concepts:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {section.related_concepts.map((concept: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm">{concept}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback for unknown content structure
    return (
      <pre className="bg-gray-100 text-gray-800 p-4 rounded-lg overflow-auto text-sm">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  };



  // Format content for copy/download
  const formatAiNotesContentForCopy = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      const parts: string[] = [];
      content.forEach((section: any, idx: number) => {
        if (section.title) parts.push(`# ${section.title}`);
        if (section.text) parts.push(section.text);
        if (section.stages && Array.isArray(section.stages)) {
          parts.push('## Stages');
          section.stages.forEach((stage: any, i: number) => {
            parts.push(`- ${stage.name || `Stage ${i + 1}`}: ${stage.description || ''}`.trim());
            if (stage.key_points) {
              stage.key_points.forEach((p: string) => parts.push(`  • ${p}`));
            }
          });
        }
        if (section.importance) {
          parts.push('## Why it matters');
          section.importance.forEach((p: string) => parts.push(`- ${p}`));
        }
        if (section.related_concepts) {
          parts.push('## Related concepts');
          parts.push(section.related_concepts.map((c: string) => `#${c}`).join(' '));
        }
        if (idx < content.length - 1) parts.push('\n');
      });
      return parts.join('\n');
    }
    return JSON.stringify(content, null, 2);
  };

  const downloadStringAsFile = (text: string, fileName: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleAiNotesSearch = () => {
    const term = aiNotesSearch.trim().toLowerCase();
    if (!term) return;
    const container = aiNotesLang === 'english' ? englishContentRef.current : germanContentRef.current;
    if (!container) return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node: Node | null = walker.nextNode();
    while (node) {
      const text = node.textContent || '';
      if (text.toLowerCase().includes(term)) {
        const el = node.parentElement as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
      node = walker.nextNode();
    }
  };
  const handleAiNotesClick = async (topicId: string, subtopicId: string, subtopicTitle: string) => {
    const loadingKey = `${topicId}-${subtopicId}`;
    
    // Check if AI notes already exist for this subtopic
    const existingAiNotes = notes.filter(note => {
      const matchesSubject = note.subject_id === subjectId;
      const matchesTopic = note.topic_id === topicId;
      const matchesSubtopic = note.subtopic_id === subtopicId;
      const isAiNote = note.tags && note.tags.includes('AI notes');
      return matchesSubject && matchesTopic && matchesSubtopic && isAiNote;
    });
    
    if (existingAiNotes.length > 0) {
      // Show existing AI notes
      const aiNote = existingAiNotes[0];
      try {
        const content = JSON.parse(aiNote.content);
        setAiNotesContent(content);
        setAiNotesSubtopicInfo({ subjectId, topicId, subtopicId, subtopicTitle });
        setShowAiNotesOverlay(true);
      } catch (error) {
        console.error('Error parsing AI notes content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load existing AI notes',
          variant: 'destructive',
        });
      }
      return;
    }
    
    // Generate new AI notes
    setAiNotesLoading(prev => {
      const newSet = new Set(prev);
      newSet.add(loadingKey);
      return newSet;
    });
    
    try {
      // Get topic title for context
      const topic = topics.find(t => t.id === topicId);
      const topicTitle = topic?.title;
      
      // Generate AI notes
      const aiNotesContent = await generateAiNotes(subtopicTitle, topicTitle);
      
      // Save AI notes to database
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          title: `AI Notes: ${subtopicTitle}`,
          content: JSON.stringify(aiNotesContent),
          time_period: 'day',
          subject_id: subjectId,
          topic_id: topicId,
          subtopic_id: subtopicId,
          tags: ['AI notes'],
          user_id: userId
        });
      
      if (insertError) {
        throw insertError;
      }
      
      // Show the generated notes
      setAiNotesContent(aiNotesContent);
      setAiNotesSubtopicInfo({ subjectId, topicId, subtopicId, subtopicTitle });
      setShowAiNotesOverlay(true);
      
      toast({
        title: 'AI Notes Generated',
        description: 'AI notes have been generated and saved successfully.',
      });
    } catch (error) {
      console.error('Error generating AI notes:', error);
      toast({
        title: 'Error',
        description: 'Notes could not be generated. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setAiNotesLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingKey);
        return newSet;
      });
    }
  };

  const handlePracticeClick = async (topicId: string, subtopicId: string, subtopicTitle: string, topicTitle: string) => {
    if (!user || !profile) {
      toast({
        title: 'Error',
        description: 'Please log in to access practice questions.',
        variant: 'destructive',
      });
      return;
    }

    // Set practice modal info and show modal
    setPracticeSubtopicInfo({ 
      subjectId, 
      topicId, 
      subtopicId, 
      subtopicTitle, 
      topicTitle 
    });
    setShowPracticeModal(true);
    setPracticeLoading(true);
    
    try {
      // Get grade band from profile with fallback
      const gradeBand = profile.grade_level ? `Gymnasium Klasse ${profile.grade_level}` : 'Gymnasium 9–13';
      
      // Generate practice questions
      const response = await fetch('/api/generate-practice-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topicTitle,
          subtopic: subtopicTitle,
          gradeBand,
          questionCount: 10,
          language: 'de-DE'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate practice questions');
      }

      const questions = await response.json();
      setPracticeQuestions(questions);
      
    } catch (error) {
      console.error('Error generating practice questions:', error);
      toast({
        title: 'Error',
        description: 'Die Fragen konnten nicht erstellt werden. Bitte erneut versuchen.',
        variant: 'destructive',
      });
      setShowPracticeModal(false);
    } finally {
      setPracticeLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setPracticeAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handlePracticeSubmit = () => {
    if (!practiceQuestions || practiceQuestions.length === 0) return;

    let correctCount = 0;
    const totalQuestions = practiceQuestions.length;

    practiceQuestions.forEach((question, index) => {
      const userAnswer = practiceAnswers[index];
      const correctAnswer = question.correct_answer;

      if (userAnswer && correctAnswer) {
        // Normalize answers for comparison
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = correctAnswer.toLowerCase().trim();
        
        if (question.type === 'true_false') {
          // Handle true/false questions
          const isCorrect = (
            (normalizedUserAnswer === 'true' && (normalizedCorrectAnswer === 'true' || normalizedCorrectAnswer === 'richtig')) ||
            (normalizedUserAnswer === 'false' && (normalizedCorrectAnswer === 'false' || normalizedCorrectAnswer === 'falsch'))
          );
          if (isCorrect) correctCount++;
        } else {
          // Handle other question types with exact or partial matching
          if (normalizedUserAnswer === normalizedCorrectAnswer || 
              normalizedCorrectAnswer.includes(normalizedUserAnswer) ||
              normalizedUserAnswer.includes(normalizedCorrectAnswer)) {
            correctCount++;
          }
        }
      }
    });

    setPracticeScore({ correct: correctCount, total: totalQuestions });
    setPracticeSubmitted(true);

    toast({
      title: 'Übung abgeschlossen',
      description: `Sie haben ${correctCount} von ${totalQuestions} Fragen richtig beantwortet.`,
    });
  };

  const resetPracticeModal = () => {
    setPracticeAnswers({});
    setPracticeSubmitted(false);
    setPracticeScore(null);
    setPracticeQuestions([]);
  };

  useEffect(() => {
    calculateStats();
  }, [topics, subtopics, /* objectives, */ resources, /* milestones */]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      // First fetch themes and topics for this subject
      const [themesRes, topicsRes] = await Promise.all([
        supabase.from('themes').select('*').eq('subject_id', subjectId).eq('user_id', userId).order('order_index'),
        supabase.from('syllabus_topics').select('*').eq('subject_id', subjectId).eq('user_id', userId).order('order_index')
      ]);
      
      if (themesRes.error) throw themesRes.error;
      if (topicsRes.error) throw topicsRes.error;
      
      const topicIds = (topicsRes.data || []).map(topic => topic.id);
      
      // Fetch all data in parallel, filtering subtopics by topic IDs
       const [subtopicsRes, /* objectivesRes, */ resourcesRes, /* milestonesRes */] = await Promise.all([
         topicIds.length > 0 
           ? supabase.from('subtopics').select('*').in('topic_id', topicIds).eq('user_id', userId).order('order_index')
           : Promise.resolve({ data: [], error: null }),
        // COMMENTED OUT - Objectives and Milestones data fetching
        // supabase.from('learning_objectives').select('*').eq('user_id', userId).order('order_index'),
        supabase.from('resource_attachments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        // supabase.from('syllabus_milestones').select('*').eq('subject_id', subjectId).eq('user_id', userId).order('target_date'),
      ]);
      
      // Get subtopic IDs for filtering objectives and resources
      const subtopicIds = (subtopicsRes.data || []).map(subtopic => subtopic.id);

      if (subtopicsRes.error) throw subtopicsRes.error;
      // COMMENTED OUT - Objectives and Milestones error checking
      // if (objectivesRes.error) throw objectivesRes.error;
      if (resourcesRes.error) throw resourcesRes.error;
      // if (milestonesRes.error) throw milestonesRes.error;

      setThemes(themesRes.data || []);
      setTopics(topicsRes.data || []);
      setSubtopics(subtopicsRes.data || []);
      // COMMENTED OUT - Objectives and Milestones state setting
      // setObjectives(objectivesRes.data || []);
      setResources(resourcesRes.data || []);
      // setMilestones(milestonesRes.data || []);
    } catch (error) {
      console.error('Error fetching curriculum data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load curriculum data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const topicIds = topics.map(t => t.id);
    const topicSubtopics = subtopics.filter(s => topicIds.includes(s.topic_id));
    // COMMENTED OUT - Objectives and Milestones calculations
    // const topicObjectives = objectives.filter(o => 
    //   (o.topic_id && topicIds.includes(o.topic_id)) || 
    //   (o.subtopic_id && topicSubtopics.some(s => s.id === o.subtopic_id))
    // );
    const topicResources = resources.filter(r => 
      (r.topic_id && topicIds.includes(r.topic_id)) || 
      (r.subtopic_id && topicSubtopics.some(s => s.id === r.subtopic_id))
    );

    // const now = new Date();
    // const upcomingMilestones = milestones.filter(m => 
    //   !m.completed && m.target_date && isAfter(new Date(m.target_date), now)
    // );
    // const overdueMilestones = milestones.filter(m => 
    //   !m.completed && m.target_date && isBefore(new Date(m.target_date), now)
    // );

    setStats({
      totalTopics: topics.length,
      completedTopics: topics.filter(t => {
        const topicSubtopics = subtopics.filter(s => s.topic_id === t.id);
        return topicSubtopics.length > 0 ? topicSubtopics.every(s => s.completed) : false;
      }).length,
      totalSubtopics: topicSubtopics.length,
      completedSubtopics: topicSubtopics.filter(s => s.completed).length,
      // COMMENTED OUT - Objectives and Milestones stats
      totalObjectives: 0, // topicObjectives.length,
      completedObjectives: 0, // topicObjectives.filter(o => o.completed).length,
      totalResources: topicResources.length,
      totalMilestones: 0, // milestones.length,
      completedMilestones: 0, // milestones.filter(m => m.completed).length,
      upcomingMilestones: 0, // upcomingMilestones.length,
      overdueMilestones: 0, // overdueMilestones.length,
    });
  };

  const getTopicProgress = (topicId: string) => {
    const topicSubtopics = subtopics.filter(s => s.topic_id === topicId);
    if (topicSubtopics.length === 0) return 0;
    const completed = topicSubtopics.filter(s => s.completed).length;
    return (completed / topicSubtopics.length) * 100;
  };

  const getOverallProgress = () => {
    if (stats.totalSubtopics === 0) return 0;
    return (stats.completedSubtopics / stats.totalSubtopics) * 100;
  };

  const getTopicsByTheme = () => {
    const topicsWithThemes = topics.filter(topic => topic.theme_id);
    const topicsWithoutThemes = topics.filter(topic => !topic.theme_id);
    
    const themeGroups = themes.map(theme => ({
      theme,
      topics: topicsWithThemes.filter(topic => topic.theme_id === theme.id)
    })).filter(group => group.topics.length > 0);
    
    return {
      themeGroups,
      ungroupedTopics: topicsWithoutThemes
    };
  };

  const getThemeProgress = (themeId: string) => {
    const themeTopics = topics.filter(topic => topic.theme_id === themeId);
    if (themeTopics.length === 0) return 0;
    
    const themeSubtopics = subtopics.filter(subtopic => 
      themeTopics.some(topic => topic.id === subtopic.topic_id)
    );
    
    if (themeSubtopics.length === 0) return 0;
    const completed = themeSubtopics.filter(s => s.completed).length;
    return (completed / themeSubtopics.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Curriculum Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Merged Curriculum Overview and Topics Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Curriculum Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Compact Overview Stats */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-700">{stats.completedSubtopics}</div>
                <div className="text-xs text-blue-600">of {stats.totalSubtopics}</div>
                <div className="text-xs text-gray-500">Topics</div>
              </div>
            </div>
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="font-semibold text-indigo-600">{Math.round(getOverallProgress())}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getOverallProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Topics Progress Section */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Topics Progress
            </h3>
          <div className="space-y-4">
            {(() => {
              const { themeGroups, ungroupedTopics } = getTopicsByTheme();
              
              return (
                <>
                  {/* Themed Topics */}
                  {themeGroups.map(({ theme, topics: themeTopics }) => {
                    const themeProgress = getThemeProgress(theme.id);
                    const themeSubtopics = subtopics.filter(subtopic => 
                      themeTopics.some(topic => topic.id === subtopic.topic_id)
                    );
                    const completedThemeSubtopics = themeSubtopics.filter(s => s.completed).length;
                    
                    return (
                      <div key={theme.id} className="border rounded-lg p-4 space-y-3">
                        {/* Theme Header */}
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: theme.color || '#6B7280' }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                {theme.title}
                              </h3>
                              <Badge variant="secondary">
                                {completedThemeSubtopics}/{themeSubtopics.length} subtopics
                              </Badge>
                            </div>
                            {theme.description && (
                              <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Progress value={themeProgress} className="flex-1 h-2" />
                              <span className="text-sm text-gray-500">{Math.round(themeProgress)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Topics within Theme */}
                        <div className="ml-6 space-y-3">
                          {themeTopics.map((topic) => {
                            const progress = getTopicProgress(topic.id);
                            const topicSubtopics = subtopics.filter(s => s.topic_id === topic.id);
                            const completedSubtopics = topicSubtopics.filter(s => s.completed).length;
                            
                            return (
                              <div
                                key={topic.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedTopicId === topic.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedTopicId(selectedTopicId === topic.id ? null : topic.id)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{topic.title}</h4>
                                  <Badge variant="outline">
                                    {completedSubtopics}/{topicSubtopics.length}
                                  </Badge>
                                </div>
                                {topic.description && (
                                  <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                                )}
                                <div className="flex items-center gap-2">
                                  <Progress value={progress} className="flex-1 h-2" />
                                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                                </div>
                                
                                {/* Subtopics */}
                                {selectedTopicId === topic.id && topicSubtopics.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {topicSubtopics.map((subtopic) => (
                                      <div key={subtopic.id} className="space-y-2">
                                        <div
                                          className={`p-3 border rounded transition-colors ${
                                            selectedSubtopicId === subtopic.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                                          } ${
                                            subtopic.completed ? 'bg-green-100 border-green-300' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <CheckCircle 
                                              className={`h-4 w-4 cursor-pointer ${
                                                subtopic.completed ? 'text-green-600' : 'text-gray-400'
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSubtopicCompletion(subtopic.id, subtopic.completed);
                                              }}
                                            />
                                            <span className={`flex-1 ${
                                              subtopic.completed ? 'line-through text-gray-500' : ''
                                            }`}>
                                              {subtopic.title}
                                            </span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSubtopicExpansion(subtopic.id);
                                              }}
                                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                                            >
                                              {expandedSubtopics.has(subtopic.id) ? (
                                                <ChevronDown className="h-4 w-4 text-gray-600" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-600" />
                                              )}
                                            </button>
                                          </div>
                                          {subtopic.description && (
                                            <p className="text-sm text-gray-600 mt-1 ml-6">{subtopic.description}</p>
                                          )}
                                        </div>
                                        
                                        {/* Expandable Options */}
                                        {expandedSubtopics.has(subtopic.id) && (
                                          <div className="ml-6 p-3 bg-gray-50 border rounded-lg space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={() => handleNotesClick(topic.id, subtopic.id)}
                                              >
                                                <FileText className="h-3 w-3" />
                                                Notes
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleAiNotesClick(topic.id, subtopic.id, subtopic.title);
                                                }}
                                                disabled={aiNotesLoading.has(`${topic.id}-${subtopic.id}`)}
                                              >
                                                {aiNotesLoading.has(`${topic.id}-${subtopic.id}`) ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <Brain className="h-3 w-3" />
                                                )}
                                                AI Notes
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handlePracticeClick(topic.id, subtopic.id, subtopic.title, topic.title);
                                                }}
                                                disabled={practiceLoading}
                                              >
                                                {practiceLoading ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <GraduationCap className="h-3 w-3" />
                                                )}
                                                Practice
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={() => {
                                                  // TODO: Implement attachments functionality
                                                  toast({
                                                    title: "Attachments",
                                                    description: "Attachments functionality coming soon!",
                                                  });
                                                }}
                                              >
                                                <AttachmentIcon className="h-3 w-3" />
                                                Attachments
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={() => {
                                                  // TODO: Implement additional options
                                                  toast({
                                                    title: "More Options",
                                                    description: "Additional options coming soon!",
                                                  });
                                                }}
                                              >
                                                <Target className="h-3 w-3" />
                                                More
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Ungrouped Topics */}
                  {ungroupedTopics.length > 0 && (
                    <div className="space-y-3">
                      {ungroupedTopics.length > 0 && themeGroups.length > 0 && (
                        <div className="border-t pt-4">
                          <h3 className="font-semibold text-lg mb-3 text-gray-700">Other Topics</h3>
                        </div>
                      )}
                      {ungroupedTopics.map((topic) => {
                        const progress = getTopicProgress(topic.id);
                        const topicSubtopics = subtopics.filter(s => s.topic_id === topic.id);
                        const completedSubtopics = topicSubtopics.filter(s => s.completed).length;
                        
                        return (
                          <div
                            key={topic.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedTopicId === topic.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedTopicId(selectedTopicId === topic.id ? null : topic.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{topic.title}</h3>
                              <Badge variant="outline">
                                {completedSubtopics}/{topicSubtopics.length}
                              </Badge>
                            </div>
                            {topic.description && (
                              <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="flex-1 h-2" />
                              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                            </div>
                            
                            {/* Subtopics */}
                            {selectedTopicId === topic.id && topicSubtopics.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {topicSubtopics.map((subtopic) => (
                                  <div key={subtopic.id} className="space-y-2">
                                    <div
                                      className={`p-3 border rounded transition-colors ${
                                        selectedSubtopicId === subtopic.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                                      } ${
                                        subtopic.completed ? 'bg-green-100 border-green-300' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <CheckCircle 
                                          className={`h-4 w-4 cursor-pointer ${
                                            subtopic.completed ? 'text-green-600' : 'text-gray-400'
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtopicCompletion(subtopic.id, subtopic.completed);
                                          }}
                                        />
                                        <span className={`flex-1 ${
                                          subtopic.completed ? 'line-through text-gray-500' : ''
                                        }`}>
                                          {subtopic.title}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtopicExpansion(subtopic.id);
                                          }}
                                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        >
                                          {expandedSubtopics.has(subtopic.id) ? (
                                            <ChevronDown className="h-4 w-4 text-gray-600" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                          )}
                                        </button>
                                      </div>
                                      {subtopic.description && (
                                        <p className="text-sm text-gray-600 mt-1 ml-6">{subtopic.description}</p>
                                      )}
                                    </div>
                                    
                                    {/* Expandable Options */}
                                    {expandedSubtopics.has(subtopic.id) && (
                                      <div className="ml-6 p-3 bg-gray-50 border rounded-lg space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => handleNotesClick(topic.id, subtopic.id)}
                                          >
                                            <FileText className="h-3 w-3" />
                                            Notes
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAiNotesClick(topic.id, subtopic.id, subtopic.title);
                                            }}
                                            disabled={aiNotesLoading.has(`${topic.id}-${subtopic.id}`)}
                                          >
                                            {aiNotesLoading.has(`${topic.id}-${subtopic.id}`) ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <Brain className="h-3 w-3" />
                                            )}
                                            AI Notes
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handlePracticeClick(topic.id, subtopic.id, subtopic.title, topic.title);
                                            }}
                                            disabled={practiceLoading}
                                          >
                                            {practiceLoading ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <GraduationCap className="h-3 w-3" />
                                            )}
                                            Practice
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => {
                                              // TODO: Implement attachments functionality
                                              toast({
                                                title: "Attachments",
                                                description: "Attachments functionality coming soon!",
                                              });
                                            }}
                                          >
                                            <AttachmentIcon className="h-3 w-3" />
                                            Attachments
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => {
                                              // TODO: Implement additional options
                                              toast({
                                                title: "More Options",
                                                description: "Additional options coming soon!",
                                              });
                                            }}
                                          >
                                            <Target className="h-3 w-3" />
                                            More
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {topics.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No topics found</p>
                      <p className="text-sm">Topics are managed in the Syllabus section</p>
                    </div>
                  )}
                </>
              );
            })()
          }
          </div>
          </div>
        </CardContent>
      </Card>

      {/* COMMENTED OUT - Resources tab removed as it was the only remaining tab after objectives and milestones were commented out */}
      {/* 
      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <ResourceAttachments
            topicId={selectedTopicId || undefined}
            subtopicId={selectedSubtopicId || undefined}
            userId={userId}
          />
        </TabsContent>
      </Tabs>
      */}
      
      {/* Subtopic Notes Overlay */}
      {showSubtopicOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {subtopicNotes.length > 0 ? 'Notizen für dieses Unterthema' : 'Keine Notizen gefunden'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSubtopicOverlay(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            
            {subtopicNotes.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Wähle eine Notiz aus, um sie zu öffnen:
                </p>
                {subtopicNotes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      handleViewNote(note);
                      setShowSubtopicOverlay(false);
                    }}
                  >
                    <h4 className="font-medium text-sm">{note.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.updated_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <Button 
                    onClick={() => {
                      setShowSubtopicOverlay(false);
                      handleCreateNote();
                    }}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Neue Notiz erstellen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Für dieses Unterthema wurden noch keine Notizen erstellt.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowSubtopicOverlay(false)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowSubtopicOverlay(false);
                      handleCreateNote();
                    }}
                    className="flex-1 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Erstellen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* AI Notes Overlay */}
      {showAiNotesOverlay && aiNotesContent && aiNotesSubtopicInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
          <div className="h-full w-full bg-white flex flex-col">
            {/* Sticky Header with Toolbar */}
            <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Brain className="h-6 w-6 text-blue-600" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">AI Notes</div>
                    <div className="text-xs text-gray-500 truncate">{aiNotesSubtopicInfo.subtopicTitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 border rounded-lg px-3 py-1.5">
                    <Search className="h-4 w-4 text-gray-500" />
                    <input
                      value={aiNotesSearch}
                      onChange={(e) => setAiNotesSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAiNotesSearch(); }}
                      placeholder={aiNotesLang === 'english' ? 'Search in English notes…' : 'In deutschen Notizen suchen…'}
                      className="outline-none text-sm placeholder:text-gray-400 w-56"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      const current = aiNotesLang === 'english' ? aiNotesContent.english : aiNotesContent.german;
                      const text = formatAiNotesContentForCopy(current);
                      try {
                        await navigator.clipboard.writeText(text);
                        toast({ title: 'Copied', description: 'AI notes copied to clipboard.' });
                      } catch (err) {
                        toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
                      }
                    }}
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const current = aiNotesLang === 'english' ? aiNotesContent.english : aiNotesContent.german;
                      const text = formatAiNotesContentForCopy(current);
                      const langLabel = aiNotesLang === 'english' ? 'EN' : 'DE';
                      downloadStringAsFile(text, `${aiNotesSubtopicInfo.subtopicTitle.replace(/\s+/g, '_')}_AI_Notes_${langLabel}.txt`);
                    }}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={aiNotesSubtopicInfo ? aiNotesLoading.has(`${aiNotesSubtopicInfo.topicId}-${aiNotesSubtopicInfo.subtopicId}`) : false}
                    onClick={async () => {
                      if (!aiNotesSubtopicInfo) return;
                      const refreshLoadingKey = `${aiNotesSubtopicInfo.topicId}-${aiNotesSubtopicInfo.subtopicId}`;
                      try {
                        setAiNotesLoading(prev => { const s = new Set(prev); s.add(refreshLoadingKey); return s; });
                        const topic = topics.find(t => t.id === aiNotesSubtopicInfo.topicId);
                        const topicTitle = topic?.title;
                        const newAiNotesContent = await generateAiNotes(aiNotesSubtopicInfo.subtopicTitle, topicTitle);
                        const { error: updateError } = await supabase
                          .from('notes')
                          .update({ content: JSON.stringify(newAiNotesContent), updated_at: new Date().toISOString() })
                          .eq('subject_id', aiNotesSubtopicInfo.subjectId)
                          .eq('topic_id', aiNotesSubtopicInfo.topicId)
                          .eq('subtopic_id', aiNotesSubtopicInfo.subtopicId)
                          .eq('user_id', userId)
                          .contains('tags', ['AI notes']);
                        if (updateError) throw updateError;
                        setAiNotesContent(newAiNotesContent);
                        toast({ title: 'AI Notes Refreshed', description: 'New AI notes have been generated successfully.' });
                      } catch (error) {
                        console.error('Error refreshing AI notes:', error);
                        toast({ title: 'Error', description: 'Failed to refresh AI notes. Please try again.', variant: 'destructive' });
                      } finally {
                        setAiNotesLoading(prev => { const s = new Set(prev); s.delete(`${aiNotesSubtopicInfo.topicId}-${aiNotesSubtopicInfo.subtopicId}`); return s; });
                      }
                    }}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowAiNotesOverlay(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              {/* Language Tabs */}
              <div className="max-w-7xl mx-auto px-4 pb-3">
                <div className="inline-flex rounded-lg border p-1 bg-white">
                  <button
                    onClick={() => setAiNotesLang('english')}
                    className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${aiNotesLang === 'english' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Globe className="h-4 w-4" /> English
                  </button>
                  <button
                    onClick={() => setAiNotesLang('german')}
                    className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${aiNotesLang === 'german' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Languages className="h-4 w-4" /> Deutsch
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 pb-20">
                {/* English content */}
                <div ref={englishContentRef} className={aiNotesLang === 'english' ? 'block' : 'hidden'}>
                  {renderAiNotesContent(aiNotesContent.english, { anchorPrefix: 'en' })}
                </div>
                {/* German content */}
                <div ref={germanContentRef} className={aiNotesLang === 'german' ? 'block' : 'hidden'}>
                  {renderAiNotesContent(aiNotesContent.german, { anchorPrefix: 'de' })}
                </div>
                
                {/* YouTube Video Recommendation */}
                {aiNotesContent.youtube_video && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {aiNotesLang === 'english' ? 'Recommended Video' : 'Empfohlenes Video'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {aiNotesLang === 'english' ? 'Watch this video to learn more about this topic' : 'Schauen Sie sich dieses Video an, um mehr über dieses Thema zu erfahren'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      {(() => {
                        const video = aiNotesContent.youtube_video;
                        let videoId = null;
                        let title = 'Educational Video';
                        
                        // Handle both old string format and new object format
                        if (typeof video === 'string') {
                          // Legacy string format: "URL - Title"
                          const urlMatch = video.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
                          videoId = urlMatch ? urlMatch[1] : null;
                          title = video.split(' - ').slice(1).join(' - ').trim() || 'Educational Video';
                        } else if (video && typeof video === 'object') {
                          // New object format: {url: "...", title: "..."}
                          const url = video.url || '';
                          title = video.title || 'Educational Video';
                          const urlMatch = url.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
                          videoId = urlMatch ? urlMatch[1] : null;
                        }
                        
                        if (videoId) {
                          return (
                            <div className="space-y-3">
                              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                <iframe
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title={title}
                                  className="w-full h-full"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{title}</p>
                                <a
                                  href={`https://www.youtube.com/watch?v=${videoId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                  {aiNotesLang === 'english' ? 'Watch on YouTube' : 'Auf YouTube ansehen'}
                                </a>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-4">
                              <p className="text-gray-600 mb-3">Video recommendation</p>
                              <p className="text-sm text-gray-500">
                                {aiNotesLang === 'english' ? 'Video link not available' : 'Video-Link nicht verfügbar'}
                              </p>
                            </div>
                          );
                        }
                      })()
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Practice Modal */}
      {showPracticeModal && practiceSubtopicInfo && (
        <div className="fixed inset-0 z-50">
          <div className="h-full w-full bg-white flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{practiceSubtopicInfo.subtopicTitle}</div>
                    <div className="text-xs text-gray-500 truncate">{practiceSubtopicInfo.topicTitle}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPracticeModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-6 pb-24">
                {/* Intro Text */}
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800">
                    10 Fragen basierend auf deinem Niveau ({profile?.grade_level ? `Gymnasium Klasse ${profile.grade_level}` : 'Gymnasium 9–13'})
                  </p>
                </div>

                {/* Loading State */}
                {practiceLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
                      <p className="text-gray-600">Fragen werden erstellt…</p>
                    </div>
                  </div>
                )}

                {/* Questions */}
                {!practiceLoading && practiceQuestions && practiceQuestions.length > 0 && (
                  <div className="space-y-6">
                    {practiceQuestions.map((question: any, index: number) => (
                      <div key={index} className="p-6 border rounded-lg bg-white">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-green-700">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-3">{question.question}</h3>
                            
                            {/* Question Type Specific UI */}
                             {question.type === 'mcq' && (
                               <div className="space-y-2">
                                 {question.options?.map((option: string, optIndex: number) => (
                                   <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
                                     <input 
                                       type="radio" 
                                       name={`question-${index}`} 
                                       value={option} 
                                       checked={practiceAnswers[index] === option}
                                       onChange={(e) => handleAnswerChange(index, e.target.value)}
                                       disabled={practiceSubmitted}
                                       className="text-green-600" 
                                     />
                                     <span className={`text-gray-700 ${
                                       practiceSubmitted && option === question.correct_answer 
                                         ? 'font-semibold text-green-600' 
                                         : practiceSubmitted && practiceAnswers[index] === option && option !== question.correct_answer
                                         ? 'text-red-600'
                                         : ''
                                     }`}>{option}</span>
                                   </label>
                                 ))}
                               </div>
                             )}
                             
                             {question.type === 'true_false' && (
                               <div className="space-y-2">
                                 <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                     type="radio" 
                                     name={`question-${index}`} 
                                     value="true" 
                                     checked={practiceAnswers[index] === 'true'}
                                     onChange={(e) => handleAnswerChange(index, e.target.value)}
                                     disabled={practiceSubmitted}
                                     className="text-green-600" 
                                   />
                                   <span className={`text-gray-700 ${
                                     practiceSubmitted && (question.correct_answer?.toLowerCase() === 'true' || question.correct_answer?.toLowerCase() === 'richtig')
                                       ? 'font-semibold text-green-600' 
                                       : practiceSubmitted && practiceAnswers[index] === 'true' && !(question.correct_answer?.toLowerCase() === 'true' || question.correct_answer?.toLowerCase() === 'richtig')
                                       ? 'text-red-600'
                                       : ''
                                   }`}>Richtig</span>
                                 </label>
                                 <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                     type="radio" 
                                     name={`question-${index}`} 
                                     value="false" 
                                     checked={practiceAnswers[index] === 'false'}
                                     onChange={(e) => handleAnswerChange(index, e.target.value)}
                                     disabled={practiceSubmitted}
                                     className="text-green-600" 
                                   />
                                   <span className={`text-gray-700 ${
                                     practiceSubmitted && (question.correct_answer?.toLowerCase() === 'false' || question.correct_answer?.toLowerCase() === 'falsch')
                                       ? 'font-semibold text-green-600' 
                                       : practiceSubmitted && practiceAnswers[index] === 'false' && !(question.correct_answer?.toLowerCase() === 'false' || question.correct_answer?.toLowerCase() === 'falsch')
                                       ? 'text-red-600'
                                       : ''
                                   }`}>Falsch</span>
                                 </label>
                               </div>
                             )}
                             
                             {(question.type === 'fill_blank' || question.type === 'short_answer') && (
                               <input
                                 type="text"
                                 placeholder="Ihre Antwort..."
                                 value={practiceAnswers[index] || ''}
                                 onChange={(e) => handleAnswerChange(index, e.target.value)}
                                 disabled={practiceSubmitted}
                                 className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                   practiceSubmitted 
                                     ? practiceAnswers[index]?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim()
                                       ? 'border-green-500 bg-green-50'
                                       : 'border-red-500 bg-red-50'
                                     : ''
                                 }`}
                               />
                             )}
                             
                             {/* Show correct answer after submission */}
                             {practiceSubmitted && (
                               <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                 <div className="text-sm">
                                   <span className="font-medium text-gray-700">Richtige Antwort: </span>
                                   <span className="text-green-600 font-medium">{question.correct_answer}</span>
                                 </div>
                                 {question.explanation && (
                                   <div className="text-sm text-gray-600 mt-1">
                                     <span className="font-medium">Erklärung: </span>
                                     {question.explanation}
                                   </div>
                                 )}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-white p-4 pb-20">
              <div className="max-w-4xl mx-auto">
                {/* Show score after submission */}
                 {practiceSubmitted && (
                   <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                     <div className="text-center">
                       <div className="text-2xl font-bold text-green-600 mb-1">
                         {practiceScore.correct}/{practiceScore.total} Punkte
                       </div>
                       <div className="text-sm text-gray-600">
                         {practiceScore.correct >= 8 ? 'Ausgezeichnet!' : practiceScore.correct >= 6 ? 'Gut gemacht!' : 'Weiter üben!'}
                       </div>
                     </div>
                   </div>
                 )}
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetPracticeModal();
                      setShowPracticeModal(false);
                    }}
                  >
                    {practiceSubmitted ? 'Schließen' : 'Abbrechen'}
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Regenerate questions
                        if (practiceSubtopicInfo) {
                          resetPracticeModal();
                          handlePracticeClick(
                            practiceSubtopicInfo.topicId,
                            practiceSubtopicInfo.subtopicId,
                            practiceSubtopicInfo.subtopicTitle,
                            practiceSubtopicInfo.topicTitle
                          );
                        }
                      }}
                      disabled={practiceLoading}
                    >
                      {practiceLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Wird erstellt...
                        </>
                      ) : (
                        'Neu erzeugen'
                      )}
                    </Button>
                    
                    {!practiceSubmitted && (
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handlePracticeSubmit}
                      >
                        Absenden
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}