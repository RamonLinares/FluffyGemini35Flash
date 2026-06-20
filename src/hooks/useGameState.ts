import { useState, useEffect, useCallback } from 'react';
import type { PlanetConfig, Quest, PlanetTheme, PlayerSaveData } from '../types';
import { SeededRandom } from '../utils/noise';

// Standard list of beautiful pastel colors
const CUSTOM_COLORS = [
  '#FFB7B2', // Pastel Pink / Coral
  '#FFDAC1', // Pastel Orange / Peach
  '#E2F0CB', // Pastel Yellow-Green
  '#B5EAD7', // Pastel Mint Green
  '#C7CEEA', // Pastel Lavender Blue
  '#E8D7F1', // Pastel Lilac
  '#FCDDEC', // Pastel Blossom Pink
];

const ACCESSORIES = ['none', 'flower', 'crown', 'headphones', 'ribbon'];

// Generates a deterministic planet theme based on index
function generatePlanetTheme(index: number): PlanetTheme {
  const seeds = [
    // Predefined beautiful palettes for the first 5 planets
    {
      name: 'Chroma Clover',
      landColor: '#e8f5e9', // Minty green
      waterColor: '#e0f7fa', // Soft cyan
      rockColor: '#cfd8dc', // Light grey
      fogColor: '#f1f8e9', // Ethereal greenish white
      skyColor: '#e8f5e9',
      accentColor: '#81c784', // Emerald green
      propColors: ['#a5d6a7', '#81c784', '#fff59d'],
    },
    {
      name: 'Dreamy Lilac',
      landColor: '#f3e5f5', // Soft lavender/purple
      waterColor: '#e8eaf6', // Soft indigo water
      rockColor: '#d1c4e9', // Slate purple
      fogColor: '#f3e5f5', // Pale lilac
      skyColor: '#ede7f6',
      accentColor: '#ba68c8', // Deep lavender
      propColors: ['#ce93d8', '#b39ddb', '#ff8a80'],
    },
    {
      name: 'Peach Horizon',
      landColor: '#fff3e0', // Soft peach
      waterColor: '#e0f2f1', // Pastel teal water
      rockColor: '#ffe0b2', // Soft sand rock
      fogColor: '#fff3e0', // Warm white
      skyColor: '#fffde7',
      accentColor: '#ffb74d', // Pastel orange
      propColors: ['#ffcc80', '#ffe082', '#ffab91'],
    },
    {
      name: 'Mint Starlight',
      landColor: '#e0f2f1', // Pale teal
      waterColor: '#e3f2fd', // Soft blue water
      rockColor: '#b2dfdb', // Teal rock
      fogColor: '#e0f2f1', // Teal fog
      skyColor: '#e0f7fa',
      accentColor: '#4db6ac', // Mint accent
      propColors: ['#80cbc4', '#90caf9', '#ffe082'],
    },
    {
      name: 'Luminous Nebula',
      landColor: '#fce4ec', // Blossom pink
      waterColor: '#eceff1', // Silver water
      rockColor: '#f8bbd0', // Pastel magenta rock
      fogColor: '#fce4ec', // Soft pink fog
      skyColor: '#fdf2f8',
      accentColor: '#f06292', // Warm pink
      propColors: ['#f48fb1', '#ce93d8', '#90caf9'],
    },
  ];

  if (index < seeds.length) {
    return seeds[index];
  }

  // Procedural fallback for infinite planets after level 5
  const rand = new SeededRandom(index * 1337);
  const hue = Math.floor(rand.next() * 360);
  const landColor = `hsl(${hue}, 40%, 93%)`;
  const waterColor = `hsl(${(hue + 120) % 360}, 30%, 92%)`;
  const rockColor = `hsl(${(hue + 240) % 360}, 20%, 80%)`;
  const fogColor = `hsl(${hue}, 40%, 96%)`;
  const skyColor = `hsl(${hue}, 30%, 95%)`;
  const accentColor = `hsl(${hue}, 50%, 75%)`;
  const propColors = [
    `hsl(${hue}, 45%, 85%)`,
    `hsl(${(hue + 30) % 360}, 45%, 85%)`,
    `hsl(${(hue - 30 + 360) % 360}, 45%, 88%)`,
  ];

  return {
    name: `Stardust ${index + 1}`,
    landColor,
    waterColor,
    rockColor,
    fogColor,
    skyColor,
    accentColor,
    propColors,
  };
}

