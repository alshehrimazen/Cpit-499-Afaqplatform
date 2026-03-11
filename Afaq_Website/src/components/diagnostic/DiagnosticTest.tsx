'use client';

import React, { useEffect, useState } from 'react';
import { Brain, CheckCircle, Circle, ArrowRight, BarChart3, GraduationCap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface DiagnosticTestProps {
  onComplete: (level: string) => void;
  userName: string;
  onCancel?: () => void;
}

interface DiagnosticQuestion {
  question_id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  subject?: string;
  originalText: string;
}

interface Performance {
  subject: string;
  score: number;
  total: number;
  percentage: number;
  level: string;
}

interface QuizResult {
  status: string;
  total_score: number;
  total_questions: number;
  total_percentage: number;
  performance_by_subject: Performance[];
  student_profile?: string;
  curriculum?: any;
}

// ── Design tokens (mirrors LoginPage exactly) ─────────────────────────────────
const GRAD = 'linear-gradient(to right, #2563eb, #7c3aed)'; // from-blue-600 to-purple-600

export function DiagnosticTest({ onComplete, userName, onCancel }: DiagnosticTestProps) {

  const [questions, setQuestions]             = useState<DiagnosticQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers]                 = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer]   = useState<number | null>(null);
  const [showResults, setShowResults]         = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [quizResult, setQuizResult]           = useState<QuizResult | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res  = await fetch("http://localhost:8080/get_quiz");
        const data = await res.json();

        if (data.status === "success") {
          const formatted = data.data.map((q: any) => {
            let rawText = q.question_text;
            rawText = rawText.replace(/المادة:\s*.*?\.\s*السؤال:\s*/, "");

            const optionsRegex = /(أ\)|أ-)\s*(.*?)\s*(ب\)|ب-)\s*(.*?)\s*(ج\)|ج-)\s*(.*?)\s*(د\)|د-)\s*(.*)/;
            const match = rawText.match(optionsRegex);

            let mainQuestion     = rawText;
            let extractedOptions = ["أ", "ب", "ج", "د"];

            if (match) {
              mainQuestion     = rawText.split(/(أ\)|أ-)/)[0].trim();
              extractedOptions = [
                match[2].replace(/\.$/, "").trim(),
                match[4].replace(/\.$/, "").trim(),
                match[6].replace(/\.$/, "").trim(),
                match[8].replace(/\.$/, "").trim(),
              ];
            }

            return {
              question_id:   q.question_id,
              question:      mainQuestion,
              options:       extractedOptions,
              correctAnswer: ["أ","ب","ج","د"].indexOf(q.correct_letter),
              subject:       q.subject,
              originalText:  q.question_text,
            };
          });
          setQuestions(formatted);
        } else {
          setError("فشل تحميل الأسئلة");
        }
      } catch {
        setError("تعذر الاتصال بالسيرفر. يرجى التأكد من تشغيل api.py");
      }
      setLoading(false);
    };
    loadQuestions();
  }, []);

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2 mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ background: GRAD }}
        >
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <span className="text-3xl text-gray-800">منصة آفاق</span>
      </div>
    </div>
  );

  if (loading || submitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 rtl" dir="rtl">
        <style>{`
          @keyframes spin-ring {
            to { transform: rotate(360deg); }
          }
          .dt-spinner {
            width: 96px; height: 96px;
            border-radius: 50%;
            border: 8px solid #dbeafe;
            border-top-color:   #2563eb;
            border-right-color: #7c3aed;
            animation: spin-ring 1s cubic-bezier(0.4,0,0.2,1) infinite;
          }
        `}</style>

        <Logo />

        <Card className="w-full max-w-2xl p-12 text-center shadow-xl border-2">
          <div className="flex justify-center mb-8">
            <div className="dt-spinner" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {submitting ? 'جاري تحليل مستواك...' : 'جاري سحب الأسئلة...'}
          </h2>
          <p className="text-gray-600">
            {submitting
              ? 'يرجى الانتظار، يتم الآن حساب النتيجة '
              : 'يرجى الانتظار قليلاً'}
          </p>
        </Card>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 rtl" dir="rtl">
        <Card className="w-full max-w-2xl p-8 text-center shadow-xl border-2">
          <h2 className="text-xl font-bold text-gray-800 mb-2">عذراً، حدث خطأ!</h2>
          <p className="text-red-600 mb-8">{error}</p>
          {onCancel && (
            <Button
              onClick={onCancel}
              className="w-full text-white border-0 hover:opacity-90"
              style={{ background: GRAD }}
            >
              العودة للرئيسية
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const handleAnswerSelect = (index: number) => setSelectedAnswer(index);

  const handleNext = async () => {
    if (selectedAnswer === null) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setSubmitting(true);
      const submission = {
        answers: newAnswers.map((answerIndex, i) => ({
          question_id:           questions[i].question_id,
          subject:               questions[i].subject || "عام",
          question_text:         questions[i].originalText,
          user_answer:           ["أ","ب","ج","د"][answerIndex],
          correct_letter:        ["أ","ب","ج","د"][questions[i].correctAnswer],
          reference_explanation: "",
        })),
      };
      try {
        const res    = await fetch("http://localhost:8080/submit_quiz", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(submission),
        });
        const result = await res.json();

        if (result.status === "success") {
          setQuizResult(result);

          if (result.curriculum) {
            localStorage.setItem("afaq_curriculum", JSON.stringify(result.curriculum));
          }

          if (result.student_profile) {
            localStorage.setItem("afaq_student_profile", result.student_profile);
          }

          localStorage.setItem("afaq_quiz_result", JSON.stringify(result));

          setShowResults(true);
        } else {
          setError("حدث خطأ في التصحيح");
        }
      } catch {
        setError("فقدان الاتصال أثناء التصحيح");
      }
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (!quizResult) return;
    let levelStr = "beginner";
    if (quizResult.total_percentage >= 80)      levelStr = "advanced";
    else if (quizResult.total_percentage >= 60) levelStr = "intermediate";
    onComplete(levelStr);
  };

  if (showResults && quizResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 rtl" dir="rtl">
        <div className="w-full max-w-2xl">

          <Logo />

          <Card className="p-8 shadow-xl border-2">

            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-50 border-2 border-green-400">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">اكتمل التقييم بنجاح</h2>
              <p className="text-gray-600">{userName}، إليك ملخص مستواك:</p>
            </div>

            <div className="rounded-xl p-5 mb-5 text-center bg-gray-50 border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-gray-700">النتيجة الكلية</span>
              </div>
              <p className="text-4xl font-black text-gray-900 mt-1">
                {quizResult.total_score}
                <span className="text-2xl text-gray-400"> / {quizResult.total_questions}</span>
                <span className="text-2xl text-purple-600 mr-2">
                  ({quizResult.total_percentage}%)
                </span>
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                مستوى الطالب في كل مادة:
              </h3>
              <div className="space-y-3">
                {quizResult.performance_by_subject.map((perf, idx) => {
                  let bg        = '#fff5f5';
                  let border    = '#fca5a5';
                  let textColor = '#dc2626';
                  if (perf.percentage >= 80) {
                    bg = '#f0fdf4'; border = '#86efac'; textColor = '#16a34a';
                  } else if (perf.percentage >= 50) {
                    bg = '#eff6ff'; border = '#93c5fd'; textColor = '#2563eb';
                  }
                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl"
                      style={{ background: bg, border: `1.5px solid ${border}` }}
                    >
                      <div className="font-bold text-base text-gray-800 mb-1 sm:mb-0">
                        المادة: {perf.subject}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold" style={{ color: textColor }}>
                        <span>النتيجة: {perf.score}/{perf.total}</span>
                        <span>النسبة: {perf.percentage}%</span>
                        <span>المستوى: {perf.level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleFinish}
              className="w-full py-6 text-base font-bold text-white border-0 flex items-center justify-center gap-2"
              style={{ background: GRAD }}
            >
              متابعة لإنشاء الخطة الدراسية
              <ArrowRight className="w-5 h-5 rotate-180" />
            </Button>

          </Card>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question  = questions[currentQuestion];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 rtl" dir="rtl">
      <div className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: GRAD }}
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl text-gray-800">منصة آفاق</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">التقييم التشخيصي الذكي</h1>
          <p className="text-gray-600">أجب على الأسئلة لتحديد مستواك الدراسي</p>
        </div>

        <Card className="p-8 shadow-xl border-2">

          <div className="mb-6">
            <div className="flex justify-between mb-2 text-sm font-bold text-gray-700">
              <span>السؤال {currentQuestion + 1} من {questions.length}</span>
              <span className="text-purple-600">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: GRAD }}
              />
            </div>
          </div>

          <div className="mb-4">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {question.subject}
            </span>
          </div>

          <h2 className="text-lg font-bold leading-relaxed text-gray-800 mb-6 text-right">
            {question.question}
          </h2>

          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className="w-full p-4 rounded-xl flex items-center gap-3 text-right transition-all duration-200"
                  style={{
                    border:     isSelected ? '2px solid #7c3aed' : '1.5px solid #e5e7eb',
                    background: isSelected ? '#f5f3ff' : '#ffffff',
                    boxShadow:  isSelected ? '0 2px 12px rgba(124,58,237,0.12)' : 'none',
                  }}
                >
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: isSelected ? GRAD : 'transparent',
                      border:     isSelected ? 'none' : '2px solid #d1d5db',
                    }}
                  >
                    {isSelected
                      ? <CheckCircle className="w-5 h-5 text-white" />
                      : <Circle className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                  <span
                    className="text-base flex-1"
                    style={{ color: isSelected ? '#4c1d95' : '#374151', fontWeight: isSelected ? 700 : 500 }}
                  >
                    <span className="text-gray-400 font-bold ml-1">{["أ","ب","ج","د"][index]}.</span>
                    <span dir="auto"> {option}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="w-full py-6 text-base font-bold text-white border-0 transition-all"
            style={
              selectedAnswer === null
                ? { background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' }
                : { background: GRAD, boxShadow: '0 4px 16px rgba(124,58,237,0.25)' }
            }
          >
            {currentQuestion < questions.length - 1
              ? "تأكيد والانتقال للتالي"
              : "إنهاء وتسليم الاختبار"}
          </Button>

        </Card>
      </div>
    </div>
  );
}