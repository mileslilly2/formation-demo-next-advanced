import { LevelsFile, LevelRow } from "../../src/types/musicLevel";

export default class LevelManager {
  private levels: LevelRow[] = [];
  private i = -1;

  constructor(private scene: Phaser.Scene, private url = "/levels/advanced_levels.json") {}

  async load() {
    const res = await fetch(this.url);
    this.levels = (await res.json()) as LevelsFile;
    console.log(`[LevelManager] loaded ${this.levels.length} levels`);
  }

  hasLevels() { return this.levels.length > 0; }
  next(): LevelRow | null { if (!this.hasLevels()) return null; this.i = (this.i+1) % this.levels.length; return this.levels[this.i]; }
  current(): LevelRow | null { return (this.i >= 0 && this.i < this.levels.length) ? this.levels[this.i] : null; }
}
