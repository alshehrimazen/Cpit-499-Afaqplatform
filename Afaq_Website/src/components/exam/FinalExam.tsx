import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Trophy, Award, Star, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import type { StudyPlan } from '../../App';
import { generateFinalExam, type FinalExamQuestion } from '../../services/aiApi';

interface FinalExamProps {
  plan: StudyPlan;
  onComplete: () => void;
  onToggleSidebar: () => void;
}

export function FinalExam({ plan, onComplete, onToggleSidebar }: FinalExamProps) {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<FinalExamQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const subjectsLabel = useMemo(() => {
    const subjects = Array.from(new Set(questions.map((q) => q.subject).filter(Boolean)));
    if (subjects.length === 0) return 'سيتم تحديدها تلقائياً';
    return subjects.join('، ');
  }, [questions]);

  useEffect(() => {
    if (!started) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setAnswers([]);
      setFinished(false);

      const q = await generateFinalExam(plan.id, plan.level);
      if (!active) return;

      if (q && Array.isArray(q) && q.length > 0) {
        setQuestions(q);
      } else {
        setError('تعذر تحميل أسئلة الاختبار النهائي من السيرفر. تأكد من تشغيل السيرفر وأن endpoint /ai/final-exam يعمل.');
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [started, reloadKey, plan.id, plan.level]);

  const handleStart = () => {
    setStarted(true);
  };

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
      setFinished(true);
    }
  };

  const calculateResults = () => {
    const correctAnswers = answers.filter((answer, index) => 
      answer === questions[index]?.correctAnswer
    ).length;
    const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    const passed = score >= 70;
    
    return { correctAnswers, score, passed };
  };

  if (finished) {
    const { correctAnswers, score, passed } = calculateResults();

    return (
      <div className="min-h-screen" dir="rtl">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <button onClick={onToggleSidebar} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl lg:text-2xl">نتائج الاختبار النهائي</h1>
            <div className="w-6" />
          </div>
        </header>

        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[calc(100vh-73px)]">
          <Card className="max-w-3xl w-full p-8 lg:p-12 shadow-xl">
            <div className="text-center">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${
                passed 
                  ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}>
                {passed ? (
                  <Trophy className="w-16 h-16 text-white" />
                ) : (
                  <Award className="w-16 h-16 text-white" />
                )}
              </div>

              <h2 className="text-4xl mb-4">
                {passed ? '🎉 مبروك!' : 'مجهود رائع!'}
              </h2>
              
              <p className="text-xl text-gray-600 mb-8">
                {passed 
                  ? 'لقد أكملت بنجاح الاختبار النهائي لمنصة آفاق!'
                  : 'استمر في التدريب وستحقق أهدافك!'
                }
              </p>

              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg p-8 mb-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-gray-600 mb-2">الدرجة النهائية</p>
                    <p className="text-5xl mb-1">{score}%</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(score / 20)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">الإجابات الصحيحة</p>
                    <p className="text-5xl">{correctAnswers}/{questions.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">الحالة</p>
                    <p className={`text-3xl ${passed ? 'text-green-600' : 'text-orange-600'}`}>
                      {passed ? 'ناجح' : 'مراجعة'}
                    </p>
                  </div>
                </div>
              </div>

              {passed && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 mb-8">
                  <h3 className="text-2xl mb-4">إنجازاتك 🏆</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-right">
                    <div className="flex items-center gap-3">
                      <span>أكملت جميع الوحدات الدراسية</span>
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span>اجتزت الاختبار النهائي</span>
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span>أداء ممتاز</span>
                      <Trophy className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span>الشهادة جاهزة</span>
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={onComplete}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                عرض التحليلات التفصيلية
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen" dir="rtl">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <button onClick={onToggleSidebar} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl lg:text-2xl">الاختبار النهائي</h1>
            <div className="w-6" />
          </div>
        </header>

        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[calc(100vh-73px)]">
          <Card className="max-w-2xl w-full p-8 lg:p-12 shadow-xl">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-3xl mb-4">هل أنت مستعد للتحدي النهائي؟</h2>
              <p className="text-xl text-gray-600 mb-8">
                اختبر معلوماتك في جميع المواد التي درستها
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-8 text-right">
                <h3 className="text-xl mb-4">معلومات الاختبار</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span><strong>الأسئلة:</strong> سيتم توليدها عند البدء</span>
                    <span className="text-blue-600">•</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span><strong>المواد:</strong> {subjectsLabel}</span>
                    <span className="text-blue-600">•</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span><strong>درجة النجاح:</strong> 70% أو أعلى</span>
                    <span className="text-blue-600">•</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span><strong>الوقت:</strong> خذ وقتك، لا يوجد حد زمني</span>
                    <span className="text-blue-600">•</span>
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 mb-8">
                <h3 className="text-xl mb-3">تقدمك</h3>
                <p className="text-gray-700">
                  لقد أكملت <strong>{plan.completedModules.length}</strong> وحدة بمتوسط درجات 
                  <strong> {Object.values(plan.quizScores).length > 0 
                    ? Math.round(Object.values(plan.quizScores).reduce((a, b) => a + b, 0) / Object.values(plan.quizScores).length)
                    : 0}%</strong>. 
                  أنت مستعد جيداً!
                </p>
              </div>

              <Button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                ابدأ الاختبار النهائي
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-2xl w-full p-8 shadow-xl text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
            <Trophy className="w-5 h-5 text-purple-600" />
            <span className="text-purple-700">جاري إعداد الاختبار النهائي...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-2xl w-full p-8 shadow-xl text-center">
          <p className="text-red-600 mb-4">{error || 'لا توجد أسئلة متاحة حالياً.'}</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => setStarted(false)}>
              رجوع
            </Button>
            <Button onClick={() => setReloadKey((v) => v + 1)}>إعادة المحاولة</Button>
          </div>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl lg:text-2xl">الاختبار النهائي</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">سؤال {currentQuestion + 1} من {questions.length}</span>
            <span className="text-gray-600">{progress.toFixed(0)}% مكتمل</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 lg:p-12 shadow-xl">
          <div className="mb-6">
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mb-4">
              {question.subject}
            </span>
            <h2 className="text-2xl">{question.question}</h2>
          </div>

          <div className="space-y-3 mb-8">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-right ${
                  selectedAnswer === index
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <span>{option}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {currentQuestion < questions.length - 1 ? 'السؤال التالي' : 'إنهاء الاختبار'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
