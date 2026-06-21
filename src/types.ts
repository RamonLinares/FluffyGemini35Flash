export type QuestType = 'collect' | 'beacon' | 'find_mini' | 'summit' | 'singing_tree';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  icon: string; // Font Awesome icon name e.g., 'star', 'rss', 'child', 'mountain', 'music'
}

export type PlanetType = 'forest' | 'desert' | 'mechanic' | 'crystal' | 'water';
export type CivilizationStyle = 'none' | 'ruins' | 'crystal_spires' | 'steampunk' | 'futuristic';

export interface PlanetTheme {
  name: string;
  landColor: string;
  waterColor: string;
  rockColor: string;
  fogColor: string;
  skyColor: string;
  accentColor: string;
  propColors: string[];
  planetType: PlanetType;
  hasRings: boolean;
  ringColor: string;
  moonsCount: number;
  moonColors: string[];
  doubleStars: boolean;
  civilization: CivilizationStyle;
}

export interface PlanetConfig {
  index: number;
  seed: number;
  name: string;
  theme: PlanetTheme;
  quests: Quest[];
}

export interface PlayerSaveData {
  planetIndex: number;
  completedPlanetsCount: number;
  customization: {
    color: string;
    accessory: string;
  };
}
