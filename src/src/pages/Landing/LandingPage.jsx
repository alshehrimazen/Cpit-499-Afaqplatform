import { GraduationCap, Brain, TrendingUp, Target, Sparkles, Award } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';

export function LandingPage({ onNavigate }) {
  const features = [
    {
      icon: Brain,
      title: 'التعلم بالذكاء الاصطناعي',
      description: 'خطط دراسية مخصصة تتكيف مع أسلوب التعلم الخاص بك وسرعتك'
    },
    {
      icon: Target,
      title: 'التقييم التشخيصي',
      description: 'تقييم فوري لمستواك الأكاديمي الحالي لإنشاء نقطة البداية المثالية'
    },
    {
      icon: TrendingUp,
      title: 'تتبع التقدم',
      description: 'تحليلات فورية توضح تحسنك وإنجازاتك والمعالم التي وصلت إليها'
    },
    {
      icon: Sparkles,
      title: 'وحدات تفاعلية',
      description: 'مواد دراسية جذابة مع اختبارات وملاحظات فورية لتعزيز التعلم'
    },
    {
      icon: Award,
      title: 'جاهز لاختبار التحصيلي',
      description: 'إعداد متخصص لطلاب الثانوية وخريجي اختبار التحصيلي'
    },
    {
      icon: GraduationCap,
      title: 'إرشاد الخبراء',
      description: 'توصيات ونصائح دراسية مدفوعة بالذكاء الاصطناعي من خبراء التعليم'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl">منصة آفاق</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => onNavigate('login')}>
              تسجيل الدخول
            </Button>
            <Button onClick={() => onNavigate('signup')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              ابدأ الآن
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">التعلم التكيفي بالذكاء الاصطناعي</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            مساعدك الدراسي الشخصي للتميز الأكاديمي
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            تستخدم منصة آفاق الذكاء الاصطناعي المتقدم لإنشاء خطط دراسية مخصصة وتتبع تقدمك ومساعدتك على التفوق في امتحانات الثانوية والتحضير للتحصيلي.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => onNavigate('signup')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8"
            >
              ابدأ التعلم الآن
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => onNavigate('login')}
              className="text-lg px-8"
            >
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-white/50 backdrop-blur-sm">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl mb-4">
            كل ما تحتاجه للنجاح
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            أدوات وميزات شاملة مصممة خصيصاً لطلاب الثانوية وخريجي اختبار التحصيلي
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl mb-4">
            رحلتك نحو النجاح
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            اتبع عمليتنا المثبتة خطوة بخطوة لتحقيق أهدافك الأكاديمية
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {[
            { step: 1, title: 'إنشاء حسابك', description: 'سجل واحصل على لوحة التحكم الشخصية الخاصة بك' },
            { step: 2, title: 'خضوع للاختبار التشخيصي', description: 'قيّم مستواك الحالي بتقييمنا التشخيصي الشامل' },
            { step: 3, title: 'احصل على خطتك الدراسية', description: 'احصل على منهج مخصص مصمم حسب احتياجاتك وأهدافك' },
            { step: 4, title: 'تعلم ومارس', description: 'ادرس وحدات تفاعلية بمحتوى جذاب وتمارين عملية' },
            { step: 5, title: 'تفوق في الامتحانات', description: 'طبق معرفتك واحصل على التميز في امتحاناتك' }
          ].map((item) => (
            <div key={item.step} className="flex gap-4 mb-8">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white">
                {item.step}
              </div>
              <div>
                <h3 className="text-xl mb-1">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl mb-4">
            هل أنت مستعد لتحويل تعلمك؟
          </h2>
          <p className="text-xl mb-8 opacity-90">
            انضم إلى الآلاف من الطلاب الذين يحققون النجاح بالفعل مع منصة آفاق
          </p>
          <Button 
            size="lg" 
            onClick={() => onNavigate('signup')}
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8"
          >
            ابدأ مجاناً
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 منصة آفاق. نمكن الطلاب من الوصول إلى آفاق جديدة.</p>
        </div>
      </footer>
    </div>
  );
}
