const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// List of sites and their selectors
const siteConfigs = [
    {
        name: "GSMArena",
        url: "https://www.gsmarena.com/",
        searchUrl: "https://www.gsmarena.com/res.php3?sSearch={{query}}",
        resultSelector: ".makers li a"
    },
    {
        name: "NanoReview",
        url: "https://nanoreview.net/en/phone",
        ddgSite: "nanoreview.net/en/phone"
    },
    {
        name: "Kimovil",
        url: "https://www.kimovil.com/en/",
        ddgSite: "kimovil.com"
    }
];

const parametersMap = [
    // { name: "Brend", synonyms: ["Бренд", "Brend", "Brand", "Производитель", "İstehsalçı", "Brand Name"] },
    { name: "Əməliyyat sistemin versiyası", synonyms: ["Версия операционной системы", "OS Version", "Əməliyyat sistemin versiyası", "Версия ОС", "OS", "Operating system", "Skin", "Software"] },
    { name: "Korpusun materialı", synonyms: ["Материал корпуса", "Body material", "Материал", "Build", "Materials", "Frame", "Design"] },
    { name: "Nüvə sayı", synonyms: ["Количество ядер", "Number of cores", "Nüvə sayı", "CPU", "Cores", "Processor cores"] },
    { name: "SIM-kart sayı", synonyms: ["Количество SIM-карт", "SIM count", "SIM-карты", "SIM", "Number of SIM cards", "Number of SIMs", "Dual SIM"] },
    // { name: "SIM-kart növü", synonyms: ["Вид SIM-карты", "SIM card type", "Формат SIM-карты", "SIM type", "SIM Type"] },
    { name: "İstehsal ili", synonyms: ["Год выпуска", "Release year", "Announced", "Launch date", "Release date"] },
    { name: "Barmaq izi oxuyucusu", synonyms: ["Сканер отпечатков пальцев", "Fingerprint", "Barmaq izi", "Fingerprint sensor", "In-Display Fingerprint Sensor"] },
    { name: "Görüntü imkanı", synonyms: ["Разрешение экрана", "Resolution", "Görüntü imkanı", "Display resolution", "Screen resolution"] },
    { name: "Operativ yaddaş", synonyms: ["Оперативная память", "RAM", "RAM size", "Operativ yaddaş", "Объем оперативной памяти", "Memory"] },
    { name: "Şəbəkə standartı", synonyms: ["Стандарт связи", "Network standard", "Technology", "Mobile networks", "Network technology", "Band", "Networking"] },
    { name: "Simsiz enerji", synonyms: ["Беспроводная зарядка", "Wireless charging", "Simsiz enerji", "Wireless Charging Type"] },
    // { name: "İnfraqırmızı port", synonyms: ["Инфракрасный порт", "Infrared port", "IR port"] },
    // { name: "Üz tanıma", synonyms: ["Идентификация по лицу", "Face ID", "Üz tanıma", "Face recognition", "Face unlock"] },
    { name: "Sürətli enerji yığma", synonyms: ["Быстрая зарядка", "Fast charging", "Sürətli enerji yığma", "Fast charge"] },
    { name: "Qorunma dərəcəsi", synonyms: ["Степень защиты", "Protection rating", "IP68", "IP67", "Waterproof", "IP rating", "Protection type"] },
    { name: "Prosessorun adı", synonyms: ["Название процессора", "Processor name", "Chipset", "SoC", "Processor make", "Processor model"] },
    { name: "Ölçülər", synonyms: ["Размеры", "Dimensions", "Габариты", "Size", "Dimensions (mm)"] },
    { name: "Komplektasiya", synonyms: ["Комплектация", "In the box", "Included", "Box contents"] },
    { name: "Çəki", synonyms: ["Вес", "Weight", "Çəki", "Weight (g)"] },
    // { name: "Seriya", synonyms: ["Серия", "Series", "Модельный ряд", "Model family"] },
    { name: "Yaddaş kartı dəstəyi", synonyms: ["Слот для карты памяти", "Memory card slot", "Card slot", "SD card", "Expandable storage"] },
    { name: "Barometr", synonyms: ["Барометр", "Barometer"] },
    { name: "Giroskop", synonyms: ["Гироскоп", "Gyroscope"] },
    { name: "İşıq sensoru", synonyms: ["Датчик освещенности", "Light sensor", "Ambient light", "Ambient light sensor"] },
    { name: "Yaxınlaşdırma sensoru", synonyms: ["Датчик приближения", "Proximity sensor", "Proximity"] },
    { name: "Optik sabitləşmə", synonyms: ["Оптическая стабилизация", "Optical stabilization", "OIS"] },
    // { name: "Video formatı", synonyms: ["Формат видеосъемки", "Video recording", "Video capture", "Video formats"] },
    { name: "Bluetooth versiyası", synonyms: ["Версия Bluetooth", "Bluetooth version", "Bluetooth"] },
    { name: "Avtofokus əsas kamera", synonyms: ["Автофокусировка основной камеры", "Main camera autofocus", "PDAF", "Autofocus"] },
    { name: "Video icazəsi və kadr tezliyi", synonyms: ["Разрешение видео и частота кадров", "Video resolution", "Video"] },
    { name: "Video asta çəkiliş", synonyms: ["Замедленная видеосъемка", "Slow-mo", "Slow motion"] },
    { name: "Rəng", synonyms: ["Цвет", "Color", "Colors", "Colours"] },
    // { name: "Enerji toplama növü", synonyms: ["Тип питания", "Power type"] },
    { name: "Qulaqlıq interfeysi", synonyms: ["Интерфейс наушников", "Headphone jack", "3.5mm jack", "Audio jack", "Headphones"] },
    { name: "Batareya növü", synonyms: ["Тип аккумулятора", "Battery type", "Battery"] },
    // { name: "Çıxarıla bilən batareya", synonyms: ["Съемный аккумулятор", "Removable battery"] },
    { name: "Akselerometr", synonyms: ["Акселерометр", "Accelerometer"] },
    { name: "Enerji yığma gücü", synonyms: ["Мощность зарядки", "Charging power", "Charging"] },
    { name: "Ekran", synonyms: ["Экран", "Screen", "Display", "Screen size (inches)"] },
    // { name: "Displey növü", synonyms: ["Вид дисплея", "Display type", "Panel type", "Screen type"] },
    // { name: "Prosessorun növü", synonyms: ["Вид процессора", "Processor type", "CPU architecture"] },
    { name: "Daxili yaddaş", synonyms: ["Встроенная память", "Internal storage", "Storage", "Internal", "ROM"] },
    { name: "Əsas kamera", synonyms: ["Основная камера", "Rear camera", "Main Camera", "Camera"] },
    { name: "Ön kamera", synonyms: ["Фронтальная камера", "Selfie camera", "Front camera"] },
    { name: "Akkumulyatorun tutumu", synonyms: ["Емкость аккумулятора", "Battery capacity", "mAh", "Capacity", "Battery capacity (mAh)"] },
    { name: "Əməliyyat sistemi", synonyms: ["Операционная система", "Operating system", "Platform"] },
    { name: "NFC", synonyms: ["NFC"] },
    // { name: "Zəmanət", synonyms: ["Гарантия", "Warranty"] }
];

