/**
 * Template for `firebaseWebConfig.ts` (git-ignored), used by the web build
 * (`src/services/firebase/index.web.ts`).
 *
 *   cp config/firebase/firebaseWebConfig.example.ts config/firebase/firebaseWebConfig.ts
 *
 * then fill in the values from Firebase console → Project settings → Your apps
 * → Web app → SDK setup and configuration → Config. `databaseURL` is on the
 * Realtime Database page (top of the Data tab).
 */
export const firebaseWebConfig = {
  apiKey: '',
  authDomain: '<project-id>.firebaseapp.com',
  databaseURL: 'https://<project-id>-default-rtdb.<region>.firebasedatabase.app',
  projectId: '<project-id>',
  storageBucket: '<project-id>.firebasestorage.app',
  messagingSenderId: '',
  appId: '',
};
