/**
 * @file Tooltip.tsx
 * @description Skipo BottomStrip-connected hover inspection component.
 * In accordance with Skipo Law 3 (Zero-Floating-Text Law), floating balloon
 * tooltips are eliminated; hover and focus descriptions are projected into
 * the center slot of the AppShell BottomStrip.
 * File size < 200 lines strictly.
 */

import React, { isValidElement, cloneElement } from 'react';
import { useBottomStrip } from '@skipo/ui';

export interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  disabled = false,
}: TooltipProps): React.ReactElement {
  const { setInspectionText } = useBottomStrip();

  const handleMouseEnter = () => {
    if (!disabled && content) {
      setInspectionText(content);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setInspectionText(null);
    }
  };

  if (isValidElement(children)) {
    const childProps = children.props as any;
    return cloneElement(children as React.ReactElement<any>, {
      onMouseEnter: (e: React.MouseEvent) => {
        handleMouseEnter();
        if (childProps.onMouseEnter) childProps.onMouseEnter(e);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        handleMouseLeave();
        if (childProps.onMouseLeave) childProps.onMouseLeave(e);
      },
      onFocus: (e: React.FocusEvent) => {
        handleMouseEnter();
        if (childProps.onFocus) childProps.onFocus(e);
      },
      onBlur: (e: React.FocusEvent) => {
        handleMouseLeave();
        if (childProps.onBlur) childProps.onBlur(e);
      },
      'aria-label': childProps['aria-label'] || content,
    });
  }

  return (
    <div
      className="inline-flex items-center justify-center select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      aria-label={content}
    >
      {children}
    </div>
  );
}

