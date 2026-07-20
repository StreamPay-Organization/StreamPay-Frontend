import React from 'react';

export default function FormField({
  label,
  error,
  children,
  id,
  className = '',
}) {
  const content = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || id,
      })
    : children;

  return (
    <label className={['field', className].filter(Boolean).join(' ')} htmlFor={id}>
      {label ? <span className="field__label">{label}</span> : null}
      {content}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
