import { Alert } from 'react-native';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  /** Styles the confirm button as destructive (red on iOS). */
  isDestructive?: boolean;
};

/**
 * Asks the user to confirm an action; resolves `true` if they confirm.
 * Native: an `Alert` with Cancel and the confirm button. (`confirm.web.ts`
 * replaces this on web, where `Alert.alert` does nothing.)
 */
export const confirmAction = ({ title, message, confirmLabel, isDestructive = false }: ConfirmOptions) =>
  new Promise<boolean>((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: isDestructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
