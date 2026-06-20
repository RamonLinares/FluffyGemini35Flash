# 🪐 Fluffy Planetary Explorer (3D Procedural Exploration Game)

A beautiful, relaxing 3D planetary exploration game built using **React**, **React Three Fiber (Three.js)**, **WebGL**, and **Web Audio API**.

> [!IMPORTANT]
> 🚀 This project was fully **vibe coded** using **Antigravity** and **Gemini 3.5 Flash (high)** by Google DeepMind.

---

## 🎮 Gameplay & Features

You control a cute, customizable fluffy ball traversing procedurally generated 3D planets.

1. **5 Ethereal Quests per Planet**:
   - 🌸 **Starflower Gathering**: Collect 5 glowing starflowers spinning on the grassy meadows.
   - 🗼 **Ancient Beacons**: Locate and activate 3 stone pillars on the hilltops.
   - 🐕 **Lost Friend**: Rescue a mini-fluffy lost in the wild and guide them safely back to the home portal. They trail behind you with realistic surface physics.
   - 🏔️ **High Summit Altar**: Climb to the highest peak on the planet and meditate inside the archway altar.
   - 🎵 **Song of the Cosmos**: Listen to the cosmic song of the Singing Tree for 5 seconds.
2. **Procedural Terrains**: Every planet generates a unique combination of landmasses, grass heights, water levels, crystals, clouds, and trees based on a seed.
3. **Circular Polar Radar (Compass)**: A camera-aligned, real-time compass in the top-right maps the planet's 3D sphere onto a 2D radar, guiding you to active quest objectives.
4. **Device Synchronization**: Complete planets to unlock a sync code (e.g., `FLUFFY-P[index]-C[color]-A[accessory]-[checksum]`) to resume your progress on any other phone, tablet, or desktop.
5. **Anime Aesthetics & Chibi Character**: Custom-modeled chibi bear character with blush cheeks, moving paws/feet, and cute accessories (Crown, Headphones, ribbon, Flower).
6. **Dynamic Sound Synth**: Generates custom sound chimes, bloops, and arpeggios dynamically using the browser's Web Audio API.

---

## 🛠️ Controls

- **Keyboard (Desktop)**: `W`, `A`, `S`, `D` or `Arrow Keys` to roll. `SPACEBAR` to jump. Use mouse drag to rotate the camera around the planet.
- **Touch (Mobile)**: Virtual joystick on the left side to roll. Tap the right side of the screen to jump. Drag anywhere on the screen to rotate the camera.

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run in development mode:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

---

## 💎 Customization & Aesthetics
- Styled with modern glassmorphism panels.
- Collapsible Quest checklist on mobile to keep the screen clean.
- Uses beautiful Google Fonts (Outfit & Quicksand) and vanilla CSS design tokens.
