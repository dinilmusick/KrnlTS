'use client';
import React, { forwardRef } from 'react';
import '../../styles/base.css';

export interface BaseTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

export const BaseTextarea = forwardRef<HTMLTextAreaElement, BaseTextareaProps>(({
  className = '',
  ...props
}, ref) => {
  return (
    <textarea ref={ref} className={`skipo-textarea ${className}`} {...props} />
  );
});
BaseTextarea.displayName = 'BaseTextarea';
