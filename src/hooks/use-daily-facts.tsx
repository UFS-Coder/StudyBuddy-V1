import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface Fact {
  id: string;
  category: string;
  mainFact: string;
  expandedContent?: string;
  timestamp: number;
}

interface DailyFactsCache {
  date: string;
  facts: Fact[];
  currentIndex: number;
  userId: string;
}

const FACT_CATEGORIES = [
  'india_epics',
  'science_tech', 
  'history',
  'sports',
  'culture_lifestyle',
  'internet_digital'
];

const FALLBACK_FACTS: Fact[] = [
  {
    id: 'fallback-1',
    category: 'india_epics',
    mainFact: 'The Mahabharata is the longest epic poem ever written, containing over 100,000 verses!',
    expandedContent: 'This ancient Sanskrit epic is about 10 times longer than the Iliad and Odyssey combined. It tells the story of the Kurukshetra War and includes the famous Bhagavad Gita as one of its sections.',
    timestamp: Date.now()
  },
  {
    id: 'fallback-2', 
    category: 'science_tech',
    mainFact: 'A single teaspoon of neutron star material would weigh about 6 billion tons on Earth!',
    expandedContent: 'Neutron stars are incredibly dense remnants of massive stars. They are so dense that a sugar-cube-sized piece would weigh as much as Mount Everest.',
    timestamp: Date.now()
  },
  {
    id: 'fallback-3',
    category: 'history', 
    mainFact: 'The Great Wall of China is not visible from space with the naked eye, despite popular belief.',
    expandedContent: 'This common myth has been debunked by astronauts. While the wall is massive, it\'s too narrow to be seen from space without aid. Many other human-made structures are more visible from orbit.',
    timestamp: Date.now()
  }
];

const GROQ_PROMPT = `You are Buddy, a fun, respectful, and family-friendly guide for teenagers.
Produce short, surprising "Did you know?" facts with simple language.

Constraints:
- Main fact: max 2 sentences (≈30–40 words total).
- If the user asks "Tell me more", reply with 2–3 concise sentences (no more than 70–80 words).
- Rotate topics across sessions: India & epics (Gita, Mahabharata, Ramayana, festivals, traditions), Science & technology, History (India + world), Sports, Culture & lifestyle, Internet & digital world.
- Keep it positive, non-political, and culturally respectful.
- No sensitive claims; avoid medical/legal advice; no links.

Generate a fact for category: {category}. Return only the main fact, nothing else.`;

const GROQ_EXPAND_PROMPT = `You are Buddy. The user wants to know more about this fact: "{fact}"

Provide 2-3 concise sentences (no more than 70-80 words) with additional context. Keep it teen-friendly, positive, and respectful.`;

