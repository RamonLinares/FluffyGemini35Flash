import * as THREE from 'three';

// Seeded Random Number Generator
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = Math.abs(seed) || 1;
  }

  // Returns a pseudo-random float between 0 and 1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns a pseudo-random float between min and max
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// 3D Improved Perlin Noise
export class Perlin3D {
  private p: number[] = new Array(512);

  constructor(seed: number) {
    const rand = new SeededRandom(seed);
    const permutation = Array.from({ length: 256 }, (_, i) => i);
    
    // Fisher-Yates shuffle the permutation table using seeded random
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand.next() * (i + 1));
      const temp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = temp;
    }

    // Duplicate the permutation array
    for (let i = 0; i < 256; i++) {
      this.p[i] = permutation[i];
      this.p[256 + i] = permutation[i];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA], x, y, z),
                     this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z),
                     this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),
                     this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),
                     this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }

  // Fractal Brownian Motion (FBM) with multiple octaves
  fbm(x: number, y: number, z: number, octaves = 4, lacunarity = 2.0, gain = 0.5): number {
    let total = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    // Normalize output to [-1, 1] range
    return total / maxValue;
  }
}

// Optimized cache for Perlin noise generators to avoid garbage collection overhead in the physics loop
const perlinCache = new Map<number, Perlin3D>();

export function getPerlinGenerator(seed: number): Perlin3D {
  if (!perlinCache.has(seed)) {
    perlinCache.set(seed, new Perlin3D(seed));
  }
  return perlinCache.get(seed)!;
}

function craterEffect(dist: number, R: number): number {
  if (dist >= R) return 0;
  const x = dist / R;
  if (x < 0.8) {
    const t = x / 0.8;
    const depth = 0.5; // crater depth in noise units
    const rim = 0.15;  // rim height in noise units
    return -depth * (1 - t * t) + rim * t * t;
  } else {
    const t = (x - 0.8) / 0.2;
    const rim = 0.15;
    return rim * (1 - t) * (1 - t);
  }
}

export function getPlanetHeight(
  pos: { x: number; y: number; z: number },
  seed: number,
  radius: number = 22,
  maxHeight: number = 4
): number {
  const perlin = getPerlinGenerator(seed);
  const len = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  if (len === 0) return radius;
  
  const dx = pos.x / len;
  const dy = pos.y / len;
  const dz = pos.z / len;
  
  // Deterministic planet type selection matching generatePlanetTheme
  const index = Math.round((seed / 98765) - 1);
  const types: ('forest' | 'crystal' | 'desert' | 'mechanic' | 'water')[] = [
    'forest', 'crystal', 'desert', 'mechanic', 'water'
  ];
  let planetType: 'forest' | 'crystal' | 'desert' | 'mechanic' | 'water' = 'forest';
  
  if (index >= 0 && index < 5) {
    planetType = types[index];
  } else {
    const randVal = Math.abs(Math.sin(seed * 13.37));
    const typesFallback: ('forest' | 'desert' | 'mechanic' | 'crystal' | 'water')[] = [
      'forest', 'desert', 'mechanic', 'crystal', 'water'
    ];
    planetType = typesFallback[Math.floor(randVal * typesFallback.length)];
  }

  let noiseVal = 0;
  
  if (planetType === 'mechanic') {
    // Terraced platforms / plateaus for cybernetic grid
    noiseVal = perlin.fbm(dx * 1.5, dy * 1.5, dz * 1.5, 4, 1.8, 0.45);
    noiseVal = Math.round(noiseVal * 4.0) / 4.0;
  } else if (planetType === 'desert') {
    // Smooth dune sweeps + small sinus wind ripples
    noiseVal = perlin.fbm(dx * 1.3, dy * 1.3, dz * 1.3, 3, 2.0, 0.35);
    const ripple = Math.sin(noiseVal * 28) * 0.04;
    noiseVal += ripple;

    // Deterministic crater centers
    const c1x = Math.sin(seed * 0.17);
    const c1y = Math.cos(seed * 0.23);
    const c1z = Math.sin(seed * 0.31);
    const c1len = Math.sqrt(c1x * c1x + c1y * c1y + c1z * c1z) || 1;
    const cx1 = c1x / c1len; const cy1 = c1y / c1len; const cz1 = c1z / c1len;

    const c2x = Math.sin(seed * 0.43);
    const c2y = Math.cos(seed * 0.51);
    const c2z = Math.sin(seed * 0.67);
    const c2len = Math.sqrt(c2x * c2x + c2y * c2y + c2z * c2z) || 1;
    const cx2 = c2x / c2len; const cy2 = c2y / c2len; const cz2 = c2z / c2len;

    const c3x = Math.sin(seed * 0.79);
    const c3y = Math.cos(seed * 0.83);
    const c3z = Math.sin(seed * 0.97);
    const c3len = Math.sqrt(c3x * c3x + c3y * c3y + c3z * c3z) || 1;
    const cx3 = c3x / c3len; const cy3 = c3y / c3len; const cz3 = c3z / c3len;

    // Euclidean distance to crater centers on unit sphere
    const d1 = Math.sqrt((dx - cx1) ** 2 + (dy - cy1) ** 2 + (dz - cz1) ** 2);
    const d2 = Math.sqrt((dx - cx2) ** 2 + (dy - cy2) ** 2 + (dz - cz2) ** 2);
    const d3 = Math.sqrt((dx - cx3) ** 2 + (dy - cy3) ** 2 + (dz - cz3) ** 2);

    noiseVal += craterEffect(d1, 0.35);
    noiseVal += craterEffect(d2, 0.25);
    noiseVal += craterEffect(d3, 0.30);
  } else if (planetType === 'water') {
    // Submerged terrain (most falls below sea level creating islands)
    noiseVal = perlin.fbm(dx * 1.5, dy * 1.5, dz * 1.5, 4, 1.8, 0.45);
    noiseVal -= 0.28;
  } else if (planetType === 'crystal') {
    // Jagged, spiky crystal peaks
    noiseVal = perlin.fbm(dx * 1.6, dy * 1.6, dz * 1.6, 4, 2.0, 0.5);
    if (noiseVal > 0) {
      noiseVal = Math.pow(noiseVal, 1.35);
    }
  } else {
    // Standard rolling hills forest
    noiseVal = perlin.fbm(dx * 1.5, dy * 1.5, dz * 1.5, 4, 1.8, 0.45);
  }
  
  // Return displaced height
  return radius + noiseVal * maxHeight;
}

