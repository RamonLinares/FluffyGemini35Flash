import { test, expect } from '@playwright/test';

test.describe('Fluffy Explorer Visual QA', () => {
  test.beforeEach(async ({ page }) => {
    // Log console and page errors to test output
    page.on('console', msg => console.log(`[PAGE LOG] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));

    // Navigate, clear storage, and refresh for a clean state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/');
  });

  test('HUD looks correct on mobile default state', async ({ page }) => {
    // Wait for the page and canvas scene to load
    await page.waitForTimeout(3000);
    
    // Check if header elements are visible and properly aligned
    const planetCard = page.locator('.planet-pill-card');
    await expect(planetCard).toBeVisible();
    
    const tracker = page.locator('.quest-tracker-center');
    await expect(tracker).toBeVisible();
    
    const buttons = page.locator('.top-right-buttons-container');
    await expect(buttons).toBeVisible();

    // Check that buttons don't wrap and are in the top-right
    const buttonsBounding = await buttons.boundingBox();
    const trackerBounding = await tracker.boundingBox();
    const cardBounding = await planetCard.boundingBox();
    
    expect(buttonsBounding).not.toBeNull();
    expect(trackerBounding).not.toBeNull();
    expect(cardBounding).not.toBeNull();

    // Verify they are roughly on the same horizontal row (top bar)
    expect(Math.abs((cardBounding!.y + cardBounding!.height/2) - (trackerBounding!.y + trackerBounding!.height/2))).toBeLessThan(35);
    expect(Math.abs((trackerBounding!.y + trackerBounding!.height/2) - (buttonsBounding!.y + buttonsBounding!.height/2))).toBeLessThan(35);

    // Save screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-default.png' });
  });

  test('Stardust Customize Modal renders correctly', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Click CODE button to open settings modal
    const codeBtn = page.locator('.code-sync-btn');
    await expect(codeBtn).toBeVisible();
    await codeBtn.click();
    
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    
    // Save screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-customize-modal.png' });
  });

  test('Game Pause Overlay renders correctly', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Click Pause button (second button in top-right-buttons-container)
    const pauseBtn = page.locator('.top-right-buttons-container button').nth(1);
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
    
    const pauseOverlay = page.locator('.paused-overlay');
    await expect(pauseOverlay).toBeVisible();
    
    // Save screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-paused.png' });
  });

  test('Warp Ready Banner displays centered and un-squished', async ({ page }) => {
    // Populate localStorage with all completed quests and base save
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('fluffy_explorer_save', JSON.stringify({
        planetIndex: 0,
        completedPlanetsCount: 0,
        customization: {
          color: '#FFB7B2',
          accessory: 'none'
        }
      }));
      localStorage.setItem('fluffy_quests_planet_0', JSON.stringify([
        { id: 'quest_collect_0', completed: true, currentCount: 5, targetCount: 5, type: 'collect', title: 'Starflower Gathering', icon: 'star' },
        { id: 'quest_beacon_0', completed: true, currentCount: 3, targetCount: 3, type: 'beacon', title: 'Ancient Beacons', icon: 'tower-broadcast' },
        { id: 'quest_find_mini_0', completed: true, currentCount: 1, targetCount: 1, type: 'find_mini', title: 'Lost Friend', icon: 'face-smile' },
        { id: 'quest_summit_0', completed: true, currentCount: 1, targetCount: 1, type: 'summit', title: 'High Summit Altar', icon: 'mountain' },
        { id: 'quest_singing_tree_0', completed: true, currentCount: 5, targetCount: 5, type: 'singing_tree', title: 'Song of the Cosmos', icon: 'music' }
      ]));
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);

    const banner = page.locator('.warp-ready-banner');
    await expect(banner).toBeVisible();
    
    // Save screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-warp-ready.png' });
  });

  test('Capture all planets screenshots', async ({ page }) => {
    test.setTimeout(90000);
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.evaluate((index) => {
        localStorage.clear();
        localStorage.setItem('fluffy_explorer_save', JSON.stringify({
          planetIndex: index,
          completedPlanetsCount: index,
          customization: {
            color: '#FFB7B2',
            accessory: 'none'
          }
        }));
      }, i);
      await page.goto('/');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `tests/screenshots/planet-${i + 1}.png` });
    }
  });
});
