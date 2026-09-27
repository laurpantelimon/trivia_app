import type { ConfirmOptions } from './confirm';

export type { ConfirmOptions } from './confirm';

/** Web version of `confirmAction`: the browser's own confirm dialog. */
export const confirmAction = ({ title, message }: ConfirmOptions) =>
  Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
