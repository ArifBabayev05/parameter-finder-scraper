const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

async function getSpecsList(url, siteName) {
    console.log("Analyzing:", siteName);
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 4000));

        let dump = [];
        if (siteName === 'GSMArena') {
            dump = await page.$$eval('.ttl', els => els.map(el => {
                let nfo = el.nextElementSibling ? el.nextElementSibling.innerText : '';
                return { key: el.innerText.trim(), value: nfo.trim() };
            }));
        } else if (siteName === 'NanoReview') {
            dump = await page.$$eval('.cell-title', els => els.map(el => {
                let nfo = el.nextElementSibling ? el.nextElementSibling.innerText : '';
                return { key: el.innerText.trim(), value: nfo.trim() };
            }));
        } else if (siteName === 'Gadgets360') {
            dump = await page.$$eval('table tr, ._tbl tr', els => els.map(el => {
                const td = el.querySelectorAll('td, th');
                if (td.length >= 2) return { key: td[0].innerText.trim(), value: td[td.length - 1].innerText.trim() };
                return null;
            }).filter(Boolean));
        } else if (siteName === 'Kimovil') {
            dump = await page.$$eval('.k-spec-list dt, .k-dl-row dt', els => els.map(el => {
                let nfo = el.nextElementSibling ? el.nextElementSibling.innerText : '';
                return { key: el.innerText.trim(), value: nfo.trim() };
            }));
        }

        fs.writeFileSync(`${siteName}_specs.json`, JSON.stringify(dump, null, 2));
        console.log(`Saved ${siteName}_specs.json`);
    } catch (e) {
        console.log('Error', e);
    }
    await browser.close();
}

(async () => {
    await getSpecsList("https://www.gsmarena.com/samsung_galaxy_s24_ultra-12771.php", "GSMArena");
    await getSpecsList("https://nanoreview.net/en/phone/samsung-galaxy-s24-ultra", "NanoReview");
    await getSpecsList("https://www.gadgets360.com/samsung-galaxy-s24-ultra-price-in-india-135780", "Gadgets360");
    await getSpecsList("https://www.kimovil.com/en/where-to-buy-samsung-galaxy-s24-ultra", "Kimovil");
})();
