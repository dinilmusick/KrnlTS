// ══════════════════════════════════════════════════════════════════════════════
// KLOKS BACKEND SERVER SERVICES: PROJECTS, SAMPLES, ASSETS, GRAPHS, SCENES
// ══════════════════════════════════════════════════════════════════════════════

export * from './wavHelper.js';
export * from './sampleGenerator.js';
export {
  WORKSPACE_ASSETS_ROOT,
  PROJECTS_ROOT,
  SUPPORTED_AUDIO_EXTS,
  SUPPORTED_MIDI_EXTS,
  ensureAssetPoolDirectories,
  seedDefaultAssets,
  ensureProjectAssets,
  getAssetPoolLocationPath,
  getAssetPoolPublicUrl,
  scanAssetPool,
  createAssetSubfolder,
  saveAssetToPool,
  deleteAssetFromPool,
  type AssetDataType,
  type AssetChannelType,
  type AssetPoolScope,
  type AssetFolderInfo,
  type AssetPoolItem,
} from './services/assetPoolService.js';
export {
  WORKSPACE_ROOT,
  GRAPHS_ROOT,
  ensureGraphAssetDirectories,
  seedStarterGraphAssets,
  scanGraphAssets,
  createGraphAssetFolder,
  createGraphAssetFolder as createGraphAssetSubfolder,
  saveAssetToGraph,
  deleteAssetFromGraph,
} from './services/graphAssetService.js';
export {
  LEGACY_PROJECTS_ROOT,
  ensureWorkspaceStructure,
  listAllGraphPackages,
  getGraphPackageById,
  createGraphPackage,
  saveGraphPackage,
  deleteGraphPackage,
  importGraphDependency,
  removeGraphDependency,
} from './services/graphPackageService.js';
export {
  configureStarterProjectTemplate,
  ensureProjectsRoot,
  listAllProjects,
  getProjectById,
  saveProject,
  deleteProject,
  type ProjectMetadata,
} from './services/projectService.js';
export {
  SAMPLES_GLOBAL_ROOT,
  initGlobalSamplesDirectory,
  listGlobalSamples,
  saveGlobalSample,
  deleteGlobalSample,
  listProjectSamples,
  saveProjectSample,
  deleteProjectSample,
  type ServerAudioSampleItem,
} from './services/sampleService.js';
export {
  resolveWorkspaceDir,
  listWorkspaceGraphs,
  createWorkspaceGraph,
  getWorkspaceGraph,
  saveWorkspaceGraph,
  deleteWorkspaceGraph,
  type WorkspaceFolderResolution,
} from './services/workspaceGraphService.js';
