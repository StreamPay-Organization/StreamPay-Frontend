import { useEffect, useRef } from 'react';
import './ModalDialog.css';

/**
 * Reusable, accessible Modal Dialog component.
 * Supports ARIA roles (dialog / alertdialog), focus management (focus trap & restoration),
 * keyboard navigation (ESC key to dismiss), and field/description associations.
 */
export default function ModalDialog({
  isOpen,
  onClose,
  title,
  titleId = 'modal-dialog-title',
  description,
  descriptionId = 'modal-dialog-desc',
  triggerRef,
  role = 'dialog',
  className = '',
  children,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;

      // Focus modal container or first focusable child
      const focusTimer = setTimeout(() => {
        if (!dialogRef.current) return;
        const focusables = getFocusableElements(dialogRef.current);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === 'Tab' && dialogRef.current) {
          const focusables = getFocusableElements(dialogRef.current);
          if (focusables.length === 0) {
            e.preventDefault();
            return;
          }
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || document.activeElement === dialogRef.current) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);

        // Restore focus on close
        const targetToFocus = triggerRef?.current || previousFocusRef.current;
        if (targetToFocus && typeof targetToFocus.focus === 'function') {
          setTimeout(() => targetToFocus.focus(), 0);
        }
      };
    }
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="modal-backdrop">
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex="-1"
        className={`modal-dialog ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog__header">
          <h2 id={titleId} className="modal-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-dialog__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {description && (
          <p id={descriptionId} className="modal-dialog__description">
            {description}
          </p>
        )}

        <div className="modal-dialog__body">{children}</div>
      </div>
    </div>
  );
}

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}
