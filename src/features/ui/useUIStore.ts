import { create } from 'zustand';

type ModalType = 'alert' | 'confirm';

interface UIState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;

  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void, title?: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOpen: false,
  type: 'alert',
  title: '',
  message: '',
  onConfirm: undefined,
  onCancel: undefined,

  showAlert: (message, title = 'Notice') => set({
    isOpen: true,
    type: 'alert',
    title,
    message,
    onConfirm: undefined,
    onCancel: undefined,
  }),

  showConfirm: (message, onConfirm, onCancel, title = 'Confirm Action') => set({
    isOpen: true,
    type: 'confirm',
    title,
    message,
    onConfirm,
    onCancel,
  }),

  closeModal: () => set({ isOpen: false }),
}));
