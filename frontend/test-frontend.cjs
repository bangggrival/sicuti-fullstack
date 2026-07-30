const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  // Try to login if not logged in
  try {
    await page.type('input[type="text"]', 'bambang.s');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {}

  console.log('Navigating to Manajemen Akun');
  // Just navigate to the hash or click the link
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('Manajemen Akun'));
    if (link) link.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
