import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  deleteField,
  query,
  collection,
  where,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLyelU9R3OEj2YxS-K6pIfgtBGGb-L7Ss",
  authDomain: "afaqplatform.firebaseapp.com",
  projectId: "afaqplatform",
  storageBucket: "afaqplatform.firebasestorage.app",
  messagingSenderId: "683175801278",
  appId: "1:683175801278:web:7733139a097568bc4b49ef",
  measurementId: "G-B74LGVE4MH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions...
export async function loginUser(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signupUser(email: string, password: string, name: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const uid = result.user.uid;
  
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    plan: 'free',
    completedModules: [],
    quizScores: {},
    curriculum: null,
    friends: [],
    friendRequests: [],
    createdAt: serverTimestamp(),
  }, { merge: true });

  // Create public profile for searching
  await setDoc(doc(db, 'public_users', uid), {
    id: uid,
    name,
    email,
    avatar: name.charAt(0).toUpperCase(),
    createdAt: serverTimestamp()
  }, { merge: true });

  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

// Data functions...
export async function getUserData(uid: string) {
  try {
    // Helpful diagnostics when rules deny access
    if (!auth.currentUser) {
      console.warn('[Firestore] getUserData called without auth.currentUser', {
        requestedUid: uid,
        projectId: (db as any)?.app?.options?.projectId,
      });
    } else {
      console.debug('[Firestore] getUserData', {
        requestedUid: uid,
        authUid: auth.currentUser.uid,
        projectId: (db as any)?.app?.options?.projectId,
      });
    }
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("Firestore Fetch Error:", e);
    return null;
  }
}

export async function ensureUserData(uid: string, email: string, name?: string) {
  try {
    await setDoc(doc(db, 'users', uid), {
      name: name || email.split('@')[0] || 'مستخدم',
      email,
      plan: 'free',
      completedModules: [],
      quizScores: {},
      curriculum: null,
      friends: [],
      friendRequests: [],
      createdAt: serverTimestamp(),
    }, { merge: true });

    // Also sync to public_users collection for searchability
    await updatePublicProfile(uid, {
      name: name || email.split('@')[0] || 'مستخدم',
      email,
      avatar: (name || email).charAt(0).toUpperCase()
    });
  } catch (e) {
    console.error('Error ensuring user data:', e);
  }
}

export async function updatePublicProfile(uid: string, profileData: any) {
  try {
    await setDoc(doc(db, 'public_users', uid), {
      id: uid,
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('Error updating public profile:', e);
  }
}

export async function saveStudyPlans(uid: string, plans: object[], email?: string) {
  await setDoc(
    doc(db, 'users', uid),
    {
      studyPlans: plans,
      ...(email ? { email } : {}),
    },
    { merge: true }
  );
}

export async function deleteStudyPlan(uid: string, planId: string, plans: object[], email?: string) {
  await updateDoc(doc(db, 'users', uid), {
    studyPlans: plans,
    [`plans.${planId}`]: deleteField(),
    ...(email ? { email } : {}),
  });
}

export async function clearAllPlanData(uid: string) {
  await updateDoc(doc(db, 'users', uid), {
    studyPlans: deleteField(),
    plans: deleteField(),
    curriculum: deleteField(),
  });
}

export async function saveCurriculum(uid: string, curriculum: object, email?: string) {
  await setDoc(
    doc(db, 'users', uid),
    {
      curriculum,
      ...(email ? { email } : {}),
    },
    { merge: true }
  );
}

export async function saveProgress(
  uid: string,
  planId: string,
  completedModules: string[],
  quizScores: Record<string, number>,
  email?: string
) {
  await setDoc(doc(db, 'users', uid), {
    [`plans.${planId}.completedModules`]: completedModules,
    [`plans.${planId}.quizScores`]: quizScores,
    ...(email ? { email } : {}),
  }, { merge: true });
}

// Friend Management Functions
export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    console.debug('[Firestore] getUserByEmail', {
      email: normalizedEmail,
      authUid: auth.currentUser?.uid ?? null,
      projectId: (db as any)?.app?.options?.projectId,
    });
    const publicUsersRef = collection(db, 'public_users');
    const q = query(publicUsersRef, where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...(userDoc.data() as any)
    };
  } catch (e) {
    console.error('Error searching user by email:', e);
    return null;
  }
}

