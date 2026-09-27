/** Errors the app raises itself, with a `code` like Firebase errors so one message mapper handles both. */

export const QUIZ_ALREADY_ACTIVE_ERROR_CODE = 'app/quiz-already-active';

export class QuizAlreadyActiveError extends Error {
  readonly code = QUIZ_ALREADY_ACTIVE_ERROR_CODE;

  constructor() {
    super('Another quiz is already active');
    this.name = 'QuizAlreadyActiveError';
  }
}
