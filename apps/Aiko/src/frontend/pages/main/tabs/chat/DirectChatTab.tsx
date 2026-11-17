/**
 * @file DirectChatTab.tsx
 * @description Canonical Direct Chat Tab within Main Page.
 * Conforms to L9 (Lines <= 200).
 */

import React from 'react';
import { DirectChatView } from '../../../../components/views/DirectChatView.js';
import type { DirectChatViewProps } from '../../../../components/views/DirectChatView/types.js';

export interface DirectChatTabProps extends DirectChatViewProps {}

export function DirectChatTab(props: DirectChatTabProps) {
  return <DirectChatView {...props} />;
}

export default DirectChatTab;
