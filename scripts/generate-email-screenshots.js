/**
 * Generate PNG Screenshots from Email HTML Previews
 * Creates desktop (600px) and mobile (390px) screenshots for all email previews
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(process.cwd(), 'email-previews');
const OUTPUT_DIR = INPUT_DIR;

async function generateScreenshots() {
  console.log('📸 Generating PNG screenshots from HTML previews...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const htmlFiles = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.html'));
  
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(INPUT_DIR, htmlFile);
    const baseName = htmlFile.replace('.html', '');
    
    console.log(`Processing: ${htmlFile}`);
    
    // Desktop screenshot (600px width)
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 700, height: 1200, deviceScaleFactor: 2 });
    await desktopPage.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    const desktopPng = path.join(OUTPUT_DIR, `${baseName}-desktop.png`);
    await desktopPage.screenshot({ path: desktopPng, fullPage: true });
    await desktopPage.close();
    console.log(`  ✅ Desktop: ${baseName}-desktop.png`);
    
    // Mobile screenshot (390px width)
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await mobilePage.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    const mobilePng = path.join(OUTPUT_DIR, `${baseName}-mobile.png`);
    await mobilePage.screenshot({ path: mobilePng, fullPage: true });
    await mobilePage.close();
    console.log(`  ✅ Mobile: ${baseName}-mobile.png`);
  }
  
  await browser.close();
  
  console.log('\n✨ All PNG screenshots generated successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`\nGenerated ${htmlFiles.length * 2} PNG files total`);
}

generateScreenshots().catch(error => {
  console.error('\n❌ Error generating screenshots:', error);
  process.exit(1);
});
