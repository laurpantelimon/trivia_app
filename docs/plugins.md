# Trivia App — Third-party libraries

Every third-party package this project depends on, what it is for, and the rules for adding new ones. Versions match `package.json` (Expo SDK 57). How the pieces fit together is in [`architecture.md`](./architecture.md).

---

## 1. Stack decisions

Each concern has **one** library. Do not add a second one for the same job.

| Concern | Library | Rule |
|---|---|---|
| **State management** | **Redux Toolkit** (`@reduxjs/toolkit`) + **React Redux** (`react-redux`) | All shared app state lives in Redux slices (`src/features/*/…Slice.ts`), wired up in `src/store`. Use the typed hooks `useAppDispatch` / `useAppSelector` from `@/store/hooks`. Store only plain, serialisable data. Never put Firebase `DataSnapshot`, `Reference` or `User` objects in the store. Local, screen-only UI state (an input's value) stays in `useState`. |
| **Anything external** (auth, data, backend, config) | **Firebase** via **React Native Firebase** (`@react-native-firebase/*`) | Firebase is the only backend. No REST clients (axios, fetch wrappers), no other BaaS, and not the Firebase JS SDK (`firebase`). Always use the **modular API** (`getAuth`, `getDatabase`, `ref`, `onValue`, `httpsCallable`, …), because the namespaced API is deprecated. Firebase instances are created once in `src/services/firebase`. |
| **Navigation** | **Expo Router** (`expo-router`) | File-based routes in `src/app/`, navigators in `_layout.tsx`, `Stack.Protected` for auth gating. Import `Link`, `router`, `Stack` and `useLocalSearchParams` from `expo-router`. Do not install or import `@react-navigation/*` directly. If a React Navigation API is needed, import it from `expo-router/react-navigation`. |

---

## 2. Dependencies

### 2.1 State management

| Package | Version | Used for |
|---|---|---|
| `@reduxjs/toolkit` | ^2.12.0 | `configureStore`, `createSlice`. Slices: `auth` (user session: sign-in state, current user, request status and errors), `game` (the active quiz synced from RTDB), `quiz` (staff quiz list from Firestore). |
| `react-redux` | ^9.3.0 | `<Provider>` in the root layout, typed `useDispatch` / `useSelector` hooks. |

### 2.2 Firebase (React Native Firebase v26)

RNFirebase has native code, so the app runs in a **development build**, not Expo Go. Native config comes from config plugins in `app.json`.

| Package | Version | Used for | Status |
|---|---|---|---|
| `@react-native-firebase/app` | ^26.4.0 | Core module, required by all the others. Config plugin reads `config/firebase/*`. | In use |
| `@react-native-firebase/auth` | ^26.4.0 | Email + password sign-in, sign-up, password reset, the session listener, and staff roles via the `role` custom claim (`features/auth`). | In use |
| `@react-native-firebase/database` | ^26.4.0 | Realtime Database: only the live quiz `activeQuiz/` (meta, players, answers, leaderboard) and the one-quiz lock `joinedQuiz/{uid}` (`features/game`). Later: presence, server clock offset. | In use |
| `@react-native-firebase/firestore` | ^26.4.0 | Durable data: `players/{uid}` entries written at player creation (`features/auth/playerDocuments.ts`), quizzes and their results (`features/quiz`); later questions and answer keys. | In use |
| `@react-native-firebase/functions` | ^26.4.0 | Calling Cloud Functions (`createRoom`, `joinRoom`, `startGame`, `nextQuestion`, `closeQuestion`, `endGame`) in `europe-west1`. | Planned |
| `@react-native-firebase/remote-config` | ^26.4.0 | Client tunables and feature flags (architecture §9). | Planned |
| `@react-native-firebase/app-check` | ^26.4.0 | Blocks non-app clients from functions and RTDB. | Planned |

Server-side packages (`firebase-functions`, `firebase-admin`) will live in the separate `functions/` workspace, not in the app's `package.json`.

### 2.3 Navigation

| Package | Version | Used for |
|---|---|---|
| `expo-router` | ~57.0.23 | Routing, root `Stack`, auth guard, deep links (`triviaapp://join/{CODE}`), typed routes. |
| `expo-linking` | ~57.0.11 | Deep-link and URL handling used by Expo Router. Will also build invite links. |
| `react-native-screens` | ~4.26.0 | Native screen containers under Expo Router's native stack. |
| `react-native-safe-area-context` | ~5.7.0 | `SafeAreaView` / insets on every screen. |
| `react-native-gesture-handler` | ~2.32.0 | Native gestures (swipe-back, sheets), required by the router. |

### 2.4 Expo SDK and platform modules

| Package | Version | Used for | Status |
|---|---|---|---|
| `expo` | ~57.0.25 | SDK runtime and CLI. | In use |
| `expo-dev-client` | ~57.0.19 | Development builds (needed for RNFirebase). | In use |
| `expo-build-properties` | ^57.0.22 | Sets `useFrameworks: "dynamic"` on iOS, which RNFirebase needs. | In use |
| `expo-splash-screen` | ~57.0.9 | Keeps the splash screen visible until the Firebase session is restored. | In use |
| `expo-constants` | ~57.0.19 | App and build constants (app version for the force-update gate). | Planned |
| `expo-status-bar` | ~57.0.1 | Status-bar style. | In use |
| `expo-system-ui` | ~57.0.4 | Root background colour and `userInterfaceStyle` support. | In use (config) |
| `expo-font` | ~57.0.4 | Font loading (used through `@expo-google-fonts/fredoka`'s `useFonts`). | In use |
| `@expo-google-fonts/fredoka` | ^0.4.1 | Fredoka, the rounded font for headings and buttons (`GameFonts` in `constants/theme.ts`; body text uses the system font), loaded in the root layout before the splash hides. | In use |
| `expo-image` | ~57.0.5 | Images (template components). | Template |
| `expo-symbols` | ~57.0.3 | SF Symbols (iOS) / Material Symbols (Android) for button, card and header icons. | In use |
| `expo-web-browser` | ~57.0.3 | In-app browser for external links. | Template |
| `expo-device` | ~57.0.2 | Device info. | Unused |
| `expo-glass-effect` | ~57.0.4 | iOS 26 Liquid Glass views. | Unused |
| `@expo/ui` | ~57.0.20 | Native SwiftUI / Jetpack Compose components (sheets, pickers, switches). Use this before reaching for a community UI library. | Available |

### 2.4.1 Utilities

| Package | Version | Used for | Status |
|---|---|---|---|
| `expo-crypto` | ~57.0.3 | Cryptographically secure random bytes for staff invitation codes (`features/staff/invitationCode.ts`). Native module: needs a dev-client rebuild. | In use |
| `@noble/hashes` | ^2.4.0 | SHA-256 for deriving name-only player credentials (`features/auth/playerCredentials.ts`). Pure JS, audited, no native rebuild. | In use |

### 2.5 Animation

| Package | Version | Used for |
|---|---|---|
| `react-native-reanimated` | 4.5.1 | UI-thread animations: logo tile and code-tile entrances (respects Reduce Motion). The countdown bar is driven from `startsAt` / `endsAt` (architecture §6.5). |
| `react-native-worklets` | 0.10.1 | Worklet runtime used by Reanimated 4. |

### 2.6 React and React Native core

| Package | Version | Used for |
|---|---|---|
| `react` | 19.2.3 | React (React Compiler is enabled in `app.json`). |
| `react-native` | 0.86.3 | React Native. |
| `react-dom` | 19.2.3 | Web target. |
| `react-native-web` | ~0.21.0 | Web target, deployed to Firebase Hosting. React Native Firebase runs there on the Firebase JS SDK (initialized in `services/firebase/index.web.ts`); `firebase` is its internal dependency, never imported by app code; the one exception is `services/firebase/webAuthPersistence.ts`, which `metro.config.js` swaps in to give web Auth browser persistence. |
| `@react-native/new-app-screen` | 0.87.1 | Leftover from the RN template. Unused and safe to remove. |

### 2.7 Dev dependencies

| Package | Version | Used for |
|---|---|---|
| `typescript` | ~6.0.3 | Type checking (`npx tsc --noEmit`). |
| `@types/react` | ~19.2.2 | React types. |

**Status key:** *In use*: imported by app code or config today. *Planned*: required by `architecture.md`, not wired yet. *Available*: installed and allowed, not used yet. *Template*: only used by leftover Expo template components. *Unused*: candidates for removal.

---

## 3. Adding a library

1. Check whether the three stack choices above, an Expo module or `@expo/ui` already cover it. Most needs are covered.
2. Install with `npx expo install <package>`, never `npm` / `yarn add`, so the version matches the Expo SDK.
3. If it has native code, add its config plugin to `app.json` (never edit `ios/` or `android/` by hand) and rebuild the dev client.
4. Add a row to this file with its purpose and status.

**Not allowed:** other state libraries (Zustand, MobX, Jotai, React Query as a state store), other backends or HTTP clients, the Firebase JS SDK, `@react-navigation/*` as a direct dependency, and Firebase Dynamic Links (the service has been shut down).
