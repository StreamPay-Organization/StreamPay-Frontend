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

  return React.createElement(
    'label',
    {
      className: ['field', className].filter(Boolean).join(' '),
      htmlFor: id,
    },
    label
      ? React.createElement('span', { className: 'field__label' }, label)
      : null,
    content,
    error
      ? React.createElement(
          'span',
          { className: 'field__error', role: 'alert' },
          error
        )
      : null
  );
}
