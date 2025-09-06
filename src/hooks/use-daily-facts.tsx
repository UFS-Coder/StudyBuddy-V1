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

// Duplicate prevention helpers for facts
interface UsedFactsCache {
  userId: string;
  usedFacts: Set<string>;
  lastCleanup: number;
}

// Simple hash of normalized fact text (browser-safe)
const hashFact = (fact: string): string => {
  const normalized = fact.toLowerCase().replace(/[^a-z0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0; // djb2-like
  }
  return Math.abs(hash).toString(36);
};

const loadUsedFacts = (userId: string): UsedFactsCache => {
  try {
    const cacheKey = `used-facts-${userId}`;
    const cached = localStorage.getItem(cacheKey);
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    if (cached) {
      const data = JSON.parse(cached);
      if (!data.lastCleanup || data.lastCleanup < thirtyDaysAgo) {
        return { userId, usedFacts: new Set<string>(), lastCleanup: now };
      }
      const factsArray: string[] = Array.isArray(data.usedFacts) ? data.usedFacts : [];
      return {
        userId,
        usedFacts: new Set<string>(factsArray),
        lastCleanup: data.lastCleanup || now,
      };
    }
  } catch (e) {
    console.error('Error loading used facts cache:', e);
  }
  return { userId, usedFacts: new Set<string>(), lastCleanup: Date.now() };
};

const saveUsedFacts = (cache: UsedFactsCache) => {
  try {
    const cacheKey = `used-facts-${cache.userId}`;
    const data = {
      userId: cache.userId,
      usedFacts: Array.from(cache.usedFacts),
      lastCleanup: cache.lastCleanup,
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving used facts cache:', e);
  }
};

const isFactUsed = (fact: string, userId: string): boolean => {
  const cache = loadUsedFacts(userId);
  const factHash = hashFact(fact);
  return cache.usedFacts.has(factHash);
};

const markFactAsUsed = (fact: string, userId: string): void => {
  const cache = loadUsedFacts(userId);
  const factHash = hashFact(fact);
  cache.usedFacts.add(factHash);
  saveUsedFacts(cache);
};

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
      
      // Handle rate limit errors specifically
      if (response.status === 429) {
        console.warn('Rate limit reached for Groq API, using fallbacks');
        throw new Error('rate_limit_exceeded');
      }
      
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
    if (!user?.id) return [];
    
    const facts: Fact[] = [];
    
    // Shuffle categories for variety
    const shuffledCategories = [...FACT_CATEGORIES].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledCategories.length; i++) {
      const category = shuffledCategories[i];
      try {
        const factText = await fetchFactFromGroq(category);
        if (factText.trim()) {
          // Skip if already used
          if (isFactUsed(factText, user.id)) {
            continue;
          }
          // Mark as used and add
          markFactAsUsed(factText, user.id);
          facts.push({
            id: `${category}-${Date.now()}-${i}`,
            category,
            mainFact: factText.trim(),
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`Error generating fact for ${category}:`, error);
        
        // Try with a different category if available
        const remainingCategories = FACT_CATEGORIES.filter(cat => 
          cat !== category && !shuffledCategories.slice(0, i).includes(cat)
        );
        
        if (remainingCategories.length > 0) {
          const altCategory = remainingCategories[Math.floor(Math.random() * remainingCategories.length)];
          try {
            const altFactText = await fetchFactFromGroq(altCategory);
            if (altFactText.trim() && !isFactUsed(altFactText, user.id)) {
              markFactAsUsed(altFactText, user.id);
              facts.push({
                id: `${altCategory}-${Date.now()}-${i}`,
                category: altCategory,
                mainFact: altFactText.trim(),
                timestamp: Date.now()
              });
              continue;
            }
          } catch (altError) {
            console.error(`Error with alternative category ${altCategory}:`, altError);
          }
        }
        
        // Add unused fallback fact if available
        const unusedFallbacks = FALLBACK_FACTS.filter(f => 
          f.category === category && !isFactUsed(f.mainFact, user.id)
        );
        
        if (unusedFallbacks.length > 0) {
          const fallback = unusedFallbacks[0];
          markFactAsUsed(fallback.mainFact, user.id);
          facts.push({
            ...fallback,
            id: `fallback-${category}-${Date.now()}`
          });
        }
      }
    }

    // If no facts were generated, use unused fallback facts, else clear cache and use fallbacks
    if (facts.length === 0) {
      const unusedFallbacks = FALLBACK_FACTS.filter(f => !isFactUsed(f.mainFact, user.id));
      
      if (unusedFallbacks.length === 0) {
        // If all fallbacks are used, clear the cache and use all fallbacks
        const cache = loadUsedFacts(user.id);
        cache.usedFacts.clear();
        saveUsedFacts(cache);
        console.log('All facts exhausted, cleared used facts cache');
      }
      
      const factsToUse = unusedFallbacks.length > 0 ? unusedFallbacks : FALLBACK_FACTS;
      return factsToUse.map(f => {
        markFactAsUsed(f.mainFact, user.id);
        return { ...f, id: `fallback-${Date.now()}-${Math.random()}` };
      });
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
       await new Promise(resolve => setTimeout(resolve, 300));
       
       // Try to generate a fresh fact from Groq (with duplicate checking)
       let factText = '';
       let attempts = 0;
       const maxAttempts = 3;

       // Try different categories on retries
       let categoriesPool = [...availableCategories].sort(() => Math.random() - 0.5);
       
       while (attempts < maxAttempts && categoriesPool.length > 0) {
         const categoryTry = categoriesPool.shift()!;
         try {
           const candidate = await fetchFactFromGroq(categoryTry);
           if (candidate.trim() && !isFactUsed(candidate, user.id)) {
             factText = candidate.trim();
             // Use this category for the fact
             const newFact: Fact = {
               id: `${categoryTry}-${Date.now()}-${Math.random()}`,
               category: categoryTry,
               mainFact: factText,
               timestamp: Date.now()
             };
             // Mark as used and set
             markFactAsUsed(newFact.mainFact, user.id);
             setCurrentFact(newFact);
             // Add to in-memory cache (session-only)
             const updatedCache = {
               ...cache,
               facts: [...cache.facts, newFact],
               currentIndex: cache.facts.length
             };
             setCache(updatedCache);
             return;
           }
         } catch (e) {
           // swallow and try next
         }
         attempts++;
       }

      // Fallback to unused fallback facts
      const unusedFallbacks = FALLBACK_FACTS.filter(f => !isFactUsed(f.mainFact, user.id));
      if (unusedFallbacks.length > 0) {
        const fallback = unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        markFactAsUsed(fallback.mainFact, user.id);
        const fallbackFact: Fact = {
          ...fallback,
          id: `fallback-${Date.now()}-${Math.random()}`
        };
        setCurrentFact(fallbackFact);
        return;
      }

      // All fallbacks used, clear used facts cache and use a random fallback
      const usedFactsCache = loadUsedFacts(user.id);
      usedFactsCache.usedFacts.clear();
      saveUsedFacts(usedFactsCache);
      const randomFallback = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
      markFactAsUsed(randomFallback.mainFact, user.id);
      const resetFallbackFact: Fact = {
        ...randomFallback,
        id: `fallback-reset-${Date.now()}-${Math.random()}`
      };
      setCurrentFact(resetFallbackFact);
    } catch (error) {
      console.error('Error generating next fact:', error);
      // Same fallback logic on error
      const unusedFallbacks = FALLBACK_FACTS.filter(f => !isFactUsed(f.mainFact, user.id));
      if (unusedFallbacks.length > 0) {
        const fallback = unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        markFactAsUsed(fallback.mainFact, user.id);
        const fallbackFact: Fact = {
          ...fallback,
          id: `fallback-${Date.now()}-${Math.random()}`
        };
        setCurrentFact(fallbackFact);
      } else {
        const usedFactsCache = loadUsedFacts(user.id);
        usedFactsCache.usedFacts.clear();
        saveUsedFacts(usedFactsCache);
        const randomFallback = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
        markFactAsUsed(randomFallback.mainFact, user.id);
        const resetFallbackFact: Fact = {
          ...randomFallback,
          id: `fallback-reset-${Date.now()}-${Math.random()}`
        };
        setCurrentFact(resetFallbackFact);
      }
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

  // Refresh facts - generate a completely new fact
  const refreshFacts = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Get a random category for variety
      const randomCategory = FACT_CATEGORIES[Math.floor(Math.random() * FACT_CATEGORIES.length)];
      
      // Try to generate a fresh fact from Groq (with duplicate checking)
      let factText = '';
      let attempts = 0;
      const maxAttempts = 3;
      let categoriesPool = [...FACT_CATEGORIES].sort(() => Math.random() - 0.5);
      
      while (attempts < maxAttempts && categoriesPool.length > 0) {
        const categoryTry = categoriesPool.shift()!;
        try {
          const candidate = await fetchFactFromGroq(categoryTry);
          if (candidate.trim() && !isFactUsed(candidate, user.id)) {
            factText = candidate.trim();
            const newFact: Fact = {
              id: `${categoryTry}-${Date.now()}-${Math.random()}`,
              category: categoryTry,
              mainFact: factText,
              timestamp: Date.now()
            };
            markFactAsUsed(newFact.mainFact, user.id);
            setCurrentFact(newFact);
            // Update cache with the new fact
            if (cache) {
              const updatedCache = {
                ...cache,
                facts: [newFact, ...cache.facts],
                currentIndex: 0
              };
              setCache(updatedCache);
              saveCache(updatedCache);
            }
            return;
          }
        } catch (e) {
          // try next
        }
        attempts++;
      }
      
      // Fallback to unused fallback facts
      const unusedFallbacks = FALLBACK_FACTS.filter(f => !isFactUsed(f.mainFact, user.id));
      
      if (unusedFallbacks.length > 0) {
        const randomFallback = unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        markFactAsUsed(randomFallback.mainFact, user.id);
        const fallbackFact = {
          ...randomFallback,
          id: `fallback-${Date.now()}-${Math.random()}`
        };
        setCurrentFact(fallbackFact);
      } else {
        // All fallbacks used, use first fallback as emergency after clearing used cache
        const usedFactsCache = loadUsedFacts(user.id);
        usedFactsCache.usedFacts.clear();
        saveUsedFacts(usedFactsCache);
        const emergencyFact = {
          ...FALLBACK_FACTS[0],
          id: `emergency-fallback-${Date.now()}`
        };
        markFactAsUsed(emergencyFact.mainFact, user.id);
        setCurrentFact(emergencyFact);
      }
    } catch (error) {
      console.error('Error refreshing facts:', error);
      
      // Fallback to unused fallback facts
      const unusedFallbacks = FALLBACK_FACTS.filter(f => !isFactUsed(f.mainFact, user.id));
      
      if (unusedFallbacks.length > 0) {
        const randomFallback = unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        markFactAsUsed(randomFallback.mainFact, user.id);
        const fallbackFact = {
          ...randomFallback,
          id: `fallback-${Date.now()}-${Math.random()}`
        };
        setCurrentFact(fallbackFact);
      } else {
        // All fallbacks used, use first fallback as emergency after clearing used cache
        const usedFactsCache = loadUsedFacts(user.id);
        usedFactsCache.usedFacts.clear();
        saveUsedFacts(usedFactsCache);
        const emergencyFact = {
          ...FALLBACK_FACTS[0],
          id: `emergency-fallback-${Date.now()}`
        };
        markFactAsUsed(emergencyFact.mainFact, user.id);
        setCurrentFact(emergencyFact);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, cache, saveCache]);

  return {
    currentFact,
    isLoading,
    isNextFactLoading,
    initializeFacts,
    getNextFact,
    refreshFacts,
    tellMeMore,
    shouldShowFactsToday,
    markFactsAsShown
  };
};