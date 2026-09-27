import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getDatabase } from '@react-native-firebase/database';
import { getFirestore } from '@react-native-firebase/firestore';

/**
 * Realtime Database instance URL. The Firebase config files were downloaded
 * before the database existed, so they don't carry it; set it explicitly.
 * Copy it from Firebase console → Realtime Database (top of the Data tab).
 */
const REALTIME_DATABASE_URL = 'https://triviaapp-b2533-default-rtdb.europe-west1.firebasedatabase.app';

export const auth = getAuth();
export const firestore = getFirestore();
export const database = getDatabase(getApp(), REALTIME_DATABASE_URL);
