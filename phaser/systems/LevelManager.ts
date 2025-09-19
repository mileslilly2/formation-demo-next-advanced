import * as Phaser from "phaser";
import FormationManager from "./FormationManager";

interface WaveSpec {
  formation_file: string;
  start_time_ms: number;
  repeat?: number;
  interval_ms?: number;
}

interface LevelSpec {
  level_id: string;
  meta?: Record<string, any>;
  waves: WaveSpec[];
}

export default class LevelManager {
  private scene: Phaser.Scene;
  private formationManager: FormationManager;
  private levelData?: LevelSpec;
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor(scene: Phaser.Scene, formationManager: FormationManager) {
    this.scene = scene;
    this.formationManager = formationManager;
  }

  async loadLevel(file: string): Promise<void> {
    try {
      const url = `/levels/${file}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load level file: ${url}`);
      const json = await res.json();
      this.levelData = json as LevelSpec;

      console.log(`[LevelManager] Loaded level: ${this.levelData.level_id}`);
      this.scheduleWaves();
    } catch (err) {
      console.error("[LevelManager] Error loading level", err);
    }
  }

  private scheduleWaves(): void {
    if (!this.levelData) return;

    // clear previous timers if reloading
    this.timers.forEach((t) => t.remove(false));
    this.timers = [];

    this.levelData.waves.forEach((wave) => {
      const repeat = wave.repeat ?? 1;
      const interval = wave.interval_ms ?? 0;

      for (let i = 0; i < repeat; i++) {
        const delay = wave.start_time_ms + i * interval;

        const timer = this.scene.time.addEvent({
          delay,
          callback: () => {
            console.log(
              `[LevelManager] Triggering formation ${wave.formation_file} (repeat ${i + 1}/${repeat})`
            );
            this.formationManager.loadAndScheduleFromFile(wave.formation_file);
          },
        });

        this.timers.push(timer);
      }
    });
  }
}
