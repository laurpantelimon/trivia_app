import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getDatabase } from '@react-native-firebase/database';
import { getFirestore } from '@react-native-firebase/firestore';

import { firebaseWebConfig } from '../../../config/firebase/firebaseWebConfig';

/**
 * Web entry for the Firebase instances (Metro picks this file over `index.ts`
 * on web). On iOS/Android, React Native Firebase configures the default app from
 * the native config files; on web there are none, so the default app is
 * initialized here from the web app config. React Native Firebase then runs on
 * top of the Firebase JS SDK, so the rest of the app keeps using the same modular
 * `@react-native-firebase/*` API on every platform.
 */

// `initializeApp` registers the app synchronously (so the getters below work
// right away) and finishes setting it up asynchronously. Fast Refresh re-runs
// this module, so only initialize once.
if (getApps().length === 0) {
  initializeApp(firebaseWebConfig).catch((error: unknown) =>
    console.error('[firebase] web initialization failed', error),
  );
}

export const auth = getAuth();
export const firestore = getFirestore();
export const database = getDatabase(getApp(), firebaseWebConfig.databaseURL);
