import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  timestamp: number;
}

interface DailyQuizState {
  date: string;
  question: QuizQuestion | null;
  answered: boolean;
  userId: string;
  isCorrect?: boolean;
}

interface UsedQuestionsCache {
  userId: string;
  questions: Set<string>; // Store question text hashes to avoid duplicates
  lastCleanup: number; // Timestamp of last cleanup
}

const QUIZ_CATEGORIES = [
  'science',
  'history',
  'sports',
  'culture',
  'internet',
  'indian_culture_history'
];

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'fallback-1',
    question: 'Which river is considered the holiest in India?',
    options: ['Yamuna', 'Ganges', 'Brahmaputra', 'Godavari'],
    correct_answer: 'Ganges',
    explanation: 'The Ganges (Ganga) is considered the holiest river in India. It holds immense spiritual significance in Hinduism and is personified as the goddess Ganga.',
    timestamp: Date.now()
  },
  {
    id: 'fallback-2',
    question: 'What is the speed of light in vacuum?',
    options: ['299,792 km/s', '150,000 km/s', '199,792 km/s', '250,000 km/s'],
    correct_answer: '299,792 km/s',
    explanation: 'Light travels at approximately 299,792 kilometers per second (or about 186,282 miles per second) in a vacuum. This is the maximum speed at which energy, matter, or information can travel.',
    timestamp: Date.now()
  },
  {
    id: 'fallback-3',
    question: 'Which of these is NOT one of the Seven Wonders of the Ancient World?',
    options: ['Great Pyramid of Giza', 'Hanging Gardens of Babylon', 'Taj Mahal', 'Colossus of Rhodes'],
    correct_answer: 'Taj Mahal',
    explanation: 'The Taj Mahal is not one of the Seven Wonders of the Ancient World. It is a modern wonder, part of the New Seven Wonders of the World. The Seven Wonders of the Ancient World included the Great Pyramid of Giza, Hanging Gardens of Babylon, Temple of Artemis, Statue of Zeus, Mausoleum at Halicarnassus, Colossus of Rhodes, and the Lighthouse of Alexandria.',
    timestamp: Date.now()
  }
];

const GROQ_PROMPT = `You are Buddy, a fun, respectful, and family-friendly guide for teenagers.
Generate one general knowledge quiz question with multiple choice options.

Constraints:
- Question should be clear and concise (max 25 words)
- Provide exactly 4 multiple choice options (A, B, C, D)
- Include the correct answer
- Provide a brief explanation (2-3 sentences) for the answer that teaches the student something valuable
- Rotate topics across: Science, History, Sports, Culture, Internet, Indian culture & history
- Keep it positive, non-political, and culturally respectful
- No sensitive claims; avoid medical/legal advice

Generate a question for category: {category}. Return in this JSON format only:
{
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "The correct option text",
  "explanation": "Brief explanation of the answer"
}`;

