import { doc, getDoc, serverTimestamp, setDoc } from '@react-native-firebase/firestore';

import { firestore } from '@/services/firebase';
import { isUserRole, type NewPlayerEntryDocument, type PlayerEntry, type UserRole } from '@/types/account';
import { withTimeout } from '@/utils/withTimeout';

/** Firestore `players/{uid}`: one entry per player-page account. */
export const PLAYERS_COLLECTION = 'players';

/**
 * A Firestore write only resolves once the server acknowledges it. If the server
 * never answers (database not created, no network) it would wait forever, so
 * give up after this long and report an error instead.
 */
const FIRESTORE_TIMEOUT_MS = 10_000;

const playerRef = (id: string) => doc(firestore, PLAYERS_COLLECTION, id);

type NewPlayer = Pick<PlayerEntry, 'id' | 'displayName'>;

/** Creates the player's entry `players/{uid}` (write-once, enforced by rules). */
export const createPlayerEntry = ({ id, displayName }: NewPlayer) => {
  const entry: NewPlayerEntryDocument = {
    id,
    displayName,
    role: 'player',
    createdAt: serverTimestamp(),
  };
  return withTimeout(setDoc(playerRef(id), entry), FIRESTORE_TIMEOUT_MS, 'Creating player entry');
};

/** The role stored in the account's own player entry, or `null` when it has none. */
export const getPlayerEntryRole = async (id: string): Promise<UserRole | null> => {
  const snapshot = await withTimeout(getDoc(playerRef(id)), FIRESTORE_TIMEOUT_MS, 'Reading player entry');
  const role: unknown = snapshot.data()?.role;
  return isUserRole(role) ? role : null;
};

/**
 * Creates the entry for a player-page account that has none (accounts from
 * before `players/{uid}`, or a creation interrupted after the Auth account).
 */
export const ensurePlayerEntry = async (player: NewPlayer) => {
  if ((await getPlayerEntryRole(player.id)) !== null) return;
  await createPlayerEntry(player);
};
