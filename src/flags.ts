export type FeatureFlag = 'hud' | 'levels' | 'parallax' | 'menu';

const readFromUrl = (): string[] => {
  if (typeof window === 'undefined') return [];
  const qs = new URLSearchParams(window.location.search);
  return (qs.get('flags') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

const readFromEnv = (): string[] =>
  (process.env.NEXT_PUBLIC_FEATURE_FLAGS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const flags = new Set<string>([...readFromEnv(), ...readFromUrl()]);

export const hasFlag = (f: FeatureFlag) => flags.has(f);
export const logFlags = () => console.log('[FLAGS]', Array.from(flags));
