import { toast as sonnerToast } from 'sonner';

export const toast = {
  error:   (msg = 'Something went wrong.')    => sonnerToast.error(msg),
  success: (msg = 'Done!')                    => sonnerToast.success(msg),
  warning: (msg)                              => sonnerToast.warning(msg),
  info:    (msg)                              => sonnerToast.info(msg),
};

export default toast;