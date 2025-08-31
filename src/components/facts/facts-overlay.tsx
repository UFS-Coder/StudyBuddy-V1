import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, ChevronRight, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Fact {
  id: string;
  category: string;
  mainFact: string;
  expandedContent?: string;
  timestamp: number;
}

interface FactsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNextFact: () => void;
  fact: Fact | null;
  isLoading?: boolean;
  onTellMeMore: () => void;
}

export const FactsOverlay: React.FC<FactsOverlayProps> = ({
  isOpen,
  onClose,
  onNextFact,
  fact,
  isLoading = false,
  onTellMeMore
}) => {
  const [showExpanded, setShowExpanded] = useState(false);

  // Reset expanded state when fact changes
  useEffect(() => {
    setShowExpanded(false);
  }, [fact?.id]);

  const handleTellMeMore = () => {
    if (!showExpanded) {
      onTellMeMore();
    }
    setShowExpanded(!showExpanded);
  };

  const handleNextFact = () => {
    setShowExpanded(false);
    onNextFact();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Overlay Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-sm sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto"
        >
          <Card className="shadow-2xl border-2 border-primary/20">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20 flex-shrink-0">
                    <AvatarImage src="/buddy-avatar.svg" alt="Buddy" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm sm:text-base">
                      🤖
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
                      <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                      <span className="truncate">Did you know?</span>
                    </CardTitle>
                    {fact?.category && (
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                        {fact.category.replace('_', ' & ')}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-9 w-9 sm:h-8 sm:w-8 p-0 rounded-full flex-shrink-0 touch-manipulation"
                  aria-label="Close facts overlay"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              {isLoading ? (
                <div className="py-6 sm:py-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                  </div>
                  <div className="overflow-hidden bg-muted/50 rounded-lg p-3">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted-foreground/20 rounded animate-pulse"></div>
                      <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="h-4 bg-muted-foreground/20 rounded animate-pulse w-3/4" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <div className="mt-3 overflow-hidden">
                       <div className="whitespace-nowrap animate-marquee">
                         <p className="text-xs text-muted-foreground inline-block">
                           🤖 Generating fresh fact from AI... ✨ Please wait while we create something amazing for you... 🎯
                         </p>
                       </div>
                     </div>
                  </div>
                </div>
              ) : fact ? (
                <>
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {fact.mainFact}
                    </p>
                    
                    <AnimatePresence>
                      {showExpanded && fact.expandedContent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {fact.expandedContent}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={handleTellMeMore}
                        className="flex-1 text-xs sm:text-sm h-10 sm:h-9 touch-manipulation"
                        disabled={isLoading}
                      >
                        {showExpanded ? 'Show Less' : 'Tell me more'}
                        {!showExpanded && <ChevronRight className="ml-1 h-3 w-3" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="default"
                        onClick={handleNextFact}
                        className="flex-1 text-xs sm:text-sm h-10 sm:h-9 touch-manipulation"
                        disabled={isLoading}
                      >
                        Next fact
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="default"
                      size="default"
                      onClick={onClose}
                      className="w-full text-xs sm:text-sm h-10 sm:h-9 touch-manipulation"
                    >
                      Close
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">No fact available at the moment.</p>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleNextFact}
                    className="h-10 sm:h-9 px-6 text-xs sm:text-sm touch-manipulation"
                  >
                    Try again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FactsOverlay;