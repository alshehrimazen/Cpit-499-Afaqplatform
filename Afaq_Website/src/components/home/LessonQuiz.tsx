import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import {
  getLessonQuiz,
  submitLessonQuiz,
  isAiApiConfigured,
  type LessonQuizApiQuestion,
  type LessonQuizSubmitResponse,
} from '../../services/aiApi';

interface LessonQuizProps {
  lessonTitle: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Question {
  question_id: number;
  subject: string;
  question_text: string;
  display_question: string;
  options: string[];
  correct_letter: string;
  reference_explanation: string;
}

const ARABIC_CHOICES = ['أ', 'ب', 'ج', 'د'];

export function LessonQuiz({ lessonTitle, onComplete, onBack }: LessonQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [result, setResult] = useState<LessonQuizSubmitResponse | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setAnswers([]);
      setQuizComplete(false);
      setResult(null);

      if (!isAiApiConfigured()) {
        setError('خدمة الذكاء الاصطناعي غير مفعّلة حالياً. الرجاء ضبط إعدادات السيرفر ثم المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      const quiz = await getLessonQuiz(lessonTitle, 5);
      if (!active) return;

      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        const mapped: Question[] = quiz.questions.map((q: LessonQuizApiQuestion) => ({
          question_id: q.question_id,
          subject: q.subject,
          question_text: q.question_text,
          display_question: q.display_question,
          options: q.options,
          correct_letter: q.correct_letter,
          reference_explanation: q.reference_explanation,
        }));
        setQuestions(mapped);
      } else {
        setError('تعذر تحميل أسئلة هذا الدرس حالياً. تأكد أن اسم الدرس يطابق الموضوع في Questions.jsonl حرفيًا.');
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

  if (loading || submitting) {
    return (
      <Card className="p-8 max-w-3xl mx-auto text-center" dir="rtl">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
          <Trophy className="w-5 h-5 text-purple-600" />
          <span className="text-purple-700">
            {submitting ? 'جاري تصحيح الاختبار...' : 'جاري إعداد اختبار الدرس...'}
          </span>
        </div>
      </Card>
    );
  }

  if (error || total === 0 || (!question && !quizComplete)) {
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
    setSelectedAnswer(index);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < total - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      return;
    }

    setSubmitting(true);

    const payload = newAnswers.map((answerIndex, i) => ({
      question_id: questions[i].question_id,
      subject: questions[i].subject || 'عام',
      question_text: questions[i].question_text,
      user_answer: ARABIC_CHOICES[answerIndex],
      correct_letter: questions[i].correct_letter,
      reference_explanation: questions[i].reference_explanation,
    }));

    const submitResult = await submitLessonQuiz(lessonTitle, payload);

    if (!submitResult || submitResult.status !== 'success') {
      setError('تعذر تصحيح اختبار الدرس حالياً.');
      setSubmitting(false);
      return;
    }

    setResult(submitResult);
    setQuizComplete(true);
    setSubmitting(false);
  };

  const handleFinishQuiz = () => {
    const score = result?.total_percentage ?? 0;
    onComplete(score);
  };

  if (quizComplete && result) {
    const score = result.total_percentage;
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
            لقد أجبت بشكل صحيح على {result.total_score} من {result.total_questions} أسئلة
          </p>

          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <p className="text-5xl mb-2">{score}%</p>
            <Progress value={score} className="h-3" />
          </div>

          <div className="text-right mb-8">
            <h3 className="text-xl mb-4">تغذية راجعة لكل سؤال</h3>
            <div className="space-y-4">
              {result.detailed_results.map((item, index) => {
                const sourceQuestion = questions.find((q) => q.question_id === item.question_id);
                const correctIndex = ARABIC_CHOICES.indexOf(item.correct_letter);

                return (
                  <div key={index} className={`rounded-lg border p-4 ${item.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      {item.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      )}

                      <div className="flex-1">
                        <p className="font-semibold mb-2">السؤال {index + 1}: {sourceQuestion?.display_question}</p>
                        <p className="text-sm text-gray-700 mb-1">إجابتك: {item.user_answer}</p>
                        {correctIndex >= 0 && sourceQuestion?.options?.[correctIndex] && (
                          <p className="text-sm text-gray-700 mb-2">
                            الإجابة الصحيحة: {item.correct_letter} - {sourceQuestion.options[correctIndex]}
                          </p>
                        )}
                        <p className="text-sm text-gray-800 leading-7">
                          {item.ai_explanation || emptyExplanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {passed ? (
              <p className="text-green-600">
                أحسنت! لقد أتقنت هذا الدرس.
              </p>
            ) : (
              <p className="text-orange-600">
                راجع الدرس ثم أعد المحاولة.
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
          <h3 className="text-xl mb-6">{question.display_question}</h3>
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={`w-full text-right p-4 rounded-lg border-2 transition-all ${
                    isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <div className="text-gray-600">
            الإجابات المختارة: {answers.length + (selectedAnswer !== null ? 1 : 0)}/{total}
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentQuestion < total - 1 ? 'السؤال التالي' : 'تسليم الاختبار'}
          </Button>
        </div>
      </Card>
    </div>
  );
}