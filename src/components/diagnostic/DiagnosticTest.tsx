import React, { useEffect, useState } from 'react';
import { Brain, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { generateQuiz } from '../../services/aiApi';

interface DiagnosticTestProps {
  onComplete: (level: string) => void;
  userName: string;
  onCancel?: () => void;
}

interface DiagnosticQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  subject?: string;
}

export function DiagnosticTest({ onComplete, userName, onCancel }: DiagnosticTestProps) {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const quiz = await generateQuiz('diagnostic');
      if (!active) return;
      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        setQuestions(quiz.questions);
      } else {
        setError('تعذر تحميل أسئلة التقييم التشخيصي. حاول مرة أخرى لاحقاً.');
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-xl text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-purple-700">جاري تحميل أسئلة التقييم التشخيصي...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-xl text-center">
          <p className="text-red-600 mb-4">{error || 'لا توجد أسئلة متاحة حالياً.'}</p>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              الرجوع
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  const calculateLevel = () => {
    const correctAnswers = answers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;
    const percentage = (correctAnswers / questions.length) * 100;

    if (percentage >= 80) return 'advanced';
    if (percentage >= 60) return 'intermediate';
    return 'beginner';
  };

  const handleComplete = () => {
    const level = calculateLevel();
    onComplete(level);
  };

  if (showResults) {
    const correctAnswers = answers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;
    const percentage = (correctAnswers / questions.length) * 100;
    const level = calculateLevel();

    const levelArabic =
      level === 'advanced' ? 'متقدم' : level === 'intermediate' ? 'متوسط' : 'مبتدئ';

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-3xl mb-4">اكتمل التقييم!</h2>
            <p className="text-gray-600 mb-8">أحسنت في إكمال الاختبار التشخيصي، {userName}!</p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 mb-1">النتيجة</p>
                  <p className="text-3xl">
                    {correctAnswers}/{questions.length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">النسبة المئوية</p>
                  <p className="text-3xl">{percentage.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">المستوى</p>
                  <p className="text-3xl">{levelArabic}</p>
                </div>
              </div>
            </div>

            <div className="text-right mb-8">
              <h3 className="text-xl mb-4">ما التالي؟</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>لقد أنشأنا خطة دراسية مخصصة بناءً على نتائجك</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>الوصول إلى وحدات تفاعلية مصممة حسب مستواك</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>تتبع تقدمك مع تحليلات تفصيلية</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              متابعة إلى لوحة التحكم
              <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-purple-700">التقييم التشخيصي</span>
          </div>
          <h1 className="text-3xl mb-2">دعنا نحدد مستواك</h1>
          <p className="text-gray-600">أجب على بعض الأسئلة للحصول على خطتك الدراسية المخصصة</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              السؤال {currentQuestion + 1} من {questions.length}
            </span>
            <span className="text-gray-600">{progress.toFixed(0)}% مكتمل</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-8 shadow-xl">
          <div className="mb-6">
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mb-4">
              {question.subject || 'سؤال تشخيصي'}
            </span>
            <h2 className="text-2xl">{question.question}</h2>
          </div>

          <div className="space-y-3 mb-8">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-right flex items-center gap-3 ${
                  selectedAnswer === index
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                {selectedAnswer === index ? (
                  <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                )}
                <span>{option}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentQuestion < questions.length - 1 ? 'السؤال التالي' : 'عرض النتائج'}
            <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