export const useDailyQuiz = () => {
  const { user } = useAuth();
  const [quizState, setQuizState] = useState<DailyQuizState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Helper function to create a simple hash of question text
  const hashQuestion = (question: string): string => {
    return btoa(question.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 16);
  };

  // Load used questions cache
  const loadUsedQuestions = useCallback((): UsedQuestionsCache => {
    if (!user?.id) return { userId: '', questions: new Set<string>(), lastCleanup: Date.now() };
    
    try {
      const cacheKey = `used-quiz-questions-${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Convert array back to Set with proper typing
        const questionsArray: string[] = parsedCache.questions || [];
        const questionsSet = new Set<string>(questionsArray);
        
        // Clean up old questions (older than 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (parsedCache.lastCleanup < thirtyDaysAgo) {
          questionsSet.clear(); // Clear all old questions
          return { userId: user.id, questions: questionsSet, lastCleanup: Date.now() };
        }
        
        return { userId: user.id, questions: questionsSet, lastCleanup: parsedCache.lastCleanup || Date.now() };
      }
    } catch (error) {
      console.error('Error loading used questions cache:', error);
    }
    return { userId: user.id, questions: new Set<string>(), lastCleanup: Date.now() };
  }, [user?.id]);

  // Save used questions cache
  const saveUsedQuestions = useCallback((cache: UsedQuestionsCache) => {
    if (!user?.id) return;
    
    try {
      const cacheKey = `used-quiz-questions-${user.id}`;
      // Convert Set to array for JSON serialization
      const serializable = {
        userId: cache.userId,
        questions: Array.from(cache.questions),
        lastCleanup: cache.lastCleanup
      };
      localStorage.setItem(cacheKey, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving used questions cache:', error);
    }
  }, [user?.id]);

  // Check if question has been used before
  const isQuestionUsed = useCallback((question: string): boolean => {
    const cache = loadUsedQuestions();
    const questionHash = hashQuestion(question);
    return cache.questions.has(questionHash);
  }, [loadUsedQuestions]);

  // Mark question as used
  const markQuestionAsUsed = useCallback((question: string) => {
    const cache = loadUsedQuestions();
    const questionHash = hashQuestion(question);
    cache.questions.add(questionHash);
    saveUsedQuestions(cache);
  }, [loadUsedQuestions, saveUsedQuestions]);

  // Get today's date in Berlin timezone (matching the facts implementation)
  const getTodayKey = () => {
    const now = new Date();
    const berlinTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    return berlinTime;
  };

  // Load quiz state from localStorage
  const loadQuizState = useCallback(() => {
    if (!user?.id) return null;
    
    try {
      const stateKey = `daily-quiz-${user.id}`;
      const cached = localStorage.getItem(stateKey);
      if (cached) {
        const parsedState: DailyQuizState = JSON.parse(cached);
        const today = getTodayKey();
        
        // Return state only if it's for today and same user
        if (parsedState.date === today && parsedState.userId === user.id) {
          return parsedState;
        }
      }
    } catch (error) {
      console.error('Error loading quiz state:', error);
    }
    return null;
  }, [user?.id]);

  // Save quiz state to localStorage
  const saveQuizState = useCallback((state: DailyQuizState) => {
    if (!user?.id) return;
    
    try {
      const stateKey = `daily-quiz-${user.id}`;
      localStorage.setItem(stateKey, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving quiz state:', error);
    }
  }, [user?.id]);

  // Call Groq API for quiz question with duplicate checking
  const fetchQuizQuestion = async (category: string, maxRetries: number = 3): Promise<QuizQuestion> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('/api/groq-quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: GROQ_PROMPT.replace('{category}', category.replace('_', ' & ')),
            category
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quiz question');
        }

        const data = await response.json();
        const question = data.question;
        
        // Check if this question has been used before
        if (!isQuestionUsed(question)) {
          const newQuestion: QuizQuestion = {
            id: `${category}-${Date.now()}`,
            question: question,
            options: data.options,
            correct_answer: data.correct_answer,
            explanation: data.explanation,
            timestamp: Date.now()
          };
          
          // Mark this question as used
          markQuestionAsUsed(question);
          return newQuestion;
        }
        
        console.log(`Question already used, retrying... (attempt ${attempt + 1}/${maxRetries})`);
      } catch (error) {
        console.error(`Error fetching quiz question (attempt ${attempt + 1}):`, error);
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }
    
    throw new Error('Failed to generate unique question after multiple attempts');
  };

  // Generate daily quiz question with category rotation for uniqueness
  const generateDailyQuestion = async (): Promise<QuizQuestion> => {
    // Shuffle categories to try different ones
    const shuffledCategories = [...QUIZ_CATEGORIES].sort(() => Math.random() - 0.5);
    
    // Try each category until we get a unique question
    for (const category of shuffledCategories) {
      try {
        return await fetchQuizQuestion(category);
      } catch (error) {
        console.error(`Error generating question for ${category}:`, error);
        // Continue to next category
      }
    }
    
    // If all categories failed, try fallback questions
    const unusedFallbacks = FALLBACK_QUESTIONS.filter(q => !isQuestionUsed(q.question));
    
    if (unusedFallbacks.length > 0) {
      const fallback = unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
      const fallbackQuestion = {
        ...fallback,
        id: `fallback-${Date.now()}`
      };
      
      // Mark fallback question as used
      markQuestionAsUsed(fallback.question);
      return fallbackQuestion;
    }
    
    // If even fallbacks are exhausted, clear the cache and use any fallback
    console.warn('All questions exhausted, clearing used questions cache');
    const cache = loadUsedQuestions();
    cache.questions.clear();
    saveUsedQuestions(cache);
    
    const fallback = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
    const resetFallback = {
      ...fallback,
      id: `reset-fallback-${Date.now()}`
    };
    
    markQuestionAsUsed(fallback.question);
    return resetFallback;
  };

  // Initialize or load daily quiz
  const initializeQuiz = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    
    try {
      // Check if we already have a quiz for today
      const existingState = loadQuizState();
      if (existingState) {
        setQuizState(existingState);
        setHasAnswered(existingState.answered);
        setIsCorrect(existingState.isCorrect || null);
        return;
      }
      
      // Generate new question for today
      const question = await generateDailyQuestion();
      const newState: DailyQuizState = {
        date: getTodayKey(),
        question,
        answered: false,
        userId: user.id
      };
      
      setQuizState(newState);
      setHasAnswered(false);
      setIsCorrect(null);
      saveQuizState(newState);
      
    } catch (error) {
      console.error('Error initializing quiz:', error);
      // Use fallback question
      const fallback = FALLBACK_QUESTIONS[0];
      const fallbackState: DailyQuizState = {
        date: getTodayKey(),
        question: fallback,
        answered: false,
        userId: user.id
      };
      setQuizState(fallbackState);
      setHasAnswered(false);
      saveQuizState(fallbackState);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadQuizState, saveQuizState]);

  // Submit answer
  const submitAnswer = useCallback((answer: string) => {
    if (!quizState || !quizState.question || hasAnswered) return;
    
    setSelectedAnswer(answer);
    const correct = answer === quizState.question.correct_answer;
    setIsCorrect(correct);
    setHasAnswered(true);
    
    // Update quiz state
    const updatedState = {
      ...quizState,
      answered: true,
      isCorrect: correct
    };
    setQuizState(updatedState);
    saveQuizState(updatedState);
  }, [quizState, hasAnswered, saveQuizState]);

  // Check if quiz should be shown today
  const shouldShowQuizToday = useCallback(() => {
    if (!user?.id) return false;
    
    const existingState = loadQuizState();
    // Show quiz if we don't have state for today or if it hasn't been answered
    return !existingState || !existingState.answered;
  }, [user?.id, loadQuizState]);

  // Force refresh quiz with new question (uses duplicate prevention)
  const refreshQuiz = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    
    try {
      // Generate new unique question regardless of existing state
      const question = await generateDailyQuestion();
      const newState: DailyQuizState = {
        date: getTodayKey(),
        question,
        answered: false,
        userId: user.id
      };
      
      setQuizState(newState);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
      saveQuizState(newState);
      
    } catch (error) {
      console.error('Error refreshing quiz:', error);
      // This should rarely happen now due to improved fallback logic in generateDailyQuestion
      const fallback = FALLBACK_QUESTIONS[0]; // Use first fallback as last resort
      const fallbackState: DailyQuizState = {
        date: getTodayKey(),
        question: {
          ...fallback,
          id: `emergency-fallback-${Date.now()}`
        },
        answered: false,
        userId: user.id
      };
      setQuizState(fallbackState);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
      saveQuizState(fallbackState);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, saveQuizState]);

  // Reset for testing purposes (not exposed in return)
  const resetQuizState = useCallback(() => {
    if (!user?.id) return;
    
    try {
      const stateKey = `daily-quiz-${user.id}`;
      localStorage.removeItem(stateKey);
      setQuizState(null);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } catch (error) {
      console.error('Error resetting quiz state:', error);
    }
  }, [user?.id]);

  return {
    quizState,
    isLoading,
    hasAnswered,
    selectedAnswer,
    isCorrect,
    initializeQuiz,
    refreshQuiz,
    submitAnswer,
    shouldShowQuizToday
  };
};