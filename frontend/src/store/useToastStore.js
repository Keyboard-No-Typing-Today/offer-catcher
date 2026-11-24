import { create } from 'zustand';

let timer = null;

export const useToastStore = create((set) => ({
  toast: null,
  showToast: (message, tone = 'default') => {
    if (timer) clearTimeout(timer);
    set({ toast: { message, tone, id: Date.now() } });
    timer = setTimeout(() => set({ toast: null }), 2600);
  },
  hideToast: () => set({ toast: null }),
}));

export default useToastStore;