export const useDailyFacts = () => {
  const { user } = useAuth();
  const [currentFact, setCurrentFact] = useState<Fact | null>(null);
  const [cache, setCache] = useState<DailyFactsCache | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNextFactLoading, setIsNextFactLoading] = useState(false);

  // Get today's date in Berlin timezone
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

  // Load cache from localStorage
  const loadCache = useCallback(() => {
    if (!user?.id) return null;
    
    try {
      const cacheKey = `daily-facts-${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache: DailyFactsCache = JSON.parse(cached);
        const today = getTodayKey();
        
        // Return cache only if it's for today and same user
        if (parsedCache.date === today && parsedCache.userId === user.id) {
          return parsedCache;
        }
      }
    } catch (error) {
      console.error('Error loading facts cache:', error);
    }
    return null;
  }, [user?.id]);

  // Save cache to localStorage
  const saveCache = useCallback((cacheData: DailyFactsCache) => {
    if (!user?.id) return;
    
    try {
      const cacheKey = `daily-facts-${user.id}`;
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving facts cache:', error);
    }
  }, [user?.id]);

  // Call Groq API for facts
  const fetchFactFromGroq = async (category: string): Promise<string> => {
    try {
      const response = await fetch('/api/groq-facts', {
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
        throw new Error('Failed to fetch fact from Groq');
      }

      const data = await response.json();
      return data.fact || '';
    } catch (error) {
      console.error('Error fetching fact from Groq:', error);
      throw error;
    }
  };

  // Expand fact with more details
  const expandFact = async (fact: string): Promise<string> => {
    try {
      const response = await fetch('/api/groq-facts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: GROQ_EXPAND_PROMPT.replace('{fact}', fact),
          expand: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to expand fact');
      }

      const data = await response.json();
      return data.expansion || '';
    } catch (error) {
      console.error('Error expanding fact:', error);
      throw error;
    }
  };

  // Generate facts for the day
  const generateDailyFacts = async (): Promise<Fact[]> => {
    const facts: Fact[] = [];
    
    for (let i = 0; i < FACT_CATEGORIES.length; i++) {
      const category = FACT_CATEGORIES[i];
      try {
        const factText = await fetchFactFromGroq(category);
        if (factText.trim()) {
          facts.push({
            id: `${category}-${Date.now()}-${i}`,
            category,
            mainFact: factText.trim(),
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`Error generating fact for ${category}:`, error);
        // Add fallback fact if available
        const fallback = FALLBACK_FACTS.find(f => f.category === category);
        if (fallback) {
          facts.push({
            ...fallback,
            id: `fallback-${category}-${Date.now()}`
          });
        }
      }
    }

    // If no facts were generated, use all fallback facts
    if (facts.length === 0) {
      return FALLBACK_FACTS.map(f => ({ ...f, id: `fallback-${Date.now()}-${Math.random()}` }));
    }

    return facts;
  };

  // Initialize or load daily facts
  const initializeFacts = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    
    try {
      // Clear old cache and generate fresh facts
      const cacheKey = `daily-facts-${user.id}`;
      localStorage.removeItem(cacheKey);

      // Generate new facts for today
      const facts = await generateDailyFacts();
      const newCache: DailyFactsCache = {
        date: getTodayKey(),
        facts,
        currentIndex: 0,
        userId: user.id
      };
      
      setCache(newCache);
      setCurrentFact(facts[0] || null);
      saveCache(newCache);
      
    } catch (error) {
      console.error('Error initializing facts:', error);
      // Use fallback facts
      const fallbackCache: DailyFactsCache = {
        date: getTodayKey(),
        facts: FALLBACK_FACTS,
        currentIndex: 0,
        userId: user.id
      };
      setCache(fallbackCache);
      setCurrentFact(FALLBACK_FACTS[0]);
      saveCache(fallbackCache);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadCache, saveCache]);

  // Get next fact - now generates fresh facts from Groq
  const getNextFact = useCallback(async () => {
    if (!cache || !user?.id) return;
    
    setIsNextFactLoading(true);
    
    try {
       // Get a random category for variety, but avoid the current fact's category if possible
       let availableCategories = FACT_CATEGORIES;
       if (currentFact && FACT_CATEGORIES.length > 1) {
         availableCategories = FACT_CATEGORIES.filter(cat => cat !== currentFact.category);
       }
       const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
       
       // Add a small delay to show loading state
       await new Promise(resolve => setTimeout(resolve, 500));
       
       // Try to generate a fresh fact from Groq
       const factText = await fetchFactFromGroq(randomCategory);
      
      if (factText.trim()) {
        const newFact: Fact = {
          id: `${randomCategory}-${Date.now()}-${Math.random()}`,
          category: randomCategory,
          mainFact: factText.trim(),
          timestamp: Date.now()
        };
        
        setCurrentFact(newFact);
        
        // Add to cache but don't save to localStorage (keep it session-only for fresh facts)
        const updatedCache = {
          ...cache,
          facts: [...cache.facts, newFact],
          currentIndex: cache.facts.length
        };
        setCache(updatedCache);
      } else {
        // Fallback to cycling through existing facts if Groq fails
        const nextIndex = (cache.currentIndex + 1) % cache.facts.length;
        const nextFact = cache.facts[nextIndex];
        
        const updatedCache = { ...cache, currentIndex: nextIndex };
        setCache(updatedCache);
        setCurrentFact(nextFact);
        saveCache(updatedCache);
      }
    } catch (error) {
      console.error('Error generating next fact:', error);
      
      // Fallback to cycling through existing facts
      const nextIndex = (cache.currentIndex + 1) % cache.facts.length;
      const nextFact = cache.facts[nextIndex];
      
      const updatedCache = { ...cache, currentIndex: nextIndex };
      setCache(updatedCache);
      setCurrentFact(nextFact);
      saveCache(updatedCache);
    } finally {
      setIsNextFactLoading(false);
    }
  }, [cache, saveCache, user?.id, currentFact]);

  // Tell me more functionality
  const tellMeMore = useCallback(async () => {
    if (!currentFact || currentFact.expandedContent) return;
    
    setIsLoading(true);
    try {
      const expansion = await expandFact(currentFact.mainFact);
      const updatedFact = { ...currentFact, expandedContent: expansion };
      setCurrentFact(updatedFact);
      
      // Update cache with expanded content
      if (cache) {
        const updatedFacts = cache.facts.map(f => 
          f.id === currentFact.id ? updatedFact : f
        );
        const updatedCache = { ...cache, facts: updatedFacts };
        setCache(updatedCache);
        saveCache(updatedCache);
      }
    } catch (error) {
      console.error('Error expanding fact:', error);
      // Provide a generic expansion as fallback
      const updatedFact = { 
        ...currentFact, 
        expandedContent: 'This is a fascinating topic with many interesting aspects to explore further!' 
      };
      setCurrentFact(updatedFact);
    } finally {
      setIsLoading(false);
    }
  }, [currentFact, cache, saveCache]);

  // Check if facts should be shown today
  const shouldShowFactsToday = useCallback(() => {
    if (!user?.id) return false;
    
    try {
      const shownKey = `facts-shown-${user.id}-${getTodayKey()}`;
      return !localStorage.getItem(shownKey);
    } catch {
      return true;
    }
  }, [user?.id]);

  // Mark facts as shown for today
  const markFactsAsShown = useCallback(() => {
    if (!user?.id) return;
    
    try {
      const shownKey = `facts-shown-${user.id}-${getTodayKey()}`;
      localStorage.setItem(shownKey, 'true');
    } catch (error) {
      console.error('Error marking facts as shown:', error);
    }
  }, [user?.id]);

  return {
    currentFact,
    isLoading,
    isNextFactLoading,
    initializeFacts,
    getNextFact,
    tellMeMore,
    shouldShowFactsToday,
    markFactsAsShown
  };
};