import { getRandomBytes } from 'expo-crypto';

/**
 * Invitation codes are the document ids of staff invitations
 * (`{admins|moderators|observers}/{code}`). Knowing the code is what lets someone
 * open their invitation before they have a login, so codes must be unguessable:
 * 8 characters from a 31-symbol alphabet (~8.5 × 10¹¹ possibilities), drawn from
 * a cryptographically secure source. Ambiguous symbols (0/O, 1/I/L) are left out.
 *
 * Firestore rules recognise invitation ids by their length (`INVITATION_CODE_LENGTH`);
 * active entries are keyed by Auth uids, which are 28 characters.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITATION_CODE_LENGTH = 8;

/** Largest multiple of the alphabet size below 256, for unbiased rejection sampling. */
const UNBIASED_LIMIT = 256 - (256 % ALPHABET.length);

export const generateInvitationCode = () => {
  let code = '';
  while (code.length < INVITATION_CODE_LENGTH) {
    for (const byte of getRandomBytes(INVITATION_CODE_LENGTH * 2)) {
      if (byte >= UNBIASED_LIMIT || code.length === INVITATION_CODE_LENGTH) continue;
      code += ALPHABET[byte % ALPHABET.length];
    }
  }
  return code;
};

/** What the person typed → the stored id: uppercase, without dashes or spaces. */
export const normalizeInvitationCode = (rawCode: string) =>
  rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isInvitationCode = (code: string) =>
  code.length === INVITATION_CODE_LENGTH && [...code].every((char) => ALPHABET.includes(char));

/** `K7PQM2XD` → `K7PQ-M2XD`, easier to read out and type. */
export const formatInvitationCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;
