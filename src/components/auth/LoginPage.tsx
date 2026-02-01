import { useState } from 'react';
import { GraduationCap, Mail, Lock, UserCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';

interface LoginPageProps {
  onLogin: (email: string, password: string, isGuest?: boolean) => void;
  onNavigate: (page: 'signup' | 'home') => void;
}

export function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const handleGuestAccess = () => {
    onLogin('guest@afaq.com', '', true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl">منصة آفاق</span>
          </div>
          <h1 className="text-2xl mb-2">مرحباً بعودتك!</h1>
          <p className="text-gray-600">تابع رحلتك التعليمية</p>
        </div>

        <Card className="p-8 shadow-xl border-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              تسجيل الدخول
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">أو</span>
            </div>
          </div>

          <Button 
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGuestAccess}
          >
            <UserCircle className="w-5 h-5 mr-2" />
            متابعة كزائر
          </Button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ليس لديك حساب؟{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-purple-600 hover:text-purple-700"
              >
                سجل الآن
              </button>
            </p>
          </div>
        </Card>

        <div className="mt-4 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-600 hover:text-gray-800"
          >
            → العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