// Generate the 5 quests for a given planet index
function generateQuestsForPlanet(index: number): Quest[] {
  return [
    {
      id: `quest_collect_${index}`,
      title: 'Starflower Gathering',
      description: 'Collect 5 glowing pastel starflowers scattered across the meadows.',
      type: 'collect',
      targetCount: 5,
      currentCount: 0,
      completed: false,
      icon: 'star',
    },
    {
      id: `quest_beacon_${index}`,
      title: 'Ancient Beacons',
      description: 'Find and activate 3 sleeping ancient beacons on the hilltops.',
      type: 'beacon',
      targetCount: 3,
      currentCount: 0,
      completed: false,
      icon: 'tower-broadcast',
    },
    {
      id: `quest_find_mini_${index}`,
      title: 'Lost Friend',
      description: 'Locate a lost mini-fluffy and guide them back home safely.',
      type: 'find_mini',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      icon: 'face-smile',
    },
    {
      id: `quest_summit_${index}`,
      title: 'High Summit Altar',
      description: 'Reach the planet\'s highest peak and meditate at the stone altar.',
      type: 'summit',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      icon: 'mountain',
    },
    {
      id: `quest_singing_tree_${index}`,
      title: 'Song of the Cosmos',
      description: 'Find the magical Singing Tree and stay near it to hear its tune.',
      type: 'singing_tree',
      targetCount: 5, // 5 seconds of hearing the song
      currentCount: 0,
      completed: false,
      icon: 'music',
    },
  ];
}

// Generate configuration for a planet
export function getPlanetConfig(index: number): PlanetConfig {
  return {
    index,
    seed: (index + 1) * 98765,
    name: generatePlanetTheme(index).name,
    theme: generatePlanetTheme(index),
    quests: generateQuestsForPlanet(index),
  };
}

// Generates the Sync Code
// Encodes: FLUFFY-P[planetIndex]-C[customColorIndex]-A[accessoryIndex]
function encodeSyncCode(planetIndex: number, colorIndex: number, accessoryIndex: number): string {
  // Simple base36 encoding to keep it short and clean
  const pCode = planetIndex.toString(36).toUpperCase();
  const cCode = colorIndex.toString(36).toUpperCase();
  const aCode = accessoryIndex.toString(36).toUpperCase();
  const checksum = ((planetIndex * 7 + colorIndex * 13 + accessoryIndex * 3) % 36).toString(36).toUpperCase();
  return `FLUFFY-${pCode}-${cCode}-${aCode}-${checksum}`;
}

// Decodes the Sync Code
interface DecodedData {
  planetIndex: number;
  colorIndex: number;
  accessoryIndex: number;
  isValid: boolean;
}

function decodeSyncCode(code: string): DecodedData {
  const parts = code.trim().split('-');
  if (parts.length !== 5 || parts[0] !== 'FLUFFY') {
    return { planetIndex: 0, colorIndex: 0, accessoryIndex: 0, isValid: false };
  }

  try {
    const planetIndex = parseInt(parts[1], 36);
    const colorIndex = parseInt(parts[2], 36);
    const accessoryIndex = parseInt(parts[3], 36);
    const checksumChar = parts[4];

    const expectedChecksum = ((planetIndex * 7 + colorIndex * 13 + accessoryIndex * 3) % 36).toString(36).toUpperCase();
    
    if (expectedChecksum !== checksumChar) {
      return { planetIndex: 0, colorIndex: 0, accessoryIndex: 0, isValid: false };
    }

    return {
      planetIndex,
      colorIndex: Math.min(Math.max(0, colorIndex), CUSTOM_COLORS.length - 1),
      accessoryIndex: Math.min(Math.max(0, accessoryIndex), ACCESSORIES.length - 1),
      isValid: true,
    };
  } catch (e) {
    return { planetIndex: 0, colorIndex: 0, accessoryIndex: 0, isValid: false };
  }
}

