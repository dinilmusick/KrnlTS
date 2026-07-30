import React from 'react';

export interface KrnlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const KrnlButton: React.FC<KrnlButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  return (
    <button className={`krnl-btn krnl-btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
};
