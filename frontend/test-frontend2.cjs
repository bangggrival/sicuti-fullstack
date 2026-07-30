const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    // wait for input
    await page.waitForSelector('input[placeholder="Masukkan NIP atau Username"]');
    await page.type('input[placeholder="Masukkan NIP atau Username"]', '199001012024018691');
    await page.type('input[placeholder="Masukkan Password"]', '123456');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.log('Login failed', e);
  }

  console.log('Navigating to Manajemen Akun');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent.includes('Manajemen Akun'));
    if (link) link.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
