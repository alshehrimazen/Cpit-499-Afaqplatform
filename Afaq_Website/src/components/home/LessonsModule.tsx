import { useState } from 'react';
import { BookOpen, Clock, Play, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { LessonQuiz } from './LessonQuiz';

interface Lesson {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  subject: string;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
}

export function LessonsModule() {
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: 'seq-1',
      title: 'أساسيات المتسلسلات',
      description: 'تعلم المفاهيم الأساسية للمتسلسلات الحسابية والهندسية',
      estimatedTime: '25 دقيقة',
      subject: 'الرياضيات',
      difficulty: 'مبتدئ',
      status: 'completed',
      progress: 100
    },
    {
      id: 'prob-1',
      title: 'مقدمة في الاحتمالات',
      description: 'فهم مفاهيم الاحتمالات والحسابات الأساسية',
      estimatedTime: '30 دقيقة',
      subject: 'الرياضيات',
      difficulty: 'متوسط',
      status: 'in-progress',
      progress: 65
    },
    {
      id: 'speed-1',
      title: 'مسائل السرعة',
      description: 'إتقان حسابات السرعة والمسافة والزمن',
      estimatedTime: '20 دقيقة',
      subject: 'الرياضيات',
      difficulty: 'مبتدئ',
      status: 'not-started',
      progress: 0
    },
    {
      id: 'verbal-1',
      title: 'استراتيجيات الفهم اللفظي',
      description: 'استراتيجيات أساسية لأسئلة التفكير اللفظي',
      estimatedTime: '35 دقيقة',
      subject: 'اللغة',
      difficulty: 'متوسط',
      status: 'not-started',
      progress: 0
    },
    {
      id: 'algebra-1',
      title: 'الجبر المتقدم',
      description: 'حل المعادلات الجبرية المعقدة والمتباينات',
      estimatedTime: '40 دقيقة',
      subject: 'الرياضيات',
      difficulty: 'متقدم',
      status: 'not-started',
      progress: 0
    },
    {
      id: 'reading-1',
      title: 'الفهم القرائي',
      description: 'تحسين سرعة القراءة والفهم',
      estimatedTime: '30 دقيقة',
      subject: 'اللغة',
      difficulty: 'متوسط',
      status: 'not-started',
      progress: 0
    }
  ]);

  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleStartLesson = (lessonId: string) => {
    setActiveLesson(lessonId);
    setLessons(lessons.map(l => 
      l.id === lessonId ? { ...l, status: 'in-progress' as const, progress: Math.max(l.progress, 30) } : l
    ));
  };

  const handleContinueLesson = (lessonId: string) => {
    setActiveLesson(lessonId);
  };

  const handleCompleteLesson = (lessonId: string) => {
    setLessons(lessons.map(l => 
      l.id === lessonId ? { ...l, progress: 100 } : l
    ));
    setActiveLesson(null);
    setShowQuiz(true);
  };

  const handleQuizComplete = (score: number) => {
    if (activeLesson) {
      setLessons(lessons.map(l => 
        l.id === activeLesson ? { ...l, status: 'completed' as const, progress: 100 } : l
      ));
    }
    setShowQuiz(false);
    setActiveLesson(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'مبتدئ': return 'bg-green-100 text-green-700';
      case 'متوسط': return 'bg-blue-100 text-blue-700';
      case 'متقدم': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (showQuiz && activeLesson) {
    const lesson = lessons.find(l => l.id === activeLesson);
    return lesson ? (
      <LessonQuiz 
        lessonTitle={lesson.title}
        onComplete={handleQuizComplete}
        onBack={() => setShowQuiz(false)}
      />
    ) : null;
  }

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">الدروس</h2>
        <p className="text-gray-600">
          أكمل الدروس لإتقان المفاهيم الأساسية لاختبار التحصيلي
        </p>
      </div>

      <div className="grid gap-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    lesson.status === 'completed'
                      ? 'bg-gradient-to-br from-green-500 to-blue-500'
                      : lesson.status === 'in-progress'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {lesson.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl mb-1">{lesson.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{lesson.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(lesson.status)}`}>
                        {lesson.status === 'not-started' ? 'لم تبدأ' : 
                         lesson.status === 'in-progress' ? 'قيد التقدم' : 'مكتمل'}
                      </span>
                      <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                        {lesson.subject}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
                        {lesson.difficulty}
                      </span>
                      <span className="text-sm text-gray-600 flex items-center gap-1 px-3 py-1">
                        <Clock className="w-4 h-4" />
                        {lesson.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
                {lesson.progress > 0 && lesson.progress < 100 && (
                  <div className="mr-15">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">التقدم</span>
                      <span className="text-sm">{lesson.progress}%</span>
                    </div>
                    <Progress value={lesson.progress} className="h-2" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {lesson.status === 'not-started' && (
                  <Button
                    onClick={() => handleStartLesson(lesson.id)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    ابدأ الدرس
                  </Button>
                )}
                {lesson.status === 'in-progress' && (
                  <>
                    <Button
                      onClick={() => handleContinueLesson(lesson.id)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      متابعة
                    </Button>
                    <Button
                      onClick={() => handleCompleteLesson(lesson.id)}
                      variant="outline"
                    >
                      إكمال
                    </Button>
                  </>
                )}
                {lesson.status === 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStartLesson(lesson.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    مراجعة
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
