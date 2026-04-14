import { useState } from 'react';
import { Clock, Calendar, Target, BookOpen, Award, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface StudyPreferencesProps {
  userName: string;
  diagnosticLevel: string;
  onComplete: (preferences: StudyPreferencesData) => void;
  onCancel: () => void;
}

export interface StudyPreferencesData {
  dailyStudyTime: number; // minutes per day
  studyDuration: number; // total weeks
  studyDays: string[]; // days of the week
  preferredTime: string; // morning, afternoon, evening
  goals: string[];
  intensity: 'relaxed' | 'moderate' | 'intense';
}

const daysOfWeek = [
  { id: 'sunday', label: 'الأحد' },
  { id: 'monday', label: 'الإثنين' },
  { id: 'tuesday', label: 'الثلاثاء' },
  { id: 'wednesday', label: 'الأربعاء' },
  { id: 'thursday', label: 'الخميس' },
  { id: 'friday', label: 'الجمعة' },
  { id: 'saturday', label: 'السبت' },
];

const goalOptions = [
  { id: 'tahsili', label: 'اجتياز اختبار التحصيلي', icon: Award },
  { id: 'grades', label: 'تحسين درجات المدرسة', icon: Target },
  { id: 'understanding', label: 'فهم المفاهيم بعمق', icon: BookOpen },
  { id: 'university', label: 'التحضير للجامعة', icon: CheckCircle },
];

export function StudyPreferences({ userName, diagnosticLevel, onComplete, onCancel }: StudyPreferencesProps) {
  const [step, setStep] = useState(1);
  const [dailyStudyTime, setDailyStudyTime] = useState(60);
  const [studyDuration, setStudyDuration] = useState(12);
  const [studyDays, setStudyDays] = useState<string[]>(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']);
  const [preferredTime, setPreferredTime] = useState('evening');
  const [goals, setGoals] = useState<string[]>(['tahsili']);
  const [intensity, setIntensity] = useState<'relaxed' | 'moderate' | 'intense'>('moderate');

  const toggleDay = (dayId: string) => {
    setStudyDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const preferences: StudyPreferencesData = {
      dailyStudyTime,
      studyDuration,
      studyDays,
      preferredTime,
      goals,
      intensity
    };

    setSubmitting(true);
    try {
      await onComplete(preferences);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return dailyStudyTime > 0 && studyDuration > 0;
    if (step === 2) return studyDays.length > 0;
    if (step === 3) return goals.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8" dir="rtl">
          <div className="inline-block bg-white rounded-full px-6 py-2 shadow-lg mb-4">
            <span className="text-sm text-gray-600">الخطوة {step} من 4</span>
          </div>
          <h1 className="text-4xl mb-4">
            أهلاً {userName}! 👋
          </h1>
          <p className="text-xl text-gray-600">
            دعنا نصمم خطة دراسية مناسبة لك
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8" dir="rtl">
          <div className="flex gap-2 max-w-md mx-auto">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="p-8 lg:p-12 shadow-2xl" dir="rtl">
          {/* Step 1: Time Commitment */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl mb-3">كم من الوقت يمكنك تخصيصه للدراسة؟</h2>
                <p className="text-gray-600">سنساعدك على تنظيم وقتك بكفاءة</p>
              </div>

              <div>
                <label className="block text-lg mb-4">⏱️ الوقت اليومي للدراسة</label>
                <div className="flex items-center gap-4 mb-2">
                  <input
                    type="range"
                    min="15"
                    max="240"
                    step="15"
                    value={dailyStudyTime}
                    onChange={(e) => setDailyStudyTime(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg min-w-[120px] text-center">
                    <span className="text-2xl">{dailyStudyTime}</span>
                    <span className="text-sm mr-2">دقيقة</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>15 دقيقة</span>
                  <span>4 ساعات</span>
                </div>
              </div>

              <div>
                <label className="block text-lg mb-4">📅 مدة الخطة الدراسية</label>
                <div className="flex items-center gap-4 mb-2">
                  <input
                    type="range"
                    min="4"
                    max="52"
                    step="2"
                    value={studyDuration}
                    onChange={(e) => setStudyDuration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg min-w-[120px] text-center">
                    <span className="text-2xl">{studyDuration}</span>
                    <span className="text-sm mr-2">أسبوع</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>4 أسابيع</span>
                  <span>52 أسبوع</span>
                </div>
              </div>

              <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded">
                <p className="text-blue-900">
                  💡 <strong>إجمالي وقت الدراسة:</strong> {Math.round((dailyStudyTime * studyDays.length * studyDuration) / 60)} ساعة على مدى {studyDuration} أسبوع
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Study Schedule */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl mb-3">متى تفضل الدراسة؟</h2>
                <p className="text-gray-600">اختر الأيام والأوقات المناسبة لك</p>
              </div>

              <div>
                <label className="block text-lg mb-4">📆 أيام الدراسة الأسبوعية</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        studyDays.includes(day.id)
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-purple-600'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {studyDays.length} {studyDays.length === 1 ? 'يوم' : studyDays.length === 2 ? 'يومان' : 'أيام'} محددة
                </p>
              </div>

              <div>
                <label className="block text-lg mb-4">🕐 الوقت المفضل للدراسة</label>
                <div className="grid md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setPreferredTime('morning')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      preferredTime === 'morning'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-purple-600'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🌅</div>
                    <div>صباحاً</div>
                    <div className="text-sm opacity-80">6 ص - 12 م</div>
                  </button>
                  <button
                    onClick={() => setPreferredTime('afternoon')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      preferredTime === 'afternoon'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-purple-600'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">☀️</div>
                    <div>ظهراً</div>
                    <div className="text-sm opacity-80">12 م - 6 م</div>
                  </button>
                  <button
                    onClick={() => setPreferredTime('evening')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      preferredTime === 'evening'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-purple-600'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🌙</div>
                    <div>مساءً</div>
                    <div className="text-sm opacity-80">6 م - 12 ص</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl mb-3">ما هي أهدافك الدراسية؟</h2>
                <p className="text-gray-600">يمكنك اختيار أكثر من هدف</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {goalOptions.map(goal => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-6 rounded-lg border-2 transition-all text-right ${
                        goals.includes(goal.id)
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-purple-600'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          goals.includes(goal.id)
                            ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                            : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            goals.includes(goal.id) ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-lg mb-1">{goal.label}</div>
                          {goals.includes(goal.id) && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Intensity */}
          {step === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl mb-3">ما هي وتيرة الدراسة المفضلة؟</h2>
                <p className="text-gray-600">اختر الأسلوب الذي يناسب نمط حياتك</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setIntensity('relaxed')}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-right ${
                    intensity === 'relaxed'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-purple-600'
                      : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🐢</div>
                    <div className="flex-1">
                      <div className="text-xl mb-1">مريح وهادئ</div>
                      <div className="text-sm text-gray-600">
                        دراسة بطيئة ومريحة مع مراجعات كثيرة - مثالي للمبتدئين
                      </div>
                    </div>
                    {intensity === 'relaxed' && (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setIntensity('moderate')}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-right ${
                    intensity === 'moderate'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-purple-600'
                      : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🚶</div>
                    <div className="flex-1">
                      <div className="text-xl mb-1">متوازن</div>
                      <div className="text-sm text-gray-600">
                        وتيرة متوسطة تجمع بين الدراسة والمراجعة - الأكثر شيوعاً
                      </div>
                    </div>
                    {intensity === 'moderate' && (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setIntensity('intense')}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-right ${
                    intensity === 'intense'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-purple-600'
                      : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🚀</div>
                    <div className="flex-1">
                      <div className="text-xl mb-1">مكثف وسريع</div>
                      <div className="text-sm text-gray-600">
                        دراسة سريعة ومركزة للطلاب الطموحين - يتطلب التزام عالي
                      </div>
                    </div>
                    {intensity === 'intense' && (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              </div>

              <div className="bg-purple-50 border-r-4 border-purple-500 p-4 rounded">
                <p className="text-purple-900">
                  📊 <strong>مستواك من التقييم:</strong> {
                    diagnosticLevel === 'beginner' ? 'مبتدئ' :
                    diagnosticLevel === 'intermediate' ? 'متوسط' : 'متقدم'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="w-5 h-5 ml-2" />
                السابق
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onCancel}
              >
                إلغاء
              </Button>
            )}

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                التالي
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري إنشاء الخطة...
                  </div>
                ) : (
                  <>
                    إنشاء خطتي الدراسية
                    <CheckCircle className="w-5 h-5 mr-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
