/**
 * Explicit Google Drive adapter. The optional googleapis package is loaded only
 * when the adapter is invoked. Public declarations intentionally avoid leaking
 * googleapis' Node-specific type dependencies into portable consumers.
 */
export interface GoogleApisModule {
  google: {
    drive(options: {version: "v3"; auth: unknown}): unknown;
  };
}

export async function loadGoogleApis(): Promise<GoogleApisModule> {
  const pkg = "googleapis";
  const module = await import(/* @vite-ignore */ pkg);
  return module as unknown as GoogleApisModule;
}

export async function createGoogleDriveClient(options: {auth: unknown}): Promise<unknown> {
  const {google} = await loadGoogleApis();
  return google.drive({version: "v3", auth: options.auth});
}
