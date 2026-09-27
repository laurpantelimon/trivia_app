export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (rawEmail: string) => rawEmail.trim().toLowerCase();

export const isValidEmail = (rawEmail: string) => EMAIL_PATTERN.test(normalizeEmail(rawEmail));

export const isValidPassword = (password: string) => password.length >= PASSWORD_MIN_LENGTH;

export const normalizeDisplayName = (rawName: string) => rawName.trim().replace(/\s+/g, ' ');

export const isValidDisplayName = (rawName: string) => {
  const name = normalizeDisplayName(rawName);
  return name.length >= DISPLAY_NAME_MIN_LENGTH && name.length <= DISPLAY_NAME_MAX_LENGTH;
};
