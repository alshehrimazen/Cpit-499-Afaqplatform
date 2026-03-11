import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, RotateCw, CheckCircle } from 'lucide-react';
import { generateFlashcards, isAiApiConfigured, type FlashcardItem } from '../../services/aiApi';

interface LessonFlashcardsProps {
  moduleId: string;
  onComplete: () => void;
  onBack?: () => void;
  onToggleSidebar?: () => void;
}

export function LessonFlashcards({ moduleId, onComplete, onBack, onToggleSidebar }: LessonFlashcardsProps) {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setCurrentCard(0);
      setIsFlipped(false);

      if (!isAiApiConfigured()) {
        setError('خدمة الذكاء الاصطناعي غير مفعّلة حالياً. الرجاء ضبط إعدادات السيرفر ثم المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      const items = await generateFlashcards(moduleId);
      if (!active) return;

      if (items && Array.isArray(items) && items.length > 0) {
        setFlashcards(items);
      } else {
        setError('تعذر تحميل البطاقات التعليمية حالياً. حاول مرة أخرى لاحقاً.');
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
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <span className="text-purple-700">جاري إنشاء البطاقات التعليمية...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error || flashcards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-xl text-center" dir="rtl">
          <p className="text-red-600 mb-4">{error || 'لا توجد بطاقات متاحة حالياً.'}</p>
          <div className="flex items-center justify-center gap-3">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                الرجوع
              </Button>
            )}
            <Button onClick={() => setReloadKey((v) => v + 1)}>إعادة المحاولة</Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setIsFlipped(false);
      setCurrentCard(currentCard + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => Math.max(0, prev - 1));
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const card = flashcards[currentCard];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl mb-3">عمل رائع! 🎉</h1>
          <p className="text-xl text-gray-600">
            قبل الاختبار، دعنا نراجع المفاهيم الأساسية باستخدام البطاقات التعليمية
          </p>
        </div>

        <Card className="p-8 bg-white shadow-xl mb-6">
          {/* Flashcard */}
          <div 
            className="relative h-80 mb-8 cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <div 
              className={`absolute inset-0 transition-all duration-500 transform-style-3d`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br from-white to-blue-50 rounded-xl border-2 border-blue-200 shadow-lg flex flex-col p-8 backface-hidden ${
                  isFlipped ? 'invisible' : 'visible'
                }`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex justify-end mb-4">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm">
                    السؤال
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <h3 className="text-3xl lg:text-4xl px-4">{card.front}</h3>
                    <p className="text-gray-500 mt-8">اضغط لرؤية الإجابة</p>
                  </div>
                </div>
              </div>

              {/* Back */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl shadow-lg flex flex-col p-8 backface-hidden ${
                  isFlipped ? 'visible' : 'invisible'
                }`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="flex justify-end mb-4">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                    الإجابة
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <p className="text-xl lg:text-2xl leading-relaxed">{card.back}</p>
                    <p className="text-white/70 mt-8 text-sm">اضغط للعودة للسؤال</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              onClick={handlePrevious}
              variant="outline"
              disabled={currentCard === 0}
              className="flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {currentCard + 1} / {flashcards.length}
              </span>
              <Button
                onClick={handleFlip}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                قلب البطاقة
              </Button>
            </div>

            <Button 
              onClick={handleNext}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {currentCard < flashcards.length - 1 ? (
                <>
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </>
              ) : (
                <>
                  الانتقال للاختبار
                  <ChevronLeft className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentCard(index);
                  setIsFlipped(false);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentCard 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-8' 
                    : index < currentCard
                    ? 'bg-purple-400'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </Card>

        {/* Tips Card */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <h3 className="text-xl mb-4">💡 نصائح دراسية سريعة</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>حاول تذكر الإجابة قبل قلب البطاقة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>ركز على فهم المفاهيم وليس الحفظ فقط</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>راجع هذه البطاقات التعليمية قبل البدء في الاختبار</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}