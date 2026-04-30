import React, { useEffect, useMemo, useState } from 'react';
import { Menu, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { StudyPlan, User } from '../../App';
import { auth, getUserData } from '../../lib/firebase';
import { AnalyticsTab } from '../home/AnalyticsTab';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface AnalyticsPageProps {
  user: User;
  studyPlans: StudyPlan[];
  onNavigate: (path: string) => void;
  onToggleSidebar: () => void;
}

function parsePlanFromFirestore(raw: any): StudyPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.id || !raw.title) return null;

  const createdAt = raw.createdAt?.toDate
    ? raw.createdAt.toDate()
    : raw.createdAt
      ? new Date(raw.createdAt)
      : new Date();

  return {
    ...raw,
    createdAt,
  } as StudyPlan;
}

export function AnalyticsPage({ user, studyPlans, onNavigate, onToggleSidebar }: AnalyticsPageProps) {
  const [remotePlans, setRemotePlans] = useState<StudyPlan[]>(studyPlans);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    let cancelled = false;
    setLoading(true);

    getUserData(uid)
      .then((data) => {
        if (cancelled) return;
        const plans = Array.isArray(data?.studyPlans)
          ? (data.studyPlans.map(parsePlanFromFirestore).filter(Boolean) as StudyPlan[])
          : [];
        if (plans.length > 0) setRemotePlans(plans);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setRemotePlans(studyPlans);
  }, [studyPlans]);

  const activePlanId = localStorage.getItem('afaq_current_plan_id');
  const activePlan = useMemo(
    () => remotePlans.find((p) => p.id === activePlanId) || remotePlans[remotePlans.length - 1],
    [remotePlans, activePlanId]
  );

  return (
    <div className="min-h-screen" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">التحليلات</h1>
          <Button variant="outline" onClick={() => onNavigate('/home')}>
            العودة للرئيسية
          </Button>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">


        {remotePlans.length === 0 ? (
          <Card className="p-10 text-center text-gray-600">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-60" />
            <p className="mb-4">لا توجد خطط بعد لعرض التحليلات.</p>
            <Button onClick={() => onNavigate('/diagnostic')}>إنشاء خطة جديدة</Button>
          </Card>
        ) : (
          <>
            {activePlan && (
              <AnalyticsDashboard
                user={user}
                plan={activePlan}
                onNavigate={(page) => onNavigate(page.startsWith('/') ? page : `/${page}`)}
                onToggleSidebar={onToggleSidebar}
                hideHeader
              />
            )}

            <div>
              <AnalyticsTab user={user} studyPlans={remotePlans} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