async function getSystemChromePath() {
    const paths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser"
    ];

    for (const path of paths) {
        if (fs.existsSync(path)) return path;
    }
    return null;
}

async function scrapeProduct(browser, siteConfig, query) {
    const page = await browser.newPage();
    try {
        // Block heavy media and tracking scripts
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url().toLowerCase();
            const resourceType = req.resourceType();
            const isTracker = url.includes('google-analytics') || url.includes('facebook') || url.includes('doubleclick') || url.includes('analytics');
            if (['image', 'font', 'media'].includes(resourceType) || isTracker) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setDefaultNavigationTimeout(50000);

        const targetUrl = siteConfig.ddgSite
            ? `https://html.duckduckgo.com/html/?q=site:${siteConfig.ddgSite}+${encodeURIComponent(query)}`
            : (siteConfig.searchUrl ? siteConfig.searchUrl.replace('{{query}}', encodeURIComponent(query)) : siteConfig.url);

        console.log(`[${siteConfig.name}] Opening: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 50000 }).catch(e => console.log(`[${siteConfig.name}] Navigation warning: ${e.message}`));

        // Anti-bot bypass delay
        await new Promise(r => setTimeout(r, 2000));

        let firstLink;
        if (siteConfig.ddgSite) {
            firstLink = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('.result__url'));
                if (links.length > 0) {
                    const href = links[0].getAttribute('href');
                    if (href && href.includes('uddg=')) {
                        try {
                            const urlParams = new URL(href, 'https://duckduckgo.com').searchParams;
                            return decodeURIComponent(urlParams.get('uddg'));
                        } catch (e) { }
                    }
                }
                return null;
            });
        } else {
            firstLink = await page.evaluate((selector, queryText) => {
                const tokens = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);
                let links = selector ? Array.from(document.querySelectorAll(selector)) : Array.from(document.querySelectorAll('a'));
                const rankedLinks = links.map(a => {
                    const text = (a.innerText || "").toLowerCase();
                    const score = tokens.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
                    return { href: a.href, score, text };
                }).filter(l => l.score > 0 || l.text.length > 5);
                rankedLinks.sort((a, b) => b.score - a.score || a.text.length - b.text.length);
                return rankedLinks[0]?.href;
            }, siteConfig.resultSelector, query);
        }

        if (!firstLink) throw new Error("Link tapılmadı");

        console.log(`[${siteConfig.name}] Loading details: ${firstLink}`);
        await page.goto(firstLink, { waitUntil: 'domcontentloaded', timeout: 50000 });

        // Handle "Show All"
        await page.evaluate(async () => {
            const texts = ["Və daha çox", "Все характеристики", "Full specs", "Show all", "See detailed", "Expand"];
            const elements = Array.from(document.querySelectorAll('button, a, span'));
            for (const text of texts) {
                const found = elements.find(el => el.innerText.toLowerCase().includes(text.toLowerCase()));
                if (found) { found.click(); break; }
            }
        });

        await new Promise(r => setTimeout(r, 4000));

        const extractedData = await page.evaluate((params, parametersMap) => {
            const results = {};
            const findValueForLabel = (labelSynonyms, paramName) => {
                const host = window.location.hostname;
                const ttlElements = Array.from(document.querySelectorAll('.ttl, .label, dt, th, td, .cell-title, .k-spec-list dt, .k-dl-row dt, span, li'));

                for (const syn of labelSynonyms) {
                    const found = ttlElements.find(el => el.innerText.toLowerCase().trim() === syn.toLowerCase().trim() || el.innerText.toLowerCase().includes(syn.toLowerCase()));
                    if (found) {
                        let val = "";
                        if (found.nextElementSibling) val = found.nextElementSibling.innerText.trim();
                        else if (found.parentElement?.nextElementSibling) val = found.parentElement.nextElementSibling.innerText.trim();
                        else if (found.tagName === 'TD' && found.nextElementSibling) val = found.nextElementSibling.innerText.trim();

                        if (val && val.length < 500) return val;
                    }
                }

                // Fallback for tables
                const rows = Array.from(document.querySelectorAll('tr, li, .item'));
                for (const row of rows) {
                    const text = row.innerText.toLowerCase();
                    for (const syn of labelSynonyms) {
                        if (text.includes(syn.toLowerCase())) {
                            let val = row.innerText.replace(new RegExp(syn, 'i'), '').trim();
                            val = val.replace(/^[:\-\s]+/, '').trim();
                            if (val && val.length < 200 && !val.includes('\n')) return val;
                        }
                    }
                }
                return null;
            };

            parametersMap.forEach(p => {
                results[p.name] = findValueForLabel(p.synonyms, p.name) || "Not found";
            });
            return results;
        }, parametersMap);

        await page.close();
        console.log(`[${siteConfig.name}] Done.`);
        return { site: siteConfig.name, success: true, data: extractedData, url: firstLink };
    } catch (error) {
        console.error(`[${siteConfig.name}] Error: ${error.message}`);
        await page.close().catch(() => { });
        return { site: siteConfig.name, success: false, error: error.message };
    }
}

app.post('/scrape', async (req, res) => {
    const { query, sites } = req.body;
    if (!query) return res.status(400).send({ error: "Query is required" });

    const activeSites = sites ? siteConfigs.filter(s => sites.includes(s.name)) : siteConfigs;
    console.log(`Starting SEQUENTIAL scraping for: ${query} on ${activeSites.length} sites...`);

    let browser;
    const finalResults = [];

    try {
        const chromePath = await getSystemChromePath();
        browser = await puppeteer.launch({
            headless: process.env.HEADLESS === 'false' ? false : "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            executablePath: chromePath || process.env.PUPPETEER_EXECUTABLE_PATH || null
        });

        // Run one by one to save RAM on Render Free Tier
        for (const site of activeSites) {
            const result = await scrapeProduct(browser, site, query);
            finalResults.push(result);
        }

    } catch (err) {
        console.error("Global Scrape Error:", err);
    } finally {
        if (browser) await browser.close();
    }

    const consensus = {};
    parametersMap.forEach(p => {
        const values = finalResults.filter(r => r.success && r.data[p.name] && r.data[p.name] !== "Not found").map(r => r.data[p.name]);
        if (values.length > 0) {
            const counts = {};
            values.forEach(v => counts[v] = (counts[v] || 0) + 1);
            consensus[p.name] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        } else {
            consensus[p.name] = "Not found";
        }
    });

    // Generate Text Report
    let report = `### SCRAPING REPORT FOR: ${query}\n`;
    report += `Date: ${new Date().toLocaleString()}\n\n`;

    report += `[ CONSENSUS / BEST MATCH ]\n`;
    parametersMap.forEach(p => {
        report += `${p.name}: ${consensus[p.name]}\n`;
    });
    report += `------------------------------------\n\n`;

    finalResults.forEach(res => {
        report += `[ SITE: ${res.site} ]\n`;
        if (res.success) {
            parametersMap.forEach(p => {
                report += `${p.name}: ${res.data[p.name]}\n`;
            });
        } else {
            report += `Error: ${res.error}\n`;
        }
        report += `------------------------------------\n\n`;
    });

    const fileName = `scrape_results_${Date.now()}.txt`;
    await fs.writeFile(path.join(__dirname, fileName), report);

    res.send({ results: finalResults, consensus: consensus, parameters: parametersMap, file: fileName });
});

app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send("File not found");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
