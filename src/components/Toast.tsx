import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onClose: () => void;
}

const styles = {
  success: {
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    iconColor: "text-green-600",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    iconColor: "text-red-600",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    iconColor: "text-orange-600",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    iconColor: "text-blue-600",
  },
};

export default function Toast({
  type = "info",
  title,
  message,
  onClose,
}: ToastProps) {
  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className="fixed right-5 top-24 z-[9999] w-[calc(100%-40px)] max-w-md animate-fade-in-up">
      <div
        className={`flex gap-3 rounded-2xl border ${style.border} ${style.bg} p-4 shadow-2xl`}
      >
        <Icon className={`mt-0.5 shrink-0 ${style.iconColor}`} size={22} />

        <div className="flex-1">
          <h3 className={`text-sm font-black ${style.text}`}>{title}</h3>
          {message && (
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              {message}
            </p>
          )}
        </div>

        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}