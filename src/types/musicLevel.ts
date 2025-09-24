export type TemplateName = 'stinger' | 'drone' | 'boss';

export interface TemplateSpec {
  type: TemplateName;
  hp: number;
  speed: number;
}

export interface LevelRow {
  level_id: string;
  artist?: string;
  recording_mbid: string;
  templates: Partial<Record<TemplateName, TemplateSpec>>;
  features?: Record<string, number | null>;
  raw_feature_values?: Record<string, number | null>;
  percentiles?: Record<string, number>;
  composite_score?: number;
}
export type LevelsFile = LevelRow[];