export async function sendFriendRequest(fromUid: string, toEmail: string) {
  try {
    // Find user by email
    const toUser = await getUserByEmail(toEmail);
    if (!toUser) {
      throw new Error('User not found');
    }

    const toUid = toUser.id;
    
    // Prevent sending friend request to self
    if (fromUid === toUid) {
      throw new Error('Cannot add yourself as friend');
    }

    // Check if already friends
    const fromUserData = await getUserData(fromUid);
    if (fromUserData?.friends?.includes(toUid)) {
      throw new Error('Already friends');
    }

    // Check if request already sent (best-effort; may be absent on public profile)
    if ((toUser as any).friendRequests?.some((req: any) => req.from === fromUid)) {
      throw new Error('Friend request already sent');
    }

    // Send friend request
    await updateDoc(doc(db, 'users', toUid), {
      friendRequests: arrayUnion({
        from: fromUid
      })
    });

    return { success: true, message: 'Friend request sent' };
  } catch (e) {
    console.error('Error sending friend request:', e);
    throw e;
  }
}

export async function acceptFriendRequest(uid: string, fromUid: string) {
  try {
    // Add each other to friends lists
    await updateDoc(doc(db, 'users', uid), {
      friends: arrayUnion(fromUid),
      friendRequests: arrayRemove({
        from: fromUid
      })
    });

    await updateDoc(doc(db, 'users', fromUid), {
      friends: arrayUnion(uid)
    });

    return { success: true, message: 'Friend request accepted' };
  } catch (e) {
    console.error('Error accepting friend request:', e);
    throw e;
  }
}

export async function rejectFriendRequest(uid: string, fromUid: string) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      friendRequests: arrayRemove({
        from: fromUid
      })
    });

    return { success: true, message: 'Friend request rejected' };
  } catch (e) {
    console.error('Error rejecting friend request:', e);
    throw e;
  }
}

export async function removeFriend(uid: string, friendUid: string) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      friends: arrayRemove(friendUid)
    });

    await updateDoc(doc(db, 'users', friendUid), {
      friends: arrayRemove(uid)
    });

    return { success: true, message: 'Friend removed' };
  } catch (e) {
    console.error('Error removing friend:', e);
    throw e;
  }
}

export async function getUserPublicProfile(uid: string) {
  try {
    const userData = await getUserData(uid);
    if (!userData) return null;

    // Calculate stats from study data
    const studyPlans = userData.studyPlans || [];
    const totalCompletedLessons = studyPlans.reduce((sum: number, plan: any) => {
      return sum + (plan.completedModules?.length || 0);
    }, 0);

    const allScores = studyPlans.flatMap((plan: any) => Object.values(plan.quizScores || {})) as number[];
    const averageAccuracy = allScores.length > 0 
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    // Calculate XP (1 XP per lesson completed, bonus for accuracy)
    const xp = totalCompletedLessons * 100 + (averageAccuracy > 80 ? totalCompletedLessons * 50 : 0);

    // Determine level based on completion
    let level = 'مبتدئ';
    if (totalCompletedLessons > 20) level = 'متقدم';
    else if (totalCompletedLessons > 10) level = 'متوسط';

    return {
      id: uid,
      name: userData.name || 'مستخدم',
      email: userData.email,
      avatar: userData.avatar || userData.name?.charAt(0) || 'م',
      level,
      completedLessons: totalCompletedLessons,
      accuracy: averageAccuracy,
      xp,
      createdAt: userData.createdAt,
    };
  } catch (e) {
    console.error('Error getting user public profile:', e);
    return null;
  }
}

export async function getFriendsList(uid: string) {
  try {
    const userData = await getUserData(uid);
    if (!userData || !userData.friends) return [];

    const friendIds = userData.friends;
    const friendsData: any[] = [];

    for (const friendId of friendIds) {
      const friendProfile = await getUserPublicProfile(friendId);
      if (friendProfile) {
        friendsData.push(friendProfile);
      }
    }

    return friendsData;
  } catch (e) {
    console.error('Error getting friends list:', e);
    return [];
  }
}

export async function getFriendRequests(uid: string) {
  try {
    const userData = await getUserData(uid);
    if (!userData || !userData.friendRequests) return [];

    const requests: any[] = [];
    for (const req of userData.friendRequests) {
      const fromUser = await getUserPublicProfile(req.from);
      if (fromUser) {
        requests.push({
          ...req,
          fromUser
        });
      }
    }

    return requests;
  } catch (e) {
    console.error('Error getting friend requests:', e);
    return [];
  }
}

export { onAuthStateChanged, type FirebaseUser };