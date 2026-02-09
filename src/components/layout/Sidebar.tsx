import { useNavigate } from 'react-router-dom';
import { X, Home, BarChart3, LogOut, GraduationCap, Award, Users } from 'lucide-react';
import { Button } from '../ui/button';
import type { StudyPlan } from '../../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  user: any;
  onLogout: () => void;
  studyPlans: StudyPlan[];
}

export function Sidebar({ isOpen, onClose, currentPage, user, onLogout, studyPlans }: SidebarProps) {
  const navigate = useNavigate();
  const menuItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'friends', label: 'الأصدقاء', icon: Users },
    { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  ];

  const hasCompletedPlans = studyPlans.some(p => p.completionPercentage === 100);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white border-l shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg">منصة آفاق</span>
            </div>
            <button onClick={onClose} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl">
                {user?.avatar || user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.grade}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(`/${item.id}`);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {hasCompletedPlans && (
              <button
                onClick={() => {
                  navigate('/final-exam/:planId');
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'final-exam'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100'
                  }`}
              >
                <Award className="w-5 h-5" />
                <span>الاختبار النهائي</span>
              </button>
            )}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              onClick={onLogout}
              className="w-full justify-start"
            >
              <LogOut className="w-5 h-5 mr-3" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
