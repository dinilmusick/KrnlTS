'use client';
import React, { forwardRef, cloneElement, isValidElement } from 'react';
import { useBottomStrip } from '../bottom-strip/BottomStripContext.js';

export interface BaseTooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode;
  description?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

/**
 * BaseTooltip — Redirects hover/focus inspection text to the bottom strip center.
 * Zero floating tooltip bubbles rendered in the DOM.
 */
export const BaseTooltip = forwardRef<HTMLDivElement, BaseTooltipProps>(({
  content,
  description,
  children,
  className = '',
  ...props
}, ref) => {
  const { setInspectionText } = useBottomStrip();
  const textContent = typeof content === 'string'
    ? content
    : (React.Children.toArray(content).filter(c => typeof c === 'string').join(' ') || String(content ?? ''));

  const handleMouseEnter = (e: React.MouseEvent) => {
    setInspectionText(textContent, description);
    if (props.onMouseEnter) props.onMouseEnter(e as any);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    setInspectionText(null, null);
    if (props.onMouseLeave) props.onMouseLeave(e as any);
  };

  const handleFocus = (e: React.FocusEvent) => {
    setInspectionText(textContent, description);
    if (props.onFocus) props.onFocus(e as any);
  };

  const handleBlur = (e: React.FocusEvent) => {
    setInspectionText(null, null);
    if (props.onBlur) props.onBlur(e as any);
  };

  if (isValidElement(children)) {
    const childProps = children.props as any;
    return cloneElement(children as React.ReactElement<any>, {
      onMouseEnter: (e: React.MouseEvent) => {
        handleMouseEnter(e);
        if (childProps.onMouseEnter) childProps.onMouseEnter(e);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        handleMouseLeave(e);
        if (childProps.onMouseLeave) childProps.onMouseLeave(e);
      },
      onFocus: (e: React.FocusEvent) => {
        handleFocus(e);
        if (childProps.onFocus) childProps.onFocus(e);
      },
      onBlur: (e: React.FocusEvent) => {
        handleBlur(e);
        if (childProps.onBlur) childProps.onBlur(e);
      },
      'aria-label': childProps['aria-label'] || textContent,
    });
  }

  return (
    <div
      ref={ref}
      className={`skipo-inspection-target ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={textContent}
      style={{ display: 'inline-flex' }}
      {...props}
    >
      {children}
    </div>
  );
});

BaseTooltip.displayName = 'BaseTooltip';
