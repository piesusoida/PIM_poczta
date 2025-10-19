import { doc, setDoc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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

export const getExerciseNames = async (userId?: string): Promise<string[]> => {
  try {
    const exerciseNamesRef = collection(db, 'exercise_names');
    const snapshot = await getDocs(exerciseNamesRef);
    
    const allNames: string[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.names && Array.isArray(data.names)) {
        allNames.push(...data.names);
      }
    });
    
    // Add custom exercise names if userId is provided
    if (userId) {
      const customNames = await getCustomExerciseNames(userId);
      allNames.push(...customNames);
    }
    
    // Remove duplicates and sort alphabetically
    return [...new Set(allNames)].sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  } catch (error) {
    console.error('Error fetching exercise names:', error);
    return [];
  }
};

export const getCustomExerciseNames = async (userId: string): Promise<string[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.custom_exercise_names || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching custom exercise names:', error);
    return [];
  }
};

export const addCustomExerciseName = async (userId: string, exerciseName: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const customNames = data.custom_exercise_names || [];
      
      // Only add if it doesn't exist already
      if (!customNames.includes(exerciseName)) {
        await updateDoc(userRef, {
          custom_exercise_names: arrayUnion(exerciseName)
        });
        console.log('Custom exercise name added:', exerciseName);
      }
    } else {
      // Create user document with custom exercise name
      await setDoc(userRef, {
        custom_exercise_names: [exerciseName]
      }, { merge: true });
      console.log('User document created with custom exercise name:', exerciseName);
    }
  } catch (error) {
    console.error('Error adding custom exercise name:', error);
    throw error;
  }
};

export interface Exercise {
  name: string;
  weight: string;
  reps: string;
}

export interface WorkoutNote {
  title: string;
  date: Date;
  exercises: Exercise[];
  userId: string;
}

export const saveWorkoutNote = async (userId: string, noteData: Omit<WorkoutNote, 'userId'>): Promise<string> => {
  try {
    const notesRef = collection(db, 'notes');
    const noteDoc = await addDoc(notesRef, {
      ...noteData,
      userId,
      createdAt: serverTimestamp()
    });
    
    // Add note ID to user's notes array
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notes: arrayUnion(noteDoc.id)
    });
    
    return noteDoc.id;
  } catch (error) {
    console.error('Error saving workout note:', error);
    throw error;
  }
};

export interface WorkoutNoteWithId extends WorkoutNote {
  id: string;
  createdAt?: Timestamp;
}

export const getUserWorkoutNotes = async (userId: string): Promise<WorkoutNoteWithId[]> => {
  try {
    const notesRef = collection(db, 'notes');
    const snapshot = await getDocs(notesRef);
    
    const notes: WorkoutNoteWithId[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId) {
        notes.push({
          id: doc.id,
          title: data.title,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          exercises: data.exercises || [],
          userId: data.userId,
          createdAt: data.createdAt
        });
      }
    });
    
    // Sort by date, newest first
    notes.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return notes;
  } catch (error) {
    console.error('Error fetching user workout notes:', error);
    throw error;
  }
};

export const deleteWorkoutNote = async (userId: string, noteId: string): Promise<void> => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await deleteDoc(noteRef);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notes: arrayRemove(noteId)
    });
  } catch (error) {
    console.error('Error deleting workout note:', error);
    throw error;
  }
};

export const updateWorkoutNote = async (noteId: string, noteData: Omit<WorkoutNote, 'userId'>): Promise<void> => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      title: noteData.title,
      date: noteData.date,
      exercises: noteData.exercises
    });
    
  } catch (error) {
    console.error('Error updating workout note:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<{ username: string; email: string } | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        username: userData.username || '',
        email: userData.email || '',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUsername = async (userId: string, username: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      username: username.trim(),
    });
  } catch (error) {
    console.error('Error updating username:', error);
    throw error;
  }
};
