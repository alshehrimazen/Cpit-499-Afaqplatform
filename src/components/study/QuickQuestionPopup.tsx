import { useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface QuickQuestionProps {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  onClose: () => void;
  slideNumber: number;
}

export function QuickQuestionPopup({ 
  question, 
  options, 
  correctAnswer, 
  explanation, 
  onClose,
  slideNumber 
}: QuickQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelectAnswer = (index: number) => {
    if (!showFeedback) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      setShowFeedback(true);
    }
  };

  const handleContinue = () => {
    onClose();
  };

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card 
        className="max-w-2xl w-full p-6 lg:p-8 animate-in fade-in zoom-in duration-300" 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl mb-1">سؤال سريع 💡</h3>
            <p className="text-sm text-gray-600">بناءً على الشرائح {slideNumber > 1 ? `${slideNumber - 1}-${slideNumber}` : slideNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <h4 className="text-lg mb-4">{question}</h4>
          <div className="space-y-3">
            {options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === correctAnswer;
              
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
                  {isCorrect ? '🎉 صحيح! أحسنت!' : '📝 ليس تماماً'}
                </p>
                <p className="text-sm text-gray-700">{explanation}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {!showFeedback ? (
            <>
              <Button variant="outline" onClick={onClose}>
                تخطي
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                إرسال الإجابة
              </Button>
            </>
          ) : (
            <Button
              onClick={handleContinue}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              متابعة الدرس
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
