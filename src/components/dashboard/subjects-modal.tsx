import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, User, Clock, FileText, Target, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Subject {
  id: string;
  name: string;
  teacher?: string;
  color?: string;
  course_type?: 'LK' | 'GK';
  current_grade?: number;
  target_grade?: number;
  progress?: number;
  openTasks?: number;
  openHomework?: number;
  totalTopics?: number;
  completedTopics?: number;
  totalSubtopics?: number;
  completedSubtopics?: number;
}

interface SubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  title: string;
}

export function SubjectsModal({ isOpen, onClose, subjects, title }: SubjectsModalProps) {
  const navigate = useNavigate();

  const handleSubjectClick = (subjectName: string) => {
    navigate(`/subjects?subject=${encodeURIComponent(subjectName)}`);
    onClose();
  };

  const getCourseTypeColor = (courseType?: string) => {
    switch (courseType) {
      case 'LK':
        return 'bg-blue-100 text-blue-800';
      case 'GK':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (current?: number, target?: number) => {
    if (!current || !target) return 'text-gray-600';
    if (current <= target) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {title}
            <Badge variant="secondary">{subjects.length}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No subjects found</p>
            </div>
          ) : (
            subjects.map((subject) => (
              <Card 
                key={subject.id} 
                className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => handleSubjectClick(subject.name)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: subject.color || '#3b82f6' }}
                        ></div>
                        <div>
                          <h4 className="font-medium text-foreground">{subject.name}</h4>
                          {subject.teacher && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{subject.teacher}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {subject.course_type && (
                          <Badge className={`text-xs ${getCourseTypeColor(subject.course_type)}`}>
                            {subject.course_type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    {subject.progress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{subject.progress}%</span>
                        </div>
                        <Progress value={subject.progress} className="h-2" />
                      </div>
                    )}

                    {/* Topics/Subtopics Statistics and Grades */}
                    {((subject.totalTopics !== undefined || subject.totalSubtopics !== undefined) || (subject.current_grade !== undefined || subject.target_grade !== undefined)) && (
                      <div className="flex items-center justify-between">
                        {/* Left side: Topics and Subtopics */}
                        <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                          {subject.totalTopics !== undefined && (
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="font-medium">
                                  {subject.completedTopics || 0}/{subject.totalTopics} Topics
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {subject.totalTopics > 0 ? Math.round(((subject.completedTopics || 0) / subject.totalTopics) * 100) : 0}% complete
                                </div>
                              </div>
                            </div>
                          )}
                          {subject.totalSubtopics !== undefined && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="font-medium">
                                  {subject.completedSubtopics || 0}/{subject.totalSubtopics} Subtopics
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {subject.totalSubtopics > 0 ? Math.round(((subject.completedSubtopics || 0) / subject.totalSubtopics) * 100) : 0}% complete
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Right side: Grades */}
                        {(subject.current_grade !== undefined || subject.target_grade !== undefined) && (
                          <div className="flex items-center gap-4 text-sm ml-4">
                            {subject.current_grade !== undefined && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Current:</span>
                                <span className={`font-medium ${getGradeColor(subject.current_grade, subject.target_grade)}`}>
                                  {subject.current_grade.toFixed(1)}
                                </span>
                              </div>
                            )}
                            {subject.target_grade !== undefined && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Target:</span>
                                <span className="font-medium">{subject.target_grade.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tasks and Homework */}
                    <div className="flex items-center gap-4">
                      {subject.openTasks !== undefined && subject.openTasks > 0 && (
                        <div className="flex items-center gap-1 text-sm text-warning">
                          <Clock className="h-3 w-3" />
                          <span>{subject.openTasks} open task{subject.openTasks > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {subject.openHomework !== undefined && subject.openHomework > 0 && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <FileText className="h-3 w-3" />
                          <span>{subject.openHomework} open homework</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}