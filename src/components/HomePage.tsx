import { GraduationCap, Brain, TrendingUp, Target, Sparkles, Award, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface HomePageProps {
  onNavigate: (page: 'login' | 'signup') => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Personalized study plans adapted to your unique learning style and pace'
    },
    {
      icon: Target,
      title: 'Diagnostic Assessment',
      description: 'Instant evaluation of your current academic level to create the perfect starting point'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Real-time analytics showing your improvement, streaks, and achievement milestones'
    },
    {
      icon: Sparkles,
      title: 'Interactive Modules',
      description: 'Engaging study materials with quizzes and instant feedback to reinforce learning'
    },
    {
      icon: Award,
      title: 'Tahsili Exam Ready',
      description: 'Specialized preparation for high school students and Tahsili exam graduates'
    },
    {
      icon: GraduationCap,
      title: 'Expert Guidance',
      description: 'AI-driven recommendations and study tips from educational experts'
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
            <span className="text-2xl">Afaq Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => onNavigate('login')}>
              Login
            </Button>
            <Button onClick={() => onNavigate('signup')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">AI-Powered Adaptive Learning</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Personal Study Assistant for Academic Excellence
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Afaq Platform uses advanced AI to create personalized study plans, track your progress, and help you ace your high school exams and Tahsili preparation.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => onNavigate('signup')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8"
            >
              Start Learning Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => onNavigate('login')}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-white/50 backdrop-blur-sm">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive tools and features designed specifically for high school students and Tahsili exam graduates
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
            Your Journey to Success
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Follow our proven step-by-step process to achieve your academic goals
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {[
            { step: 1, title: 'Take Diagnostic Test', description: 'Assess your current level with our comprehensive diagnostic evaluation' },
            { step: 2, title: 'Get Your Study Plan', description: 'Receive a personalized curriculum tailored to your needs and goals' },
            { step: 3, title: 'Learn & Practice', description: 'Study interactive modules with engaging content and practice exercises' },
            { step: 4, title: 'Track Progress', description: 'Monitor your improvement with detailed analytics and actionable insights' },
            { step: 5, title: 'Excel in Exams', description: 'Apply your knowledge and achieve excellence in your exams' }
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
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students already succeeding with Afaq Platform
          </p>
          <Button 
            size="lg" 
            onClick={() => onNavigate('signup')}
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8"
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Afaq Platform. Empowering students to reach new horizons.</p>
        </div>
      </footer>
    </div>
  );
}
