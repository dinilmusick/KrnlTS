import type { Landmark } from '../domain/BaseGraph.js';

export class LandmarkManager {
  private landmarks: Map<string, Landmark> = new Map();

  constructor(initialLandmarks: Landmark[] = []) {
    for (const lm of initialLandmarks) {
      this.landmarks.set(lm.id, { ...lm });
    }
  }

  public createLandmark(number: number, name: string, cameraPosition: { x: number; y: number }, zoom: number): Landmark {
    const id = `landmark-${number}-${Date.now()}`;
    const landmark: Landmark = { id, number, name, cameraPosition: { ...cameraPosition }, zoom };
    this.landmarks.set(id, landmark);
    return landmark;
  }

  public getByNumber(number: number): Landmark | undefined {
    return Array.from(this.landmarks.values()).find(lm => lm.number === number);
  }

  public getById(id: string): Landmark | undefined {
    return this.landmarks.get(id);
  }

  public updateLandmark(id: string, updates: Partial<Omit<Landmark, 'id'>>): Landmark | undefined {
    const lm = this.landmarks.get(id);
    if (!lm) return undefined;
    const updated = { ...lm, ...updates };
    this.landmarks.set(id, updated);
    return updated;
  }

  public deleteLandmark(id: string): boolean {
    return this.landmarks.delete(id);
  }

  public list(): Landmark[] {
    return Array.from(this.landmarks.values()).sort((a, b) => a.number - b.number);
  }

  public clear(): void {
    this.landmarks.clear();
  }
}
