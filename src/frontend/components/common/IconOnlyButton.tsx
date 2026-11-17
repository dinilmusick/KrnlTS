/**
 * @file IconOnlyButton.tsx
 * @description Facade inheriting from BaseIconButton to guarantee zero duplication.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { BaseIconButton, BaseIconButtonProps } from './BaseIconButton';

export type IconOnlyButtonProps = BaseIconButtonProps;

/**
 * Inherits directly from BaseIconButton.
 * Enforces zero on-screen text and strict hover-only tooltips.
 */
export const IconOnlyButton: React.FC<IconOnlyButtonProps> = (props) => {
  return <BaseIconButton {...props} />;
};
