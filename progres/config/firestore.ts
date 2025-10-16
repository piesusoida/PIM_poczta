import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';

export interface UserDocument {
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
}

export const createUserDocument = async (
  user: User,
): Promise<void> => {
  if (!user) {
    return;
  }

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  //  If user document does not exist, create it
  if (!snapshot.exists()) {
    const { email, photoURL } = user;
    const username = email?.split('@')[0] || 'user';

    const userData: any = {
      email: email || '',
      username: username,
    };

    if (photoURL) {
      userData.photoURL = photoURL;
    }

    try {
      await setDoc(userRef, userData);
      console.log('User document created in Firestore:', user.uid);
    } catch (error) {
      console.error('Error while creating user document:', error);
      throw error;
    }
  } else {
    console.log('User document already exists in Firestore:', user.uid);
  }
};
