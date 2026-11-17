'use client';
import React, { forwardRef } from 'react';
import '../../styles/containers.css';

export interface PageContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  paddingScale?: 'sm' | 'md' | 'lg';
}

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(({
  title,
  subtitle,
  actions,
  paddingScale = 'md',
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`skipo-page-container skipo-page-container--${paddingScale} ${className}`} {...props}>
      <header className="skipo-page-header">
        <div>
          {title && <h1>{title}</h1>}
          {subtitle && <h2>{subtitle}</h2>}
        </div>
        {actions && <div className="skipo-page-actions">{actions}</div>}
      </header>
      <main className="skipo-page-content">{children}</main>
    </div>
  );
});
PageContainer.displayName = 'PageContainer';
