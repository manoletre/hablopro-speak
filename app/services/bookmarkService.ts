'use client';

import { db } from '../lib/firebase';
import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { User } from 'firebase/auth';

export type BookmarkType = 'grammar' | 'vocabulary';

export interface BookmarkContent {
  [key: string]: string;
}

export interface Bookmark {
  id?: string;
  userId: string;
  type: BookmarkType;
  content: BookmarkContent;
  createdAt: Timestamp | FieldValue | null;
}

/**
 * Save a grammar or vocabulary item as a bookmark
 */
export const saveBookmark = async (user: User, type: BookmarkType, content: BookmarkContent): Promise<string> => {
  if (!user) throw new Error('User must be authenticated to bookmark items');
  
  try {
    const bookmark: Omit<Bookmark, 'id'> = {
      userId: user.uid,
      type,
      content,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'bookmarks'), bookmark);
    return docRef.id;
  } catch (error) {
    console.error('Error saving bookmark:', error);
    throw error;
  }
};

/**
 * Delete a bookmark by its ID
 */
export const deleteBookmark = async (bookmarkId: string): Promise<void> => {
  try {
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
    await deleteDoc(bookmarkRef);
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
};

/**
 * Fetch all bookmarks for a user
 */
export const getUserBookmarks = async (user: User): Promise<Bookmark[]> => {
  if (!user) return [];
  
  try {
    const bookmarksQuery = query(
      collection(db, 'bookmarks'),
      where('userId', '==', user.uid)
    );
    
    const snapshot = await getDocs(bookmarksQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Bookmark));
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }
};

/**
 * Check if an item is already bookmarked by the user
 */
export const isItemBookmarked = async (
  user: User, 
  type: BookmarkType, 
  contentId: string
): Promise<{isBookmarked: boolean, bookmarkId?: string}> => {
  if (!user) return { isBookmarked: false };
  
  try {
    const bookmarksQuery = query(
      collection(db, 'bookmarks'),
      where('userId', '==', user.uid),
      where('type', '==', type),
      where('content.id', '==', contentId)
    );
    
    const snapshot = await getDocs(bookmarksQuery);
    const isBookmarked = !snapshot.empty;
    
    if (isBookmarked) {
      return { 
        isBookmarked: true, 
        bookmarkId: snapshot.docs[0].id 
      };
    }
    
    return { isBookmarked: false };
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return { isBookmarked: false };
  }
}; 