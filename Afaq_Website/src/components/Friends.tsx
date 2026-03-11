import { useState } from 'react';
import { Menu, UserPlus, Trophy, TrendingUp, Zap, Award, Medal, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import type { User } from '../App';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: string;
  subjectFocus: string;
  completedLessons: number;
  accuracy: number;
  currentStreak: number;
  xp: number;
}

interface FriendsProps {
  user: User;
  onToggleSidebar: () => void;
}

export function Friends({ user, onToggleSidebar }: FriendsProps) {
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: '1',
      name: 'سارة أحمد',
      avatar: 'س',
      level: 'متقدم',
      subjectFocus: 'الرياضيات',
      completedLessons: 42,
      accuracy: 94,
      currentStreak: 12,
      xp: 4200
    },
    {
      id: '2',
      name: 'محمد علي',
      avatar: 'م',
      level: 'متوسط',
      subjectFocus: 'الفيزياء',
      completedLessons: 38,
      accuracy: 88,
      currentStreak: 8,
      xp: 3800
    },
    {
      id: '3',
      name: 'فاطمة حسن',
      avatar: 'ف',
      level: 'متقدم',
      subjectFocus: 'الكيمياء',
      completedLessons: 45,
      accuracy: 92,
      currentStreak: 15,
      xp: 4500
    },
    {
      id: '4',
      name: 'عمر خالد',
      avatar: 'ع',
      level: 'مبتدئ',
      subjectFocus: 'الإنجليزية',
      completedLessons: 28,
      accuracy: 82,
      currentStreak: 5,
      xp: 2800
    },
    {
      id: '5',
      name: 'ليلى إبراهيم',
      avatar: 'ل',
      level: 'متوسط',
      subjectFocus: 'الأحياء',
      completedLessons: 35,
      accuracy: 90,
      currentStreak: 10,
      xp: 3500
    },
    {
      id: '6',
      name: 'يوسف منصور',
      avatar: 'ي',
      level: 'متقدم',
      subjectFocus: 'الرياضيات',
      completedLessons: 40,
      accuracy: 91,
      currentStreak: 7,
      xp: 4000
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFriend, setNewFriend] = useState({
    name: '',
    avatar: '',
    level: 'متوسط',
    subjectFocus: 'الرياضيات'
  });

  // Add current user to the ranking
  const currentUser: Friend = {
    id: user.id,
    name: user.name,
    avatar: user.avatar || 'م',
    level: 'متوسط',
    subjectFocus: 'جميع المواد',
    completedLessons: 32,
    accuracy: 85,
    currentStreak: 6,
    xp: 3200
  };

  const allUsers = [currentUser, ...friends];
  const sortedByXP = [...allUsers].sort((a, b) => b.xp - a.xp);
  const sortedByStreak = [...allUsers].sort((a, b) => b.currentStreak - a.currentStreak);

  const handleAddFriend = () => {
    if (newFriend.name.trim()) {
      const friend: Friend = {
        id: Date.now().toString(),
        name: newFriend.name,
        avatar: newFriend.avatar || newFriend.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        level: newFriend.level,
        subjectFocus: newFriend.subjectFocus,
        completedLessons: Math.floor(Math.random() * 30) + 10,
        accuracy: Math.floor(Math.random() * 20) + 75,
        currentStreak: Math.floor(Math.random() * 10) + 1,
        xp: Math.floor(Math.random() * 2000) + 1000
      };
      setFriends([...friends, friend]);
      setNewFriend({ name: '', avatar: '', level: 'Intermediate', subjectFocus: 'Mathematics' });
      setDialogOpen(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return null;
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': 
      case 'مبتدئ': return 'bg-green-100 text-green-700';
      case 'intermediate':
      case 'متوسط': return 'bg-blue-100 text-blue-700';
      case 'advanced':
      case 'متقدم': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl">الأصدقاء</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <UserPlus className="w-4 h-4 mr-2" />
                إضافة صديق
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة صديق جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">اسم الصديق</Label>
                  <Input
                    id="name"
                    value={newFriend.name}
                    onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })}
                    placeholder="أدخل اسم الصديق"
                  />
                </div>
                <div>
                  <Label htmlFor="avatar">الأحرف الأولى (اختياري)</Label>
                  <Input
                    id="avatar"
                    value={newFriend.avatar}
                    onChange={(e) => setNewFriend({ ...newFriend, avatar: e.target.value })}
                    placeholder="مثال: س"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="level">المستوى</Label>
                  <select
                    id="level"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newFriend.level}
                    onChange={(e) => setNewFriend({ ...newFriend, level: e.target.value })}
                  >
                    <option>مبتدئ</option>
                    <option>متوسط</option>
                    <option>متقدم</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="subject">المادة المفضلة</Label>
                  <select
                    id="subject"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newFriend.subjectFocus}
                    onChange={(e) => setNewFriend({ ...newFriend, subjectFocus: e.target.value })}
                  >
                    <option>الرياضيات</option>
                    <option>الفيزياء</option>
                    <option>الكيمياء</option>
                    <option>الإنجليزية</option>
                    <option>الأحياء</option>
                  </select>
                </div>
                <Button onClick={handleAddFriend} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  إضافة صديق
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">إجمالي الأصدقاء</span>
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-4xl mb-1">{friends.length}</p>
            <p className="text-sm text-gray-600">متعلمون متصلون</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">ترتيبك</span>
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-4xl mb-1">#{sortedByXP.findIndex(u => u.id === user.id) + 1}</p>
            <p className="text-sm text-gray-600">من أصل {allUsers.length} متعلم</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">سلسلتك الحالية</span>
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-4xl mb-1">{currentUser.currentStreak}</p>
            <p className="text-sm text-gray-600">أيام متتالية</p>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="mb-8">
          <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <div>
                <h2 className="text-2xl">لوحة المتصدرين</h2>
                <p className="text-gray-600">تنافس مع الأصدقاء واصعد في الترتيب</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right">الترتيب</th>
                  <th className="px-6 py-4 text-right">الاسم</th>
                  <th className="px-6 py-4 text-right">المستوى</th>
                  <th className="px-6 py-4 text-right">النقاط</th>
                  <th className="px-6 py-4 text-right">المكتمل</th>
                  <th className="px-6 py-4 text-right">السلسلة</th>
                  <th className="px-6 py-4 text-right">الدقة</th>
                </tr>
              </thead>
              <tbody>
                {sortedByXP.map((person, index) => {
                  const isCurrentUser = person.id === user.id;
                  return (
                    <tr 
                      key={person.id}
                      className={`border-t hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(index + 1)}
                          <span className={index < 3 ? '' : 'text-gray-600'}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            isCurrentUser 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-600'
                          }`}>
                            {person.avatar}
                          </div>
                          <div>
                            <p className={isCurrentUser ? '' : ''}>
                              {person.name} {isCurrentUser && <span className="text-blue-600">(أنت)</span>}
                            </p>
                            <p className="text-sm text-gray-600">{person.subjectFocus}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm px-3 py-1 rounded-full ${getLevelColor(person.level)}`}>
                          {person.level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span>{person.xp.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span>{person.completedLessons} دروس</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-orange-500" />
                          <span>{person.currentStreak} أيام</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={person.accuracy >= 90 ? 'text-green-600' : person.accuracy >= 80 ? 'text-blue-600' : 'text-gray-600'}>
                          {person.accuracy}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Performers */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Longest Streak */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl">أطول السلاسل</h3>
                <p className="text-sm text-gray-600">المتعلمون الأكثر استمرارية</p>
              </div>
            </div>
            <div className="space-y-3">
              {sortedByStreak.slice(0, 5).map((person, index) => {
                const isCurrentUser = person.id === user.id;
                return (
                  <div key={person.id} className={`flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{index + 1}.</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        isCurrentUser 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        {person.avatar}
                      </div>
                      <span>{person.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600">
                      <Zap className="w-5 h-5" />
                      <span>{person.currentStreak} أيام</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Most Active */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl">المتعلمون الأكثر نشاطًا</h3>
                <p className="text-sm text-gray-600">الدروس المكتملة هذا الأسبوع</p>
              </div>
            </div>
            <div className="space-y-3">
              {sortedByXP.slice(0, 5).map((person, index) => {
                const isCurrentUser = person.id === user.id;
                return (
                  <div key={person.id} className={`flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{index + 1}.</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        isCurrentUser 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        {person.avatar}
                      </div>
                      <span>{person.name}</span>
                    </div>
                    <span className="text-green-600">{person.completedLessons} دروس</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