export function useGameState() {
  const [planetIndex, setPlanetIndex] = useState<number>(0);
  const [colorIndex, setColorIndex] = useState<number>(0);
  const [accessoryIndex, setAccessoryIndex] = useState<number>(0);
  
  const [planetConfig, setPlanetConfig] = useState<PlanetConfig>(() => getPlanetConfig(0));
  const [quests, setQuests] = useState<Quest[]>(() => getPlanetConfig(0).quests);
  const [warping, setWarping] = useState<boolean>(false);
  const [warpMessage, setWarpMessage] = useState<string>('');

  // Load from localstorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fluffy_explorer_save');
    if (saved) {
      try {
        const data = JSON.parse(saved) as PlayerSaveData;
        setPlanetIndex(data.planetIndex);
        
        const cIndex = CUSTOM_COLORS.indexOf(data.customization.color);
        setColorIndex(cIndex !== -1 ? cIndex : 0);
        
        const aIndex = ACCESSORIES.indexOf(data.customization.accessory);
        setAccessoryIndex(aIndex !== -1 ? aIndex : 0);

        // Load config and quests for the saved planet
        const config = getPlanetConfig(data.planetIndex);
        setPlanetConfig(config);
        
        // Load completed quests if saved, otherwise load fresh ones
        const savedQuests = localStorage.getItem(`fluffy_quests_planet_${data.planetIndex}`);
        if (savedQuests) {
          setQuests(JSON.parse(savedQuests));
        } else {
          setQuests(config.quests);
        }
      } catch (e) {
        console.error('Failed to parse save data', e);
      }
    }
  }, []);

  // Save current progress to localstorage
  const saveGame = useCallback((pIndex: number, cIdx: number, aIdx: number, currentQuests?: Quest[]) => {
    const saveData: PlayerSaveData = {
      planetIndex: pIndex,
      completedPlanetsCount: pIndex,
      customization: {
        color: CUSTOM_COLORS[cIdx],
        accessory: ACCESSORIES[aIdx],
      },
    };
    localStorage.setItem('fluffy_explorer_save', JSON.stringify(saveData));
    if (currentQuests) {
      localStorage.setItem(`fluffy_quests_planet_${pIndex}`, JSON.stringify(currentQuests));
    }
  }, []);

  // Sync Code
  const syncCode = encodeSyncCode(planetIndex, colorIndex, accessoryIndex);

  // Update customization
  const selectColor = (idx: number) => {
    setColorIndex(idx);
    saveGame(planetIndex, idx, accessoryIndex, quests);
  };

  const selectAccessory = (idx: number) => {
    setAccessoryIndex(idx);
    saveGame(planetIndex, colorIndex, idx, quests);
  };

  // Set active planet (for warps / sync)
  const setPlanet = useCallback((pIndex: number) => {
    setWarping(true);
    setWarpMessage('Entering Stargate...');
    
    setTimeout(() => {
      setPlanetIndex(pIndex);
      const config = getPlanetConfig(pIndex);
      setPlanetConfig(config);
      setQuests(config.quests);
      
      saveGame(pIndex, colorIndex, accessoryIndex, config.quests);
      
      setWarpMessage(`Arrived at ${config.name}!`);
      setTimeout(() => {
        setWarping(false);
      }, 1500);
    }, 1500);
  }, [colorIndex, accessoryIndex, saveGame]);

  // Load sync code
  const loadCode = (code: string): boolean => {
    const decoded = decodeSyncCode(code);
    if (!decoded.isValid) {
      return false;
    }
    setColorIndex(decoded.colorIndex);
    setAccessoryIndex(decoded.accessoryIndex);
    setPlanet(decoded.planetIndex);
    return true;
  };

  // Complete or update quest progress
  const updateQuestProgress = useCallback((questType: string, amount: number) => {
    setQuests((prevQuests) => {
      let changed = false;
      const updated = prevQuests.map((q) => {
        if (q.type === questType && !q.completed) {
          changed = true;
          const nextCount = Math.min(q.targetCount, q.currentCount + amount);
          const completed = nextCount >= q.targetCount;
          return {
            ...q,
            currentCount: nextCount,
            completed,
          };
        }
        return q;
      });

      if (changed) {
        saveGame(planetIndex, colorIndex, accessoryIndex, updated);
      }
      return updated;
    });
  }, [planetIndex, colorIndex, accessoryIndex, saveGame]);

  // Check if all quests are completed
  const allQuestsCompleted = quests.every((q) => q.completed);

  // Warp to next planet
  const warpNext = useCallback(() => {
    if (!allQuestsCompleted) return;
    setPlanet(planetIndex + 1);
  }, [planetIndex, allQuestsCompleted, setPlanet]);

  // Reset game progress completely
  const resetGame = () => {
    localStorage.removeItem('fluffy_explorer_save');
    for (let i = 0; i <= planetIndex + 5; i++) {
      localStorage.removeItem(`fluffy_quests_planet_${i}`);
    }
    setPlanetIndex(0);
    setColorIndex(0);
    setAccessoryIndex(0);
    const config = getPlanetConfig(0);
    setPlanetConfig(config);
    setQuests(config.quests);
  };

  return {
    planetIndex,
    planetConfig,
    quests,
    color: CUSTOM_COLORS[colorIndex],
    accessory: ACCESSORIES[accessoryIndex],
    customColors: CUSTOM_COLORS,
    colorIndex,
    accessories: ACCESSORIES,
    accessoryIndex,
    syncCode,
    warping,
    warpMessage,
    allQuestsCompleted,
    updateQuestProgress,
    warpNext,
    loadCode,
    selectColor,
    selectAccessory,
    resetGame,
  };
}
