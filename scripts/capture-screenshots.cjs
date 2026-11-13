const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Ensure high-DPI crispness (Retina 2x scale)
app.commandLine.appendSwitch('force-device-scale-factor', '2');
app.commandLine.appendSwitch('high-dpi-support', '1');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const outputDir = path.join(__dirname, '../docs/screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capture() {
  const win = new BrowserWindow({
    width: 480,
    height: 860,
    useContentSize: true,
    show: true,
    backgroundColor: '#FAF6F0',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(indexPath);

  // Wait for fonts & initial animations to settle
  await win.webContents.executeJavaScript('document.fonts.ready');
  await sleep(1500);

  // 1. Tab 1: Journal (Top view with balance card, categories, hourly trigger)
  console.log('Capturing 01-journal.png...');
  await win.webContents.executeJavaScript('window.scrollTo(0, 0);');
  await sleep(500);
  let img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, '01-journal.png'), img.toPNG());

  // 2. Hourly Income Calculator Drawer
  console.log('Capturing 02-hourly-calculator.png...');
  await win.webContents.executeJavaScript(`
    const btn = document.querySelector('[data-testid="open-hourly-sheet-btn"]');
    if (btn) btn.click();
  `);
  await sleep(1200);
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, '02-hourly-calculator.png'), img.toPNG());

  // Close hourly calculator drawer
  await win.webContents.executeJavaScript(`
    const closeBtn = document.querySelector('[data-testid="hourly-sheet-close-btn"]');
    if (closeBtn) closeBtn.click();
  `);
  await sleep(800);

  // 3. Tab 2: Calendar - Scroll so planner calendar grid with sticker dots is prominently shown
  console.log('Capturing 03-calendar.png...');
  await win.webContents.executeJavaScript(`
    const tabCal = document.querySelector('#tab-calendar') || document.querySelector('[data-testid="tab-calendar"]');
    if (tabCal) tabCal.click();
  `);
  await sleep(1200);
  await win.webContents.executeJavaScript(`
    const grid = document.querySelector('[data-testid="planner-calendar"]');
    if (grid) {
      grid.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  `);
  await sleep(600);
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, '03-calendar.png'), img.toPNG());

  // 4. Tab 3: Analytics - Scroll to showcase Donut chart & Sticky Note
  console.log('Capturing 04-analytics.png...');
  await win.webContents.executeJavaScript(`
    const tabAnalytics = document.querySelector('#tab-analytics') || document.querySelector('[data-testid="tab-analytics"]');
    if (tabAnalytics) tabAnalytics.click();
  `);
  await sleep(1400);
  await win.webContents.executeJavaScript(`
    const donut = document.querySelector('[data-testid="category-donut-card"]');
    if (donut) {
      donut.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  `);
  await sleep(800);
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, '04-analytics.png'), img.toPNG());

  // 5. Monthly Story Drawer (9:16 export preview)
  console.log('Capturing 05-monthly-story.png...');
  await win.webContents.executeJavaScript('window.scrollTo(0, 0);');
  await sleep(400);
  await win.webContents.executeJavaScript(`
    const storyBtn = document.querySelector('[data-testid="open-story-drawer-btn"]');
    if (storyBtn) storyBtn.click();
  `);
  await sleep(1400);
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, '05-monthly-story.png'), img.toPNG());

  // Close story drawer
  await win.webContents.executeJavaScript(`
    const closeStory = document.querySelector('[data-testid="story-drawer-close-btn"]');
    if (closeStory) closeStory.click();
  `);
  await sleep(800);

  // 6. Tab 4: Goals
  console.log('Capturing 06-goals.png...');
  await win.webContents.executeJavaScript(`
    const tabGoals = document.querySelector('#tab-goals') || document.querySelector('[data-testid="tab-goals"]');
    if (tabGoals) tabGoals.click();
  `);
  await sleep(1200);
  await win.webContents.executeJavaScript('window.scrollTo(0, 0);');
  await sleep(400);
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, '06-goals.png'), img.toPNG());

  // 7. Global Currency & Rates Modal
  console.log('Capturing 07-currency-modal.png...');
  await win.webContents.executeJavaScript(`
    const currBtn = document.querySelector('[data-testid="header-currency-button"]');
    if (currBtn) currBtn.click();
  `);
  await sleep(1000);
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, '07-currency-modal.png'), img.toPNG());

  console.log('All screenshots captured successfully!');
  win.close();
  app.quit();
}

app.whenReady().then(capture);