export interface QuestLocations {
  flowers: { id: string; pos: THREE.Vector3; quat: THREE.Quaternion }[];
  beacons: { id: string; pos: THREE.Vector3; quat: THREE.Quaternion }[];
  mini: THREE.Vector3;
  miniQuat: THREE.Quaternion;
  homePortal: THREE.Vector3;
  homePortalQuat: THREE.Quaternion;
  singingTree: THREE.Vector3;
  singingTreeQuat: THREE.Quaternion;
  summitAltar: THREE.Vector3;
  summitAltarQuat: THREE.Quaternion;
}

export function getQuestLocations(seed: number, baseRadius: number = 22, maxHeight: number = 4, waterRadius: number = 21.2): QuestLocations {
  const rand = new SeededRandom(seed + 777);
  const result: QuestLocations = {
    flowers: [],
    beacons: [],
    mini: new THREE.Vector3(),
    miniQuat: new THREE.Quaternion(),
    homePortal: new THREE.Vector3(),
    homePortalQuat: new THREE.Quaternion(),
    singingTree: new THREE.Vector3(),
    singingTreeQuat: new THREE.Quaternion(),
    summitAltar: new THREE.Vector3(),
    summitAltarQuat: new THREE.Quaternion(),
  };

  const getRandomLandPosition = (minDistFromNorth: number = 0) => {
    let attempts = 0;
    while (attempts < 200) {
      attempts++;
      const theta = rand.next() * Math.PI;
      const phi = rand.next() * Math.PI * 2;
      
      const dir = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi)
      );

      // Distance from North Pole (0, 1, 0)
      const distFromNorth = dir.distanceTo(new THREE.Vector3(0, 1, 0)) * baseRadius;
      if (distFromNorth < minDistFromNorth) continue;

      const h = getPlanetHeight(dir, seed, baseRadius, maxHeight);
      if (h > waterRadius + 0.15) { // Land only
        return {
          pos: dir.multiplyScalar(h),
          dir: dir.clone().normalize(),
        };
      }
    }
    // Fallback on land
    const defaultDir = new THREE.Vector3(0, 1, 0);
    const defaultH = Math.max(waterRadius + 0.5, getPlanetHeight(defaultDir, seed, baseRadius, maxHeight));
    return {
      pos: defaultDir.clone().multiplyScalar(defaultH),
      dir: defaultDir,
    };
  };

  // Portal (Home base where mini fluffy should go)
  const portalData = getRandomLandPosition(0);
  result.homePortal.copy(portalData.pos);
  result.homePortalQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), portalData.dir);

  // 5 Starflowers
  for (let i = 0; i < 5; i++) {
    const data = getRandomLandPosition(4);
    result.flowers.push({
      id: `flower_${i}`,
      pos: data.pos,
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), data.dir),
    });
  }

  // 3 Beacons
  for (let i = 0; i < 3; i++) {
    const data = getRandomLandPosition(8);
    result.beacons.push({
      id: `beacon_${i}`,
      pos: data.pos,
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), data.dir),
    });
  }

  // Lost Mini Fluffy
  const miniData = getRandomLandPosition(18);
  result.mini.copy(miniData.pos).addScaledVector(miniData.dir, 0.38);
  result.miniQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), miniData.dir);

  // Singing Tree
  const treeData = getRandomLandPosition(10);
  result.singingTree.copy(treeData.pos);
  result.singingTreeQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), treeData.dir);

  // Summit Altar (Find peak direction)
  let maxH = 0;
  const peakDir = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 80; i++) {
    const theta = rand.next() * Math.PI;
    const phi = rand.next() * Math.PI * 2;
    const dir = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi)
    );
    const h = getPlanetHeight(dir, seed, baseRadius, maxHeight);
    if (h > maxH) {
      maxH = h;
      peakDir.copy(dir);
    }
  }
  result.summitAltar.copy(peakDir.clone().multiplyScalar(maxH));
  result.summitAltarQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), peakDir.normalize());

  return result;
}

