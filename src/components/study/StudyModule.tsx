import React, { useEffect, useState } from 'react';
import { Menu, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { LessonFlashcards } from './LessonFlashcards';
import { QuickQuestionPopup } from './QuickQuestionPopup';
import {
  getModuleContent,
  isAiApiConfigured,
  type ModuleContentResponse,
  type QuickQuestionItem,
} from '../../services/aiApi';

interface StudyModuleProps {
  moduleId: string;
  onComplete: (moduleId: string) => void;
  onBack: () => void;
  onToggleSidebar: () => void;
}

export function StudyModule({ moduleId, onComplete, onBack, onToggleSidebar }: StudyModuleProps) {
  const [module, setModule] = useState<ModuleContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuickQuestion, setShowQuickQuestion] = useState(false);
  const [questionToShow, setQuestionToShow] = useState<(QuickQuestionItem & { explanation: string }) | null>(
    null
  );
  
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setModule(null);
      setCurrentSlide(0);
      setShowQuickQuestion(false);
      setQuestionToShow(null);

      if (!isAiApiConfigured()) {
        setError('خدمة الذكاء الاصطناعي غير مفعّلة حالياً. الرجاء ضبط إعدادات السيرفر ثم المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      const data = await getModuleContent(moduleId);
      if (!active) return;
      if (data && Array.isArray(data.slides) && data.slides.length > 0) {
        setModule(data);
      } else {
        setError('تعذر تحميل محتوى الوحدة حالياً. حاول مرة أخرى لاحقاً.');
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
            <span className="text-purple-700">جاري تحميل محتوى الوحدة...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !module || !Array.isArray(module.slides) || module.slides.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-xl text-center" dir="rtl">
          <p className="text-red-600 mb-4">{error || 'لا يوجد محتوى متاح حالياً.'}</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={onBack}>
              الرجوع
            </Button>
            <Button onClick={() => setReloadKey((v) => v + 1)}>إعادة المحاولة</Button>
          </div>
        </Card>
      </div>
    );
  }

  const slides = module.slides;
  const progress = ((currentSlide + 1) / slides.length) * 100;
  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      
      // Check if there's a quick question for this slide
      const moduleQuestions = module.quickQuestions;
      const q = moduleQuestions ? moduleQuestions[nextSlide] : undefined;
      if (q) {
        setQuestionToShow({ ...q, explanation: q.explanation ?? '' });
        setShowQuickQuestion(true);
      }
    } else {
      onComplete(moduleId);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleCloseQuestion = () => {
    setShowQuickQuestion(false);
    setQuestionToShow(null);
  };

  return (
    <div className="min-h-screen">
      {/* Quick Question Popup */}
      {showQuickQuestion && questionToShow && (
        <QuickQuestionPopup
          question={questionToShow.question}
          options={questionToShow.options}
          correctAnswer={questionToShow.correctAnswer}
          explanation={questionToShow.explanation || ''}
          onClose={handleCloseQuestion}
          slideNumber={currentSlide + 1}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between" dir="rtl">
          <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <button onClick={onBack}>
              <ArrowRight className="w-6 h-6" />
            </button>
            <h1 className="text-xl lg:text-2xl">{module.title}</h1>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        {/* Progress */}
        <div className="mb-8" dir="rtl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">شريحة {currentSlide + 1} من {slides.length}</span>
            <span className="text-gray-600">{progress.toFixed(0)}% مكتمل</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Slide Content */}
        <Card className="p-8 lg:p-12 mb-8 shadow-xl">
          <h2 className="text-3xl mb-6">{slide.title}</h2>
          
          <div className="prose max-w-none mb-8">
            <p className="text-lg text-gray-700 mb-6">{slide.content}</p>
            
            {slide.example && (
              <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded mb-6">
                <p className="text-blue-900">{slide.example}</p>
              </div>
            )}
            
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-xl mb-4">النقاط الرئيسية</h3>
              <ul className="space-y-2">
                {slide.keyPoints.map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
        
          
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            السابق
          </Button>
               <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-purple-600 w-8'
                    : index < currentSlide
                    ? 'bg-purple-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
            <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentSlide < slides.length - 1 ? (
              <>
                التالي
                <ArrowLeft className="w-5 h-5 mr-2" />
              </>
            ) : (
              <>
                
                إكمال والذهاب للاختبار
                <ArrowLeft className="w-5 h-5 mr-2" />
              </>
            )}
          </Button>
          
     
        </div>
      </div>
    </div>
  );
}