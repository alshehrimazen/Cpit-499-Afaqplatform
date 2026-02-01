import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/common/tabs.jsx';
import { HomeTab } from './HomeTab.jsx';
import { AnalyticsTab } from './AnalyticsTab.jsx';

export function PersonalizedHome({ user, studyPlans, onCreateNewPlan, onOpenPlan, onToggleSidebar }) {
  const [activeTab, setActiveTab] = useState('home');

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
  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
    <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 mr-0 ml-auto"> 
      <TabsTrigger value="analytics">التحليلات</TabsTrigger>
      <TabsTrigger value="home">الرئيسية</TabsTrigger>
    </TabsList>
    <TabsContent value="home">
      <HomeTab 
        user={user}
        studyPlans={studyPlans}
        onCreateNewPlan={onCreateNewPlan}
        onOpenPlan={onOpenPlan}
      />
    </TabsContent>
    <TabsContent value="analytics">
      <AnalyticsTab user={user} studyPlans={studyPlans} />
    </TabsContent>
  </Tabs>
</div>
    </div>
  );
}
