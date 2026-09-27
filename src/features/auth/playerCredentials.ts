import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import { normalizeDisplayName } from './validation';

/**
 * Name-only players: the Firebase email + password are derived from the player's
 * name, so entering the same name always yields the same account.
 *
 * ⚠️ Changing any constant below changes every player's credentials, and every
 * existing name-only player would lose access to their account.
 */
const CREDENTIALS_NAMESPACE = 'triviaapp:player:v1';
/** example.com is reserved (RFC 2606): these addresses can never receive mail. */
const PLAYER_EMAIL_DOMAIN = 'players.trivia.example.com';
const EMAIL_ID_HEX_LENGTH = 24;
const PASSWORD_HEX_LENGTH = 32;

type PlayerCredentials = {
  email: string;
  password: string;
};

/** "  Alex  Smith " and "alex smith" are the same player. */
export const toPlayerKey = (rawName: string) => normalizeDisplayName(rawName).toLowerCase();

const hashHex = (purpose: 'email' | 'password', playerKey: string) =>
  bytesToHex(sha256(utf8ToBytes(`${CREDENTIALS_NAMESPACE}:${purpose}:${playerKey}`)));

export const derivePlayerCredentials = (rawName: string): PlayerCredentials => {
  const playerKey = toPlayerKey(rawName);
  return {
    email: `player-${hashHex('email', playerKey).slice(0, EMAIL_ID_HEX_LENGTH)}@${PLAYER_EMAIL_DOMAIN}`,
    password: hashHex('password', playerKey).slice(0, PASSWORD_HEX_LENGTH),
  };
};
