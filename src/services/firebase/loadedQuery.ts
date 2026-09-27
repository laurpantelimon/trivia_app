import { getDocs } from '@react-native-firebase/firestore';

/** A Firestore query (collection or filtered/ordered query). */
export type FirestoreQuery = Parameters<typeof getDocs>[0];

/** One document of a query result, as plain data for parsing. */
export type LoadedDocument = { id: string; data: unknown };

/**
 * Staff screens don't follow Firestore live: a query is read once when the
 * screen opens and again after this device writes to Firestore
 * (`refreshLoadedQueries`), so your own changes show up at once. Changes made
 * elsewhere appear the next time the screen opens. The same on every platform
 * (and on web, React Native Firebase's Firestore Lite has no listeners anyway).
 */
const openQueries = new Set<() => void>();

/** Reads `firestoreQuery` now and after each local write, until the returned function is called. */
export const loadQuery = (
  firestoreQuery: FirestoreQuery,
  onDocuments: (documents: LoadedDocument[]) => void,
  onError: (error: Error) => void,
): (() => void) => {
  let isOpen = true;
  let latestRead = 0;

  const read = () => {
    latestRead += 1;
    const thisRead = latestRead;
    getDocs(firestoreQuery)
      .then((snapshot) => {
        // Ignore answers that arrive after a newer read or after closing.
        if (!isOpen || thisRead !== latestRead) return;
        onDocuments(snapshot.docs.map((document) => ({ id: document.id, data: document.data() })));
      })
      .catch((error: unknown) => {
        if (isOpen) onError(error instanceof Error ? error : new Error(String(error)));
      });
  };

  read();
  openQueries.add(read);

  return () => {
    isOpen = false;
    openQueries.delete(read);
  };
};

/** Re-reads every open query; call after writing to Firestore. */
export const refreshLoadedQueries = () => openQueries.forEach((read) => read());
