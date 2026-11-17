/**
 * @file useCrossSectionDnd.ts
 * @description Hook managing multi-container drag-and-drop orchestration across service sections.
 * Supports move and Cmd/Ctrl-drag duplication across multiple groups.
 * File size < 200 lines strictly.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  CollisionDetection,
  pointerWithin,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';

interface UseCrossSectionDndProps {
  accounts: ServiceAccount[];
  updateAccount: (account: ServiceAccount) => Promise<void> | void;
  reorderAccounts: (reordered: ServiceAccount[]) => void;
}

export function useCrossSectionDnd({
  accounts,
  updateAccount,
  reorderAccounts,
}: UseCrossSectionDndProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCopyMode, setIsCopyMode] = useState<boolean>(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') setIsCopyMode(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') setIsCopyMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeId) || null,
    [accounts, activeId]
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const tileCollision = pointerCollisions.find(
        (c) =>
          c.data?.droppableContainer?.data?.current?.type === 'tile' ||
          !String(c.id).startsWith('section-')
      );
      if (tileCollision) return [tileCollision];
      return pointerCollisions;
    }
    return closestCorners(args);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const mouseEvent = event.activatorEvent as MouseEvent | undefined;
    if (mouseEvent?.metaKey || mouseEvent?.ctrlKey) setIsCopyMode(true);
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const copyTriggered = isCopyMode || Boolean(
        (event.activatorEvent as MouseEvent)?.metaKey || (event.activatorEvent as MouseEvent)?.ctrlKey
      );
      setActiveId(null);
      setIsCopyMode(false);
      if (!over) return;

      const activeAccountId = String(active.id);
      const overId = String(over.id);
      const activeAccount = accounts.find((a) => a.id === activeAccountId);
      if (!activeAccount) return;

      const sourceGroupId = (active.data.current?.groupId as string) || activeAccount.groupId || activeAccount.groupIds?.[0];
      const targetGroupId = (over.data.current?.groupId as string) || (overId.startsWith('section-') ? overId.replace('section-', '') : null);
      if (!sourceGroupId || !targetGroupId) return;

      if (sourceGroupId !== targetGroupId) {
        const prevGroupIds = activeAccount.groupIds?.length ? activeAccount.groupIds : (activeAccount.groupId ? [activeAccount.groupId] : []);

        if (copyTriggered) {
          // Copy / Duplicate representation: retain source group, add target group
          const newGroupIds = prevGroupIds.includes(targetGroupId) ? prevGroupIds : [...prevGroupIds, targetGroupId];
          const updatedAccount = new ServiceAccount({
            ...activeAccount.toJSON(),
            groupId: targetGroupId,
            groupIds: newGroupIds,
          });
          const updatedAccounts = accounts.map((a) => (a.id === activeAccountId ? updatedAccount : a));
          reorderAccounts(updatedAccounts);
          await updateAccount(updatedAccount);
          return;
        }

        // Standard move: remove source group, add target group
        const filtered = prevGroupIds.filter((gid) => gid !== sourceGroupId);
        if (!filtered.includes(targetGroupId)) filtered.push(targetGroupId);
        const finalGroupIds = filtered.length > 0 ? filtered : [targetGroupId];
        const updatedAccount = new ServiceAccount({
          ...activeAccount.toJSON(),
          groupId: targetGroupId,
          groupIds: finalGroupIds,
        });

        const withoutActive = accounts.filter((a) => a.id !== activeAccountId);
        const newAccounts = [...withoutActive];
        if (over.data.current?.type === 'tile') {
          const targetIndex = newAccounts.findIndex((a) => a.id === overId);
          targetIndex !== -1 ? newAccounts.splice(targetIndex, 0, updatedAccount) : newAccounts.push(updatedAccount);
        } else {
          let lastIndex = -1;
          for (let i = newAccounts.length - 1; i >= 0; i--) {
            const accGids = newAccounts[i].groupIds?.length ? newAccounts[i].groupIds : (newAccounts[i].groupId ? [newAccounts[i].groupId] : []);
            if (accGids.includes(targetGroupId)) { lastIndex = i; break; }
          }
          lastIndex !== -1 ? newAccounts.splice(lastIndex + 1, 0, updatedAccount) : newAccounts.push(updatedAccount);
        }

        reorderAccounts(newAccounts);
        await updateAccount(updatedAccount);
        return;
      }

      // Same-Section reorder
      if (activeAccountId !== overId && over.data.current?.type === 'tile') {
        const oldIndex = accounts.findIndex((a) => a.id === activeAccountId);
        const newIndex = accounts.findIndex((a) => a.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderAccounts(arrayMove(accounts, oldIndex, newIndex));
        }
      }
    },
    [accounts, isCopyMode, reorderAccounts, updateAccount]
  );

  return {
    sensors,
    activeId,
    activeAccount,
    isCopyMode,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
  };
}
