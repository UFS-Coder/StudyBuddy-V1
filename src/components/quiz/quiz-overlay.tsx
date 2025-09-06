import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, CheckCircle2, XCircle, BrainCircuit, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  timestamp: number;
}

interface QuizOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuizQuestion | null;
  isLoading?: boolean;
  onSubmitAnswer: (answer: string) => void;
  hasAnswered: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  onRefresh?: () => void;
}

export const QuizOverlay: React.FC<QuizOverlayProps> = ({
  isOpen,
  onClose,
  question,
  isLoading = false,
  onSubmitAnswer,
  hasAnswered,
  selectedAnswer,
  isCorrect,
  onRefresh
}) => {
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);

  // Reset local answer when question changes
  useEffect(() => {
    setLocalAnswer(null);
  }, [question?.id]);

  // Update local answer when selectedAnswer changes (for persistence)
  useEffect(() => {
    if (selectedAnswer) {
      setLocalAnswer(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleSubmit = () => {
    if (localAnswer && !hasAnswered) {
      onSubmitAnswer(localAnswer);
    }
  };

  // Prevent closing if not answered
  const handleClose = () => {
    if (hasAnswered) {
      onClose();
    }
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
          onClick={hasAnswered ? handleClose : undefined} // Only allow closing if answered
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
                      <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">Daily Knowledge Quiz</span>
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Answer to continue
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onRefresh && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRefresh}
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 rounded-full flex-shrink-0 touch-manipulation"
                      aria-label="Get new question"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  {hasAnswered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 rounded-full flex-shrink-0 touch-manipulation"
                      aria-label="Close quiz overlay"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
                           🤖 Generating today's quiz question... ✨ Please wait while we create something amazing for you... 🎯
                         </p>
                       </div>
                     </div>
                  </div>
                </div>
              ) : question ? (
                <>
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-sm sm:text-base font-medium leading-relaxed">
                      {question.question}
                    </p>
                    
                    <div className="pt-2">
                      <RadioGroup 
                        value={localAnswer || ''} 
                        onValueChange={setLocalAnswer}
                        disabled={hasAnswered}
                        className="space-y-2"
                      >
                        {question.options.map((option, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center space-x-2 rounded-md border p-3 ${hasAnswered && option === question.correct_answer ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : ''} ${hasAnswered && option === localAnswer && option !== question.correct_answer ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900' : ''}`}
                          >
                            <RadioGroupItem 
                              value={option} 
                              id={`option-${index}`} 
                              disabled={hasAnswered}
                            />
                            <Label 
                              htmlFor={`option-${index}`} 
                              className="flex-1 cursor-pointer"
                            >
                              {option}
                            </Label>
                            {hasAnswered && option === question.correct_answer && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {hasAnswered && option === localAnswer && option !== question.correct_answer && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <AnimatePresence>
                      {hasAnswered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 border-t border-border mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              {isCorrect ? (
                                <>
                                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  <p className="font-medium text-green-600 dark:text-green-400">Correct!</p>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                  <p className="font-medium text-red-600 dark:text-red-400">Incorrect</p>
                                </>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {question.explanation}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-2">
                    {!hasAnswered ? (
                      <Button
                        variant="default"
                        size="default"
                        onClick={handleSubmit}
                        className="w-full text-xs sm:text-sm h-10 sm:h-9 touch-manipulation"
                        disabled={!localAnswer || isLoading}
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="default"
                        onClick={handleClose}
                        className="w-full text-xs sm:text-sm h-10 sm:h-9 touch-manipulation"
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">No question available at the moment.</p>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => window.location.reload()}
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

export default QuizOverlay;