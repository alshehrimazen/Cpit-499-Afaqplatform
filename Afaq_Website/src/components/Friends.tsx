import React, { useState, useEffect } from 'react';
import { Menu, UserPlus, Trophy, TrendingUp, Zap, Award, Medal, Crown, Loader2, CheckCircle, XCircle, UserX } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import type { User } from '../App';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend,
  getFriendsList,
  getFriendRequests,
  getUserPublicProfile,
  getUserByEmail,
  auth
} from '../lib/firebase';
import { toast } from 'sonner';

interface FriendProfile {
  id: string;
  name: string;
  avatar: string;
  level: string;
  completedLessons: number;
  accuracy: number;
  xp: number;
  email: string;
  createdAt?: any;
}

interface FriendsProps {
  user: User;
  onToggleSidebar: () => void;
}

export function Friends({ user, onToggleSidebar }: FriendsProps) {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FriendProfile | null>(null);

  // Load friends and requests on mount
  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (user.isGuest || !auth.currentUser) {
        setCurrentUserProfile({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || user.name?.charAt(0) || 'ز',
          level: 'زائر',
          completedLessons: 0,
          accuracy: 0,
          xp: 0,
        });
        setFriends([]);
        setFriendRequests([]);
        return;
      }
      // Get current user's profile
      const profile = await getUserPublicProfile(user.id);
      setCurrentUserProfile(profile);

      // Get friends list
      const friendsList = await getFriendsList(user.id);
      setFriends(friendsList);

      // Get friend requests
      const requests = await getFriendRequests(user.id);
      setFriendRequests(requests);
    } catch (e) {
      console.error('Error loading data:', e);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFriend = async () => {
    if (!searchEmail.trim()) {
      toast.error('أدخل بريد إلكتروني');
      return;
    }

    if (user.isGuest || !auth.currentUser) {
      toast.error('سجّل الدخول لاستخدام ميزة إضافة الأصدقاء');
      return;
    }

    try {
      setSearching(true);
      const foundUser = await getUserByEmail(searchEmail);
      
      if (!foundUser) {
        toast.error('لم يتم العثور على مستخدم');
        setSearchResult(null);
        return;
      }

      if (foundUser.id === user.id) {
        toast.error('لا يمكن إضافة نفسك');
        setSearchResult(null);
        return;
      }

      const profile = await getUserPublicProfile(foundUser.id);
      setSearchResult(profile);
    } catch (e) {
      console.error('Error searching friend:', e);
      const code = (e as any)?.code as string | undefined;
      if (code === 'permission-denied') {
        toast.error('صلاحيات Firestore تمنع البحث. تأكد من نشر Rules في مشروع Firebase الصحيح.');
      } else {
      toast.error('حدث خطأ في البحث');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string, friendEmail: string) => {
    try {
      if (user.isGuest || !auth.currentUser) {
        toast.error('سجّل الدخول لاستخدام ميزة إضافة الأصدقاء');
        return;
      }
      await sendFriendRequest(user.id, friendEmail);
      toast.success('تم إرسال طلب صداقة');
      setSearchEmail('');
      setSearchResult(null);
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'خطأ في إرسال الطلب');
    }
  };

  const handleAcceptRequest = async (fromUid: string) => {
    try {
      if (user.isGuest || !auth.currentUser) {
        toast.error('سجّل الدخول لاستخدام ميزة الأصدقاء');
        return;
      }
      await acceptFriendRequest(user.id, fromUid);
      toast.success('تم قبول طلب الصداقة');
      await loadData();
    } catch (e) {
      console.error('Error accepting request:', e);
      toast.error('خطأ في قبول الطلب');
    }
  };

  const handleRejectRequest = async (fromUid: string) => {
    try {
      if (user.isGuest || !auth.currentUser) {
        toast.error('سجّل الدخول لاستخدام ميزة الأصدقاء');
        return;
      }
      await rejectFriendRequest(user.id, fromUid);
      toast.success('تم رفض طلب الصداقة');
      await loadData();
    } catch (e) {
      console.error('Error rejecting request:', e);
      toast.error('خطأ في رفض الطلب');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      if (user.isGuest || !auth.currentUser) {
        toast.error('سجّل الدخول لاستخدام ميزة الأصدقاء');
        return;
      }
      await removeFriend(user.id, friendId);
      toast.success('تم حذف الصديق');
      await loadData();
    } catch (e) {
      console.error('Error removing friend:', e);
      toast.error('خطأ في حذف الصديق');
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

  if (loading || !currentUserProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const allUsers = [currentUserProfile, ...friends].sort((a, b) => b.xp - a.xp);
  const sortedByStreak = [...allUsers].sort((a, b) => {
    // Calculate streaks based on recent activity (for now using xp as proxy)
    return b.xp - a.xp;
  });

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
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="أدخل بريد الصديق الإلكتروني"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchFriend()}
                    />
                    <Button 
                      onClick={handleSearchFriend}
                      disabled={searching}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'بحث'}
                    </Button>
                  </div>
                </div>

                {searchResult && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                          {searchResult.avatar}
                        </div>
                        <div>
                          <p className="font-semibold">{searchResult.name}</p>
                          <p className="text-sm text-gray-600">{searchResult.email}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSendRequest(searchResult.id, searchResult.email)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        إضافة
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">طلبات الصداقة المعلقة ({friendRequests.length})</h3>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div key={request.from} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold">
                        {request.fromUser?.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{request.fromUser?.name}</p>
                        <p className="text-sm text-gray-600">{request.fromUser?.level} • {request.fromUser?.completedLessons} دروس</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.from)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.from)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        رفض
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">إجمالي الأصدقاء</span>
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-4xl mb-1">{friends.length}</p>
            <p className="text-sm text-gray-600">أصدقائك المتصلون</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">ترتيبك</span>
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-4xl mb-1">#{allUsers.findIndex(u => u.id === user.id) + 1}</p>
            <p className="text-sm text-gray-600">من أصل {allUsers.length} متعلم</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">نقاطك</span>
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-4xl mb-1">{currentUserProfile.xp.toLocaleString()}</p>
            <p className="text-sm text-gray-600">من خلال التعلم</p>
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
                  <th className="px-6 py-4 text-right">الدقة</th>
                  <th className="px-6 py-4 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((person, index) => {
                  const isCurrentUser = person.id === user.id;
                  const isFriend = friends.some(f => f.id === person.id);
                  
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
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            isCurrentUser 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-600'
                          }`}>
                            {person.avatar}
                          </div>
                          <div>
                            <p>
                              {person.name} {isCurrentUser && <span className="text-blue-600">(أنت)</span>}
                            </p>
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
                        <span className={person.accuracy >= 90 ? 'text-green-600' : person.accuracy >= 80 ? 'text-blue-600' : 'text-gray-600'}>
                          {person.accuracy}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!isCurrentUser && isFriend && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <UserX className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الصديق</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل تريد حذف {person.name} من قائمة أصدقائك؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex justify-center gap-3">
                                <AlertDialogAction 
                                  onClick={() => handleRemoveFriend(person.id)}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  حذف
                                </AlertDialogAction>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Performers */}
        {friends.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Most Active Friends */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl">الأصدقاء الأكثر نشاطًا</h3>
                  <p className="text-sm text-gray-600">الدروس المكتملة</p>
                </div>
              </div>
              <div className="space-y-3">
                {[...friends].sort((a, b) => b.completedLessons - a.completedLessons).slice(0, 5).map((person, index) => (
                  <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{index + 1}.</span>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold">
                        {person.avatar}
                      </div>
                      <span>{person.name}</span>
                    </div>
                    <span className="text-green-600">{person.completedLessons} دروس</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Performers by Points */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl">الأصدقاء النجوم</h3>
                  <p className="text-sm text-gray-600">الأعلى نقاطًا</p>
                </div>
              </div>
              <div className="space-y-3">
                {[...friends].sort((a, b) => b.xp - a.xp).slice(0, 5).map((person, index) => (
                  <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{index + 1}.</span>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold">
                        {person.avatar}
                      </div>
                      <span>{person.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600">
                      <Award className="w-5 h-5" />
                      <span>{person.xp.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {friends.length === 0 && friendRequests.length === 0 && (
          <Card className="p-12 text-center">
            <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد أصدقاء بعد</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة أصدقاء للتنافس والتعلم معهم</p>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              إضافة صديقك الأول
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
