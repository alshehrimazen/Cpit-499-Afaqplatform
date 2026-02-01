import { useState } from 'react';
import { Menu, Trophy, Award, Star, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import type { StudyPlan } from '../../App';

interface FinalExamProps {
  plan: StudyPlan;
  onComplete: () => void;
  onToggleSidebar: () => void;
}

const finalExamQuestions = [
  {
    subject: 'الرياضيات',
    question: 'حل المعادلة: 3x² - 12x + 9 = 0',
    options: ['x = 1 أو x = 3', 'x = 2 أو x = 4', 'x = 1 أو x = 2', 'x = 3 أو x = 4'],
    correctAnswer: 0
  },
  {
    subject: 'الفيزياء',
    question: 'جسم كتلته 10 كجم دُفع بقوة 30 نيوتن. ما هو تسارعه؟',
    options: ['2 م/ث²', '3 م/ث²', '4 م/ث²', '5 م/ث²'],
    correctAnswer: 1
  },
  {
    subject: 'الكيمياء',
    question: 'ما نوع الرابطة التي تتكون عند مشاركة الإلكترونات؟',
    options: ['أيونية', 'تساهمية', 'فلزية', 'هيدروجينية'],
    correctAnswer: 1
  },
  {
    subject: 'اللغة الإنجليزية',
    question: 'أي جملة صحيحة نحوياً؟',
    options: [
      'She don\'t like pizza',
      'She doesn\'t likes pizza',
      'She doesn\'t like pizza',
      'She not like pizza'
    ],
    correctAnswer: 2
  },
  {
    subject: 'الأحياء',
    question: 'ما هو مركز الطاقة في الخلية؟',
    options: ['النواة', 'الميتوكوندريا', 'الريبوسوم', 'جهاز جولجي'],
    correctAnswer: 1
  },
  {
    subject: 'الرياضيات',
    question: 'ما هي القيمة التقريبية لـ π (باي)؟',
    options: ['3.14', '2.71', '1.41', '1.73'],
    correctAnswer: 0
  },
  {
    subject: 'الفيزياء',
    question: 'ما هي وحدة الطاقة؟',
    options: ['نيوتن', 'جول', 'واط', 'باسكال'],
    correctAnswer: 1
  },
  {
    subject: 'الكيمياء',
    question: 'ما هو الاسم الشائع لـ H₂O؟',
    options: ['الأكسجين', 'الهيدروجين', 'الماء', 'ثاني أكسيد الكربون'],
    correctAnswer: 2
  },
  {
    subject: 'اللغة الإنجليزية',
    question: 'ما هو جمع كلمة "child"؟',
    options: ['Childs', 'Children', 'Childes', 'Childrens'],
    correctAnswer: 1
  },
  {
    subject: 'الأحياء',
    question: 'كم عدد الكروموسومات عند الإنسان؟',
    options: ['23', '46', '48', '92'],
    correctAnswer: 1
  }
];

export function FinalExam({ plan, onComplete, onToggleSidebar }: FinalExamProps) {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const progress = ((currentQuestion + 1) / finalExamQuestions.length) * 100;

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

    if (currentQuestion < finalExamQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setFinished(true);
    }
  };

  const calculateResults = () => {
    const correctAnswers = answers.filter((answer, index) => 
      answer === finalExamQuestions[index].correctAnswer
    ).length;
    const score = Math.round((correctAnswers / finalExamQuestions.length) * 100);
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
                    <p className="text-5xl">{correctAnswers}/{finalExamQuestions.length}</p>
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
                    <span><strong>الأسئلة:</strong> {finalExamQuestions.length} سؤال شامل</span>
                    <span className="text-blue-600">•</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span><strong>المواد:</strong> الرياضيات، الفيزياء، الكيمياء، الإنجليزية، الأحياء</span>
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

  const question = finalExamQuestions[currentQuestion];

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
            <span className="text-gray-600">سؤال {currentQuestion + 1} من {finalExamQuestions.length}</span>
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
            {currentQuestion < finalExamQuestions.length - 1 ? 'السؤال التالي' : 'إنهاء الاختبار'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
