import { Menu, BookOpen, CheckCircle, Clock, TrendingUp, Zap, Target, Award } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import type { StudyProgress } from '../../App';

interface DashboardProps {
  user: any;
  studyProgress: StudyProgress;
  onStartModule: (moduleId: string) => void;
  onNavigate: (page: string) => void;
  onToggleSidebar: () => void;
}

const modules = [
  { id: 'math-1', title: 'Advanced Algebra', subject: 'Mathematics', duration: '45 min', difficulty: 'Intermediate' },
  { id: 'physics-1', title: 'Newton\'s Laws', subject: 'Physics', duration: '50 min', difficulty: 'Intermediate' },
  { id: 'chem-1', title: 'Chemical Bonding', subject: 'Chemistry', duration: '40 min', difficulty: 'Beginner' },
  { id: 'english-1', title: 'Essay Writing', subject: 'English', duration: '35 min', difficulty: 'Intermediate' },
  { id: 'bio-1', title: 'Cell Biology', subject: 'Biology', duration: '45 min', difficulty: 'Advanced' }
];

export function Dashboard({ user, studyProgress, onStartModule, onNavigate, onToggleSidebar }: DashboardProps) {
  const completedCount = studyProgress.completedModules.length;
  const totalModules = modules.length;
  const overallProgress = (completedCount / totalModules) * 100;
  const averageScore = studyProgress.completedModules.length > 0
    ? Object.values(studyProgress.quizScores).reduce((a, b) => a + b, 0) / studyProgress.completedModules.length
    : 0;

  const allModulesComplete = completedCount >= totalModules;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Dashboard</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl mb-2">Welcome back, {user.name}! 👋</h2>
          <p className="text-lg opacity-90">Ready to continue your learning journey?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Progress</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl mb-1">{overallProgress.toFixed(0)}%</p>
            <p className="text-sm text-gray-600">{completedCount}/{totalModules} modules</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Avg Score</span>
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl mb-1">{averageScore.toFixed(0)}%</p>
            <p className="text-sm text-gray-600">Keep it up!</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Streak</span>
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl mb-1">{studyProgress.currentStreak}</p>
            <p className="text-sm text-gray-600">days</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Study Time</span>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl mb-1">{studyProgress.totalStudyTime || 0}</p>
            <p className="text-sm text-gray-600">hours</p>
          </Card>
        </div>

        {/* AI Suggestions */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl mb-2">AI Study Recommendations</h3>
              <ul className="space-y-2 text-gray-700">
                {completedCount === 0 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Start with Advanced Algebra to build a strong foundation</span>
                  </li>
                )}
                {completedCount > 0 && completedCount < totalModules && (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Great progress! Keep your streak going by completing one module today</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Review your quiz results to identify areas for improvement</span>
                    </li>
                  </>
                )}
                {allModulesComplete && (
                  <li className="flex items-start gap-2">
                    <Award className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Congratulations! You're ready for the Final Exam. Access it from the sidebar!</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Card>

        {/* Study Modules */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">Your Study Plan</h2>
            <Button
              variant="outline"
              onClick={() => onNavigate('analytics')}
            >
              View Analytics
            </Button>
          </div>

          <div className="grid gap-4">
            {modules.map((module) => {
              const isCompleted = studyProgress.completedModules.includes(module.id);
              const score = studyProgress.quizScores[module.id];

              return (
                <Card key={module.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-blue-500'
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl mb-1">{module.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {module.subject}
                            </span>
                            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {module.difficulty}
                            </span>
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {module.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isCompleted && score !== undefined && (
                        <div className="mr-15">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">درجة الاختبار</span>
                            <span className="text-sm">{score}%</span>
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      )}
                    </div>
                    <div>
                      {isCompleted ? (
                        <Button variant="outline" onClick={() => onStartModule(module.id)}>
                          Review
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onStartModule(module.id)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Start Module
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Final Exam CTA */}
        {allModulesComplete && (
          <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl mb-2">Ready for the Final Exam!</h3>
              <p className="text-gray-600 mb-6">You've completed all modules. Test your knowledge in the comprehensive final exam.</p>
              <Button
                onClick={() => onNavigate('final-exam')}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Take Final Exam
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
