import type {ModelLoader, ModelUnloader} from "./model-types.js";

type Entry<TModel> = {
  model?: TModel;
  users: number;
};

export class ModelResidency<TModel> {
  private entry?: Entry<TModel> | undefined;
  private loading?: Promise<TModel> | undefined;
  private unloading?: Promise<void> | undefined;

  async run<T>(
    load: ModelLoader<TModel>,
    unload: ModelUnloader<TModel>,
    operation: (model: TModel) => Promise<T>,
  ): Promise<T> {
    if (this.unloading) {
      await this.unloading;
    }

    if (!this.entry) {
      this.entry = {users: 0};
    }
    const entry = this.entry;
    entry.users += 1;

    try {
      if (!entry.model) {
        entry.model = await this.loadOnce(load);
      }
      return await operation(entry.model);
    } finally {
      entry.users -= 1;
      if (entry.users === 0 && this.entry === entry) {
        this.entry = undefined;
        if (entry.model) {
          const modelToUnload = entry.model;
          this.unloading = unload(modelToUnload).finally(() => {
            this.unloading = undefined;
          });
          await this.unloading;
        }
      }
    }
  }

  get activeUsers(): number {
    return this.entry?.users ?? 0;
  }

  get isLoaded(): boolean {
    return this.entry?.model !== undefined;
  }

  private async loadOnce(load: ModelLoader<TModel>): Promise<TModel> {
    if (!this.loading) {
      this.loading = load().finally(() => {
        this.loading = undefined;
      });
    }
    return this.loading;
  }
}
