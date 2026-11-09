export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

class ToastState {
  toasts = $state<Toast[]>([]);

  add(message: string, type: ToastType = 'info', title?: string, duration = 4000): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const toast: Toast = { id, type, title, message, duration };
    this.toasts.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  success(message: string, title = 'Success', duration = 4000): string {
    return this.add(message, 'success', title, duration);
  }

  error(message: string, title = 'Error', duration = 5000): string {
    return this.add(message, 'error', title, duration);
  }

  warning(message: string, title = 'Warning', duration = 4000): string {
    return this.add(message, 'warning', title, duration);
  }

  info(message: string, title = 'Information', duration = 4000): string {
    return this.add(message, 'info', title, duration);
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  clear(): void {
    this.toasts = [];
  }
}

export const toastStore = new ToastState();
