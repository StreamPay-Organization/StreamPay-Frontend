import './ErrorMessage.css';
import Button from './Button.jsx';

/**
 * Inline error banner with an optional retry action.
 * @param {{message?: string, onRetry?: Function}} props
 */
export default function ErrorMessage({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="error-message" role="alert">
      <span className="error-message__icon" role="img" aria-label="Error icon">
        ⚠️
      </span>
      <span className="error-message__text">{message}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
