/**
 * Browser Desktop & In-App Notification Manager
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

export function showDesktopNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void }
): void {
  if (!isNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });

      if (options?.onClick) {
        notif.onclick = () => {
          window.focus();
          options.onClick!();
          notif.close();
        };
      }
    } catch (err) {
      console.warn('Could not display system desktop notification:', err);
    }
  }
}
