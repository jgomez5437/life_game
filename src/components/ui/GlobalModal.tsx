'use client';

import { useUIStore } from '@/features/ui/useUIStore';

export default function GlobalModal() {
  const { isOpen, type, title, message, onConfirm, onCancel, closeModal } = useUIStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050508]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#111727] border border-[#2b3a5b] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#1b253c] flex items-center justify-center mx-auto mb-4 border border-[#2b3a5b] shadow-inner">
            <i className={`fas ${type === 'alert' ? 'fa-info-circle text-blue-400' : 'fa-question-circle text-amber-400'} text-3xl`}></i>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3">
          {type === 'confirm' ? (
            <>
              <button 
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl border border-[#2b3a5b] bg-[#131b2f] text-slate-300 font-bold hover:bg-[#1b253c] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
              >
                Confirm
              </button>
            </>
          ) : (
            <button 
              onClick={closeModal}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
            >
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
