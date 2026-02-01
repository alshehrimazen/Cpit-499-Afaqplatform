import { useState } from 'react';
import { Menu, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Progress } from '../../components/ui/progress.jsx';
import { LessonFlashcards } from './LessonFlashcards.jsx';
import { QuickQuestionPopup } from './QuickQuestionPopup.jsx';

// Quick questions that appear after certain slides
const quickQuestions = {
  'math-1': {
    1: {
      question: 'ما هي الصيغة القياسية للمعادلة التربيعية؟',
      options: [
        'ax + b = 0',
        'ax² + bx + c = 0',
        'ax³ + bx² + c = 0',
        'a + bx + c = 0'
      ],
      correctAnswer: 1,
      explanation: 'الصيغة القياسية للمعادلة التربيعية هي ax² + bx + c = 0، حيث a ≠ 0. هذه معادلة من الدرجة الثانية.'
    },
    3: {
      question: 'عند التحليل إلى عوامل لـ x² + 5x + 6، ما هو الحل الصحيح؟',
      options: [
        '(x + 1)(x + 6)',
        '(x + 2)(x + 3)',
        '(x - 2)(x - 3)',
        '(x + 5)(x + 1)'
      ],
      correctAnswer: 1,
      explanation: 'نبحث عن رقمين حاصل ضربهما 6 ومجموعهما 5، وهما 2 و 3. لذلك: x² + 5x + 6 = (x + 2)(x + 3)'
    }
  },
  'physics-1': {
    1: {
      question: 'أي من قوانين نيوتن يُعرف بقانون القصور الذاتي؟',
      options: [
        'القانون الأول',
        'القانون الثاني',
        'القانون الثالث',
        'جميع القوانين'
      ],
      correctAnswer: 0,
      explanation: 'القانون الأول لنيوتن يُعرف بقانون القصور الذاتي، وينص على أن الجسم يبقى في حالة السكون أو الحركة المنتظمة ما لم تؤثر عليه قوة خارجية.'
    },
    2: {
      question: 'إذا كانت القوة = 50 نيوتن والكتلة = 10 كجم، ما التسارع؟',
      options: [
        '5 m/s²',
        '10 m/s²',
        '50 m/s²',
        '500 m/s²'
      ],
      correctAnswer: 0,
      explanation: 'باستخدام قانون نيوتن الثاني: F = ma، نجد أن a = F/m = 50/10 = 5 m/s²'
    }
  }
};

