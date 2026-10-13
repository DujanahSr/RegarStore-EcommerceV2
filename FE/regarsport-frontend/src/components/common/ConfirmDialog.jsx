import { useEffect, useRef } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

const TONES = {
  danger: {
    iconBox: "bg-rose-50 border-rose-100 text-rose-600",
    button: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-400",
    Icon: AlertTriangle,
  },
  default: {
    iconBox: "bg-emerald-50 border-emerald-100 text-emerald-700",
    button: "bg-[#162018] hover:bg-black focus-visible:ring-[#162018]/40",
    Icon: HelpCircle,
  },
};

/**
 * Dialog konfirmasi (pengganti window.confirm). Esc / klik backdrop / Batal = batal.
 * Fokus awal di Batal, Tab berputar di dalam dialog, fokus kembali ke elemen pemicu saat ditutup.
 */
export default function ConfirmDialog({ options, onCancel, onConfirm }) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const open = Boolean(options);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Tab") {
        const focusables = [cancelRef.current, confirmRef.current];
        const idx = focusables.indexOf(document.activeElement);
        e.preventDefault();
        focusables[(idx + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length]?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  const tone = TONES[options.tone] || TONES.default;
  const Icon = options.icon || tone.Icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] motion-safe:animate-fade-in" onClick={onCancel} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={options.message ? "confirm-desc" : undefined}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-stone-900 shadow-2xl border border-stone-200 motion-safe:animate-fade-in-up"
      >
        <div className="flex items-start gap-4">
          <div className={`shrink-0 rounded-xl border p-2.5 ${tone.iconBox}`}>
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-condensed text-xl font-bold uppercase tracking-wide">
              {options.title}
            </h2>
            {options.message && (
              <p id="confirm-desc" className="mt-1 text-sm text-stone-500 break-words">
                {options.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162018]/40 transition cursor-pointer"
          >
            {options.cancelLabel || "Batal"}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 transition cursor-pointer ${tone.button}`}
          >
            {options.confirmLabel || "Ya, Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
