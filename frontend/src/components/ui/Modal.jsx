import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useEffect } from 'react';

/** Accessible animated modal. */
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className={`bg-white border border-[#E4EAE6] shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl p-6 text-[#202923]`}
            initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#E4EAE6] pb-3">
              <h3 className="text-lg font-bold text-[#202923]">{title}</h3>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-[#65716A] transition-colors hover:bg-[#F1F7F4] hover:text-[#202923]"><FiX /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