const moduleContent = {
  'math-1': {
    title: 'الجبر المتقدم',
    slides: [
      {
        title: 'مقدمة في المعادلات التربيعية',
        content: 'المعادلة التربيعية هي معادلة متعددة حدود من الدرجة الثانية. الصيغة القياسية هي ax² + bx + c = 0، حيث a ≠ 0.',
        example: 'مثال: 2x² + 5x - 3 = 0',
        keyPoints: [
          'أعلى قوة للمتغير هي 2',
          'يمكن أن يكون لها 0 أو 1 أو 2 من الحلول الحقيقية',
          'الرسم البياني يشكل قطعًا مكافئًا'
        ]
      },
      {
        title: 'الحل بطريقة التحليل إلى عوامل',
        content: 'التحليل إلى عوامل هو إحدى طرق حل المعادلات التربيعية. نعبر عن المعادلة كحاصل ضرب عوامل يساوي صفر.',
        example: 'x² + 5x + 6 = 0 ← (x + 2)(x + 3) = 0 ← x = -2 أو x = -3',
        keyPoints: [
          'ابحث عن رقمين حاصل ضربهما يساوي c ومجموعهما يساوي b',
          'اجعل كل عامل يساوي صفر',
          'حل من أجل x'
        ]
      },
      {
        title: 'قانون الصيغة التربيعية',
        content: 'قانون الصيغة التربيعية يوفر حلاً لأي معادلة تربيعية: x = (-b ± √(b² - 4ac)) / (2a)',
        example: 'لـ 2x² + 3x - 2 = 0: x = (-3 ± √(9 + 16)) / 4 = (-3 ± 5) / 4',
        keyPoints: [
          'يعمل لجميع المعادلات التربيعية',
          'المميز (b² - 4ac) يحدد عدد الحلول',
          'إذا كان المميز > 0: حلان حقيقيان'
        ]
      },
      {
        title: 'مسائل تطبيقية',
        content: 'دعونا نطبق ما تعلمناه بمسائل تطبيقية.',
        example: 'حاول حل: x² - 7x + 12 = 0',
        keyPoints: [
          'حدد قيم a و b و c',
          'اختر طريقتك (التحليل أو القانون)',
          'تحقق من حلولك بالتعويض'
        ]
      }
    ]
  },
  'physics-1': {
    title: 'قوىين نيوتن',
    slides: [
      {
        title: 'مقدمة في قوانين نيوتن',
        content: 'صاغ السير إسحاق نيوتن ثلاثة قوانين أساسية تصف العلاقة بين الحركة والقوى.',
        example: 'هذه القوانين تشكل أساس الميكانيكا الكلاسيكية',
        keyPoints: [
          'القانون الأول: قانون القصور الذاتي',
          'القانون الثاني: F = ma',
          'القانون الثالث: الفعل ورد الفعل'
        ]
      },
      {
        title: 'قانون نيوتن الأول',
        content: 'الجسم الساكن يبقى ساكنًا، والجسم المتحرك يبقى متحركًا بسرعة ثابتة، ما لم تؤثر عليه قوة خارجية.',
        example: 'كتاب على طاولة يبقى ثابتًا حتى يدفعه شخص ما',
        keyPoints: [
          'يُعرف أيضًا بقانون القصور الذاتي',
          'الأجسام تقاوم التغيرات في حالة حركتها',
          'القصور الذاتي يعتمد على الكتلة'
        ]
      },
      {
        title: 'قانون نيوتن الثاني',
        content: 'تسارع الجسم يتناسب طرديًا مع القوة المحصلة المؤثرة عليه وعكسيًا مع كتلته. F = ma',
        example: 'جسم كتلته 10 كجم بقوة 20 نيوتن: a = F/m = 20/10 = 2 m/s²',
        keyPoints: [
          'القوة والكتلة والتسارع مرتبطة',
          'اتجاه التسارع هو نفس اتجاه القوة المحصلة',
          'وحدة القوة في النظام الدولي هي نيوتن (N)'
        ]
      },
      {
        title: 'قانون نيوتن الثالث',
        content: 'لكل فعل رد فعل مساوٍ له في المقدار ومعاكس له في الاتجاه.',
        example: 'عندما تدفع حائطًا، يدفعك الحائط بقوة مساوية',
        keyPoints: [
          'القوى تحدث دائمًا في أزواج',
          'الفعل ورد الفعل يؤثران على أجسام مختلفة',
          'متساويان في المقدار، متعاكسان في الاتجاه'
        ]
      }
    ]
  }
};

// Generate similar content for other modules
const defaultSlides = [
  {
    title: 'مقدمة',
    content: 'مرحبًا بك في هذه الوحدة التعليمية. سنستكشف المفاهيم الأساسية خطوة بخطوة.',
    example: 'استعد للتعلم!',
    keyPoints: ['محتوى تفاعلي', 'أمثلة حقيقية', 'تمارين تطبيقية']
  },
  {
    title: 'المفاهيم الأساسية',
    content: 'فهم المبادئ الأساسية أمر بالغ الأهمية للإتقان.',
    example: 'كل مفهوم يبني على المعرفة السابقة',
    keyPoints: ['المعرفة التأسيسية', 'التطبيقات العملية', 'التفكير النقدي']
  },
  {
    title: 'موضوعات متقدمة',
    content: 'الآن دعونا نتعمق أكثر في الجوانب الأكثر تعقيدًا للموضوع.',
    example: 'تحدى نفسك بمواد متقدمة',
    keyPoints: ['حل المشكلات المعقدة', 'تكامل المفاهيم', 'التطبيقات في العالم الحقيقي']
  },
  {
    title: 'ملخص وتطبيق',
    content: 'دعونا نراجع ما تعلمناه ونستعد للاختبار.',
    example: 'اختبر فهمك',
    keyPoints: ['النقاط الرئيسية', 'مسائل تطبيقية', 'التقييم الذاتي']
  }
];

export function StudyModule({ moduleId, onComplete, onBack, onToggleSidebar }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuickQuestion, setShowQuickQuestion] = useState(false);
  const [questionToShow, setQuestionToShow] = useState(null);
  
  const module = moduleContent[moduleId] || { 
    title: 'وحدة دراسية', 
    slides: defaultSlides 
  };
  
  const slides = module.slides;
  const progress = ((currentSlide + 1) / slides.length) * 100;
  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      
      // Check if there's a quick question for this slide
      const moduleQuestions = quickQuestions[moduleId];
      if (moduleQuestions && moduleQuestions[nextSlide]) {
        setQuestionToShow(moduleQuestions[nextSlide]);
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
          explanation={questionToShow.explanation}
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
                {slide.keyPoints.map((point, index) => (
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
