import { useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';

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

const quizQuestions: Question[] = [
  {
    id: '1',
    question: 'ما هو الفرق المشترك في المتسلسلة الحسابية: 3، 7، 11، 15؟',
    options: ['2', '3', '4', '5'],
    correctAnswer: 2,
    explanation: 'الفرق المشترك يُحسب بطرح حدين متتاليين: 7 - 3 = 4'
  },
  {
    id: '2',
    question: 'إذا كانت احتمالية المطر 0.3، ما احتمالية عدم هطول المطر؟',
    options: ['0.3', '0.5', '0.7', '1.0'],
    correctAnswer: 2,
    explanation: 'احتمالية عدم حدوث الحدث = 1 - احتمالية الحدث = 1 - 0.3 = 0.7'
  },
  {
    id: '3',
    question: 'سيارة قطعت 120 كم في ساعتين. ما هو متوسط سرعتها؟',
    options: ['40 كم/س', '50 كم/س', '60 كم/س', '80 كم/س'],
    correctAnswer: 2,
    explanation: 'السرعة = المسافة ÷ الزمن = 120 كم ÷ 2 ساعة = 60 كم/س'
  },
  {
    id: '4',
    question: 'أي كلمة هي الأقرب في المعنى لـ "abundant"؟',
    options: ['Scarce', 'Plentiful', 'Rare', 'Limited'],
    correctAnswer: 1,
    explanation: 'كلمة Abundant و Plentiful تعنيان الوفرة أو الكثرة'
  }
];

export function LessonQuiz({ lessonTitle, onComplete, onBack }: LessonQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

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
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleFinishQuiz = () => {
    const score = Math.round((correctAnswers / quizQuestions.length) * 100);
    onComplete(score);
  };

  if (quizComplete) {
    const score = Math.round((correctAnswers / quizQuestions.length) * 100);
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
            لقد أجبت بشكل صحيح على {correctAnswers} من {quizQuestions.length} أسئلة
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
              سؤال {currentQuestion + 1} من {quizQuestions.length}
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
                <p className="text-sm text-gray-700">{question.explanation}</p>
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
              {currentQuestion < quizQuestions.length - 1 ? 'السؤال التالي' : 'إنهاء الاختبار'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
