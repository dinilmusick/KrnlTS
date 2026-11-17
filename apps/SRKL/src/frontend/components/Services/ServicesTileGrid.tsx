/**
 * @file ServicesTileGrid.tsx
 * @description Sortable grid for Service Tiles inside a section group.
 * File size < 200 lines strictly.
 */

import React from 'react';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceRegistry } from '@/libraries/services/registry';
import { ServiceTileCard } from './ServiceTileCard';
import { ServiceAddPlusTile } from './ServiceAddPlusTile';

interface ServicesTileGridProps {
  groupId: string;
  accounts: ServiceAccount[];
  registry: ServiceRegistry;
  onEdit: (account: ServiceAccount) => void;
  onOpenEndpoints: (account: ServiceAccount) => void;
  onExport: (account: ServiceAccount) => void;
  onDelete: (accountId: string) => void;
  onSync: (accountId: string) => void;
  onAddClick: () => void;
  onImportClick: () => void;
}

export function ServicesTileGrid({
  groupId,
  accounts,
  registry,
  onEdit,
  onOpenEndpoints,
  onExport,
  onDelete,
  onSync,
  onAddClick,
  onImportClick,
}: ServicesTileGridProps): React.ReactElement {
  const accountIds = accounts.map((a) => a.id);

  return (
    <div id={`services-tile-container-${groupId}`} className="w-full">
      <SortableContext items={accountIds} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-5 items-start justify-start">
          {accounts.map((account) => {
            const definition = registry.get(account.serviceId)?.definition;
            return (
              <ServiceTileCard
                key={account.id}
                account={account}
                definition={definition}
                groupId={groupId}
                onEdit={onEdit}
                onOpenEndpoints={onOpenEndpoints}
                onExport={onExport}
                onDelete={onDelete}
                onSync={onSync}
              />
            );
          })}

          {/* Big Plus Tile */}
          <ServiceAddPlusTile
            onClick={onAddClick}
            onImportClick={onImportClick}
          />
        </div>
      </SortableContext>
    </div>
  );
}
