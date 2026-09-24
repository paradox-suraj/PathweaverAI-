import { toast as sonnerToast } from 'sonner';

export function useToast() {
  const toast = (options: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
    if (options.variant === 'destructive') {
      sonnerToast.error(options.title, { description: options.description });
    } else {
      sonnerToast.success(options.title, { description: options.description });
    }
  };

  return { toast };
}
