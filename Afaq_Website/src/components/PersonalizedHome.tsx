import { Menu } from 'lucide-react';
import { HomeTab } from './home/HomeTab';
import type { User, StudyPlan } from '../App';

interface PersonalizedHomeProps {
  user: User;
  studyPlans: StudyPlan[];
  onCreateNewPlan: () => void;
  onOpenPlan: (planId: string) => void;
  onToggleSidebar: () => void;
}

export function PersonalizedHome({ user, studyPlans, onCreateNewPlan, onOpenPlan, onToggleSidebar }: PersonalizedHomeProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4">
          <button onClick={onToggleSidebar} className="lg:hidden mb-4">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl">لوحة التحكم</h1>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <HomeTab
          user={user}
          studyPlans={studyPlans}
          onCreateNewPlan={onCreateNewPlan}
          onOpenPlan={onOpenPlan}
        />
      </div>
    </div>
  );
}
