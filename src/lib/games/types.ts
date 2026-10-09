export interface GameProps<TConfig = any> {
  config: TConfig;
  seed: string;
  difficulty: 1 | 2 | 3;
  reducedMotion?: boolean;
  muted?: boolean;
  onFinish: (result: GameResult) => void;
  onExit: () => void;
}

export interface GameResult {
  score: number;
  durationMs: number;
  stats: Record<string, number>;
}
