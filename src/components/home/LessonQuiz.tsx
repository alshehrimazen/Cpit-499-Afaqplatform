import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { generateQuiz, isAiApiConfigured, type QuizQuestion } from '../../services/aiApi';

interface LessonQuizProps {
  lessonTitle: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export function LessonQuiz({ lessonTitle, onComplete, onBack }: LessonQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setCorrectAnswers(0);
      setQuizComplete(false);

      if (!isAiApiConfigured()) {
        setError('خدمة الذكاء الاصطناعي غير مفعّلة حالياً. الرجاء ضبط إعدادات السيرفر ثم المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      // Reuse quiz generator: moduleId fixed, lessonTitle as topic
      const quiz = await generateQuiz('lesson', lessonTitle);
      if (!active) return;

      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        const mapped: Question[] = quiz.questions.map((q: QuizQuestion, idx: number) => ({
          id: String(idx + 1),
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: '',
        }));
        setQuestions(mapped);
      } else {
        setError('تعذر تحميل أسئلة هذا الدرس حالياً. حاول مرة أخرى لاحقاً.');
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [lessonTitle, reloadKey]);

  const total = questions.length;
  const question = questions[currentQuestion];
  const progress = total > 0 ? ((currentQuestion + 1) / total) * 100 : 0;

  const emptyExplanation = useMemo(() => 'لا يوجد شرح متاح حالياً.', []);

  if (loading) {
    return (
      <Card className="p-8 max-w-3xl mx-auto text-center" dir="rtl">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
          <Trophy className="w-5 h-5 text-purple-600" />
          <span className="text-purple-700">جاري إعداد اختبار الدرس...</span>
        </div>
      </Card>
    );
  }

  if (error || total === 0 || !question) {
    return (
      <Card className="p-8 max-w-3xl mx-auto text-center" dir="rtl">
        <p className="text-red-600 mb-4">{error || 'لا توجد أسئلة متاحة حالياً.'}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack}>
            الرجوع
          </Button>
          <Button onClick={() => setReloadKey((v) => v + 1)}>إعادة المحاولة</Button>
        </div>
      </Card>
    );
  }

  const handleSelectAnswer = (index: number) => {
    if (!showFeedback) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      setShowFeedback(true);
      if (selectedAnswer === question.correctAnswer) {
        setCorrectAnswers(correctAnswers + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < total - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleFinishQuiz = () => {
    const score = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;
    onComplete(score);
  };

  if (quizComplete) {
    const score = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;
    const passed = score >= 70;

    return (
      <Card className="p-8 max-w-3xl mx-auto" dir="rtl">
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            passed ? 'bg-gradient-to-br from-green-500 to-blue-500' : 'bg-gradient-to-br from-orange-500 to-red-500'
          }`}>
            {passed ? (
              <Trophy className="w-10 h-10 text-white" />
            ) : (
              <XCircle className="w-10 h-10 text-white" />
            )}
          </div>
          <h2 className="text-3xl mb-2">
            {passed ? 'عمل ممتاز!' : 'استمر في التدريب!'}
          </h2>
          <p className="text-gray-600 mb-6">
            لقد أجبت بشكل صحيح على {correctAnswers} من {total} أسئلة
          </p>
          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <p className="text-5xl mb-2">{score}%</p>
            <Progress value={score} className="h-3" />
          </div>
          <div className="space-y-3">
            {passed ? (
              <p className="text-green-600">
                أحسنت! لقد أتقنت هذا الدرس. استمر في العمل الممتاز!
              </p>
            ) : (
              <p className="text-orange-600">
                راجع مواد الدرس وحاول مرة أخرى لتحسين درجتك.
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={handleFinishQuiz} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                متابعة التعلم
              </Button>
              <Button variant="outline" onClick={onBack}>
                مراجعة الدرس
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للدروس
        </Button>
      </div>

      <Card className="p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl">اختبار: {lessonTitle}</h2>
            <span className="text-gray-600">
              سؤال {currentQuestion + 1} من {total}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mb-8">
          <h3 className="text-xl mb-6">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correctAnswer;
              
              let bgColor = 'bg-white hover:bg-gray-50';
              let borderColor = 'border-gray-200';
              
              if (showFeedback) {
                if (isSelected && isCorrect) {
                  bgColor = 'bg-green-50';
                  borderColor = 'border-green-500';
                } else if (isSelected && !isCorrect) {
                  bgColor = 'bg-red-50';
                  borderColor = 'border-red-500';
                } else if (isCorrectAnswer) {
                  bgColor = 'bg-green-50';
                  borderColor = 'border-green-500';
                }
              } else if (isSelected) {
                bgColor = 'bg-blue-50';
                borderColor = 'border-blue-500';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showFeedback}
                  className={`w-full text-right p-4 rounded-lg border-2 transition-all ${bgColor} ${borderColor} ${
                    !showFeedback ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showFeedback && (isSelected || isCorrectAnswer) && (
                      <>
                        {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showFeedback && (
          <div className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'}`}>
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`mb-2 ${isCorrect ? 'text-green-900' : 'text-orange-900'}`}>
                  {isCorrect ? 'صحيح!' : 'ليس تماماً'}
                </p>
                <p className="text-sm text-gray-700">{question.explanation || emptyExplanation}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-gray-600">
            الدرجة: {correctAnswers}/{currentQuestion + (showFeedback ? 1 : 0)}
          </div>
          {!showFeedback ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              إرسال الإجابة
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {currentQuestion < total - 1 ? 'السؤال التالي' : 'إنهاء الاختبار'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
