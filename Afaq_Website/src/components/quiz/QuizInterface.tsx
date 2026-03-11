import React, { useEffect, useState } from 'react';
import { Menu, CheckCircle, XCircle, ArrowLeft, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { generateQuiz, isAiApiConfigured, type GeneratedQuiz } from '../../services/aiApi';

interface QuizInterfaceProps {
  moduleId: string;
  onComplete: (moduleId: string, score: number) => void;
  onToggleSidebar: () => void;
}

export function QuizInterface({ moduleId, onComplete, onToggleSidebar }: QuizInterfaceProps) {
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setQuiz(null);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setAnswers([]);
      setShowFeedback(false);
      setShowResults(false);

      if (!isAiApiConfigured()) {
        setError('خدمة الذكاء الاصطناعي غير مفعّلة حالياً. الرجاء ضبط إعدادات السيرفر ثم المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      const q = await generateQuiz(moduleId);
      if (!active) return;

      if (q && Array.isArray(q.questions) && q.questions.length > 0) {
        setQuiz(q);
      } else {
        setError('تعذر تحميل أسئلة الاختبار حالياً. حاول مرة أخرى لاحقاً.');
      }

      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [moduleId, reloadKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-xl text-center" dir="rtl">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
            <Trophy className="w-5 h-5 text-purple-600" />
            <span className="text-purple-700">جاري إعداد الاختبار...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-xl text-center" dir="rtl">
          <p className="text-red-600 mb-4">{error || 'لا توجد أسئلة متاحة حالياً.'}</p>
          <Button onClick={() => setReloadKey((v) => v + 1)}>إعادة المحاولة</Button>
        </Card>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    const correctAnswers = answers.filter((answer, index) => 
      answer === quiz.questions[index].correctAnswer
    ).length;
    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score >= 60;

    return (
      <div className="min-h-screen">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <button onClick={onToggleSidebar} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl lg:text-2xl">نتائج الاختبار</h1>
            <div className="w-6" />
          </div>
        </header>

        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[calc(100vh-73px)]">
          <Card className="max-w-2xl w-full p-8 shadow-xl">
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                passed 
                  ? 'bg-gradient-to-br from-green-500 to-blue-500' 
                  : 'bg-gradient-to-br from-orange-500 to-red-500'
              }`}>
                {passed ? (
                  <Trophy className="w-12 h-12 text-white" />
                ) : (
                  <XCircle className="w-12 h-12 text-white" />
                )}
              </div>

              <h2 className="text-3xl mb-4">
                {passed ? 'عمل ممتاز!' : 'استمر في التدريب!'}
              </h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-8">
                <p className="text-6xl mb-2">{score}%</p>
                <p className="text-gray-600">
                  {answers.filter((answer, index) => answer === quiz.questions[index].correctAnswer).length} من {quiz.questions.length} صحيح
                </p>
              </div>

              <div className="text-right mb-8">
                <h3 className="text-xl mb-4">ملخص الأداء</h3>
                <div className="space-y-3">
                  {quiz.questions.map((q, index: number) => {
                    const isCorrect = answers[index] === q.correctAnswer;
                    return (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">السؤال {index + 1}</p>
                          {!isCorrect && (
                            <p className="text-sm text-gray-500">
                              الإجابة الصحيحة: {q.options[q.correctAnswer]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={() => onComplete(moduleId, score)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                متابعة إلى لوحة التحكم
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl lg:text-2xl">{quiz.title}</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">سؤال {currentQuestion + 1} من {quiz.questions.length}</span>
            <span className="text-gray-600">{progress.toFixed(0)}% مكتمل</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="p-8 lg:p-12 mb-8 shadow-xl">
          <h2 className="text-2xl mb-8">{question.question}</h2>

          <div className="space-y-4 mb-8">
            {question.options.map((option: string, index: number) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-right flex items-center gap-3 ${
                    showCorrect
                      ? 'border-green-500 bg-green-50'
                      : showIncorrect
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex-shrink-0">
                    {showCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : showIncorrect ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-full h-full rounded-full bg-white scale-50" />}
                      </div>
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className={`p-4 rounded-lg mb-6 ${
              selectedAnswer === question.correctAnswer
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={selectedAnswer === question.correctAnswer ? 'text-green-800' : 'text-red-800'}>
                {selectedAnswer === question.correctAnswer
                  ? '✓ صحيح! أحسنت!'
                  : `✗ غير صحيح. الإجابة الصحيحة هي: ${question.options[question.correctAnswer]}`
                }
              </p>
            </div>
          )}

          <div className="flex justify-start">
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
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {currentQuestion < quiz.questions.length - 1 ? 'السؤال التالي' : 'عرض النتائج'}
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
