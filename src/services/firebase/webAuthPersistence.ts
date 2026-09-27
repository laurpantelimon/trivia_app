/**
 * Web only — stands in for React Native Firebase's internal
 * `@react-native-firebase/app/dist/module/internal/web/firebaseAuth` module
 * (swapped in by `metro.config.js` for web bundles).
 *
 * Why: on web, React Native Firebase creates Auth with `initializeAuth(app, {})`,
 * and the Firebase JS SDK treats "no persistence" as in-memory, so every page
 * reload signs the user out. On iOS/Android the session survives restarts.
 * This module re-exports the same Firebase JS SDK API but gives `initializeAuth`
 * browser persistence (IndexedDB, falling back to localStorage) when none is
 * passed, so a web session survives reloads like a native one.
 *
 * App code must not import this (or `firebase/*`) directly; use
 * `@react-native-firebase/*` as everywhere else.
 */
import type { FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  indexedDBLocalPersistence,
  initializeAuth as initializeFirebaseAuth,
  type Dependencies,
} from 'firebase/auth';

// Same surface as the module it replaces.
export * from 'firebase/app';
export * from 'firebase/auth';

const BROWSER_PERSISTENCE = [indexedDBLocalPersistence, browserLocalPersistence];

/** `initializeAuth`, persisting the session in the browser unless told otherwise. */
export const initializeAuth = (app: FirebaseApp, dependencies: Dependencies = {}) =>
  initializeFirebaseAuth(app, {
    ...dependencies,
    persistence: dependencies.persistence ?? BROWSER_PERSISTENCE,
  });
