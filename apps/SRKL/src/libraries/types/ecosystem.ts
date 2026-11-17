export type EcosystemServiceCategory =
  | 'deployment'
  | 'storage'
  | 'vcs'
  | 'ai'
  | 'database'
  | 'general';

export interface EcosystemAccount {
  id?: string;
  serviceId: string;
  provider: string;
  category: EcosystemServiceCategory;
  name: string;
  emailOrSlug?: string;
  status: string;
  credentials: Record<string, any>;
  groupIds: string[];
  metadata: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppAccountManifest {
  appId?: string;
  categories?: EcosystemServiceCategory[];
  requiredServices?: string[];
  includeCredentials?: boolean;
}
