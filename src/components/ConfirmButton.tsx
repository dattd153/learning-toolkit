import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

interface Props {
  onConfirm: () => void;
  className?: string;
  ariaLabel?: string;
  armedLabel?: string;
  children: ReactNode;
}

/**
 * Two-step delete: first click arms the button for 3s, second click confirms.
 * Replaces window.confirm(), which sandboxed viewers block.
 */
export function ConfirmButton({ onConfirm, className = "iconbtn del", ariaLabel, armedLabel = "Xoá?", children }: Props) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = () => {
    if (armed) {
      clearTimeout(timer.current);
      setArmed(false);
      onConfirm();
      return;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), 3000);
  };

  return (
    <button
      type="button"
      className={`${className}${armed ? " armed" : ""}`}
      aria-label={armed ? "Bấm lần nữa để xác nhận xoá" : ariaLabel}
      onClick={onClick}
    >
      {armed ? (
        <>
          <Icon name="trash" />
          <span>{armedLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
