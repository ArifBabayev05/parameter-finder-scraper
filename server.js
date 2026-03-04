const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

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

async function scrapeProduct(siteConfig, query) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: process.env.HEADLESS === 'false' ? false : "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        });
        const page = await browser.newPage();

        // Block heavy media and tracking scripts that often cause timeouts
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
        await page.setDefaultNavigationTimeout(45000);

        const targetUrl = siteConfig.ddgSite
            ? `https://html.duckduckgo.com/html/?q=site:${siteConfig.ddgSite}+${encodeURIComponent(query)}`
            : (siteConfig.searchUrl ? siteConfig.searchUrl.replace('{{query}}', encodeURIComponent(query)) : siteConfig.url);

        console.log(`[${siteConfig.name}] Opening: ${targetUrl}`);

        const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' }).catch(e => console.log(`[${siteConfig.name}] Navigation warning: ${e.message}`));

        // Anti-bot bypass delay
        await new Promise(r => setTimeout(r, 2000));

        let firstLink;

        if (siteConfig.ddgSite) {
            // Extract from DuckDuckGo
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
            // General Smart Link Discovery for GSMArena
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

        if (!firstLink) throw new Error("Product link not found in results");

        console.log(`[${siteConfig.name}] Loading details: ${firstLink}`);
        // Navigate to details
        await page.goto(firstLink, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(e => {
            console.log(`[${siteConfig.name}] Details page load warning: ${e.message}`);
        });

        // CRITICAL: Handle "Show All" / "Все характеристики"
        await page.evaluate(async (showMoreLabels) => {
            const clickElementByText = (texts) => {
                const elements = Array.from(document.querySelectorAll('button, a, span, label, div'));
                for (const text of texts) {
                    const found = elements.find(el => (el.innerText || "").toLowerCase().trim() === text.toLowerCase().trim() || (el.innerText || "").toLowerCase().includes(text.toLowerCase()));
                    if (found) {
                        found.click();
                        return true;
                    }
                }
                return false;
            };

            const labels = showMoreLabels || [
                'все характеристики',
                'все параметры',
                'полные характеристики',
                'показать все',
                'show all',
                'full specifications',
                'характеристики'
            ];
            clickElementByText(labels);
        }).catch(() => { });

        // Wait for potential content expansion
        await new Promise(r => setTimeout(r, 3000));

        const extractedData = await page.evaluate((params) => {
            const results = {};

            const findValueForLabel = (labelSynonyms, paramName) => {
                const host = window.location.host.toLowerCase();

                // specialized GSMArena Logic
                if (host.includes('gsmarena')) {
                    const ttlElements = Array.from(document.querySelectorAll('.ttl'));
                    for (const ttl of ttlElements) {
                        const ttlText = (ttl.innerText || "").trim().toLowerCase();
                        for (const syn of labelSynonyms) {
                            if (ttlText === syn.toLowerCase()) {
                                const valEl = ttl.nextElementSibling;
                                if (valEl && valEl.classList.contains('nfo')) return valEl.innerText.trim();
                            }
                        }
                    }

                    if (["Barmaq izi oxuyucusu", "Akselerometr", "Barometr", "Giroskop", "İşıq sensoru", "Yaxınlaşdırma sensoru"].includes(paramName)) {
                        const sensorTTL = ttlElements.find(t => t.innerText.toLowerCase().includes('sensors'));
                        if (sensorTTL) {
                            const val = sensorTTL.nextElementSibling?.innerText || "";
                            let foundSpecific = false;
                            for (const syn of labelSynonyms) {
                                if (val.toLowerCase().includes(syn.toLowerCase())) {
                                    foundSpecific = true;
                                    break;
                                }
                            }
                            if (foundSpecific) return val;
                        }
                    }

                    if (paramName === "Operativ yaddaş" || paramName === "Daxili yaddaş") {
                        const internalTTL = ttlElements.find(t => t.innerText.toLowerCase() === 'internal');
                        if (internalTTL) {
                            const fullVal = internalTTL.nextElementSibling?.innerText || "";
                            if (paramName === "Operativ yaddaş" && (fullVal.includes('RAM') || fullVal.includes('GB'))) {
                                const ramMatch = fullVal.match(/(\d+GB)\s+RAM/) || fullVal.match(/(\d+\s+GB)\s+RAM/) || fullVal.match(/(\d+)\s+RAM/);
                                if (ramMatch) return ramMatch[1] + (ramMatch[1].includes('GB') ? '' : 'GB');
                                return fullVal.split(',')[0].trim();
                            }
                            return fullVal.split(',')[0].trim();
                        }
                    }
                }

                // specialized DeviceSpecifications and Gadgets360 Logic
                if (host.includes('devicespecifications') || host.includes('gadgets360')) {
                    const tables = Array.from(document.querySelectorAll('table, .specs-table, .specifications-table, ._tbl'));
                    for (const table of tables) {
                        const rows = Array.from(table.querySelectorAll('tr, .table-row'));
                        for (const row of rows) {
                            const cells = Array.from(row.querySelectorAll('td, th, .table-cell'));
                            if (cells.length >= 2) {
                                const label = cells[0].innerText.trim().toLowerCase();
                                for (const syn of labelSynonyms) {
                                    if (label === syn.toLowerCase() || label.includes(syn.toLowerCase())) {
                                        return cells[cells.length - 1].innerText.trim();
                                    }
                                }
                            }
                        }
                    }
                }

                // specialized NanoReview Logic
                if (host.includes('nanoreview')) {
                    const specRows = Array.from(document.querySelectorAll('.cell-title, .cell-value'));
                    for (let i = 0; i < specRows.length; i++) {
                        const label = specRows[i].innerText.trim().toLowerCase();
                        for (const syn of labelSynonyms) {
                            if (label === syn.toLowerCase()) {
                                if (specRows[i + 1]) return specRows[i + 1].innerText.trim();
                            }
                        }
                    }
                }

                // specialized Kimovil Logic
                if (host.includes('kimovil')) {
                    const specLists = Array.from(document.querySelectorAll('.k-spec-list dt, .k-spec-list dd, .k-dl-row dt, .k-dl-row dd'));
                    for (let i = 0; i < specLists.length; i++) {
                        const text = specLists[i].innerText.toLowerCase();
                        for (const syn of labelSynonyms) {
                            if (text.includes(syn.toLowerCase()) && specLists[i + 1]) {
                                return specLists[i + 1].innerText.trim();
                            }
                        }
                    }
                }

                // General Logic
                const structuralElements = Array.from(document.querySelectorAll('tr, li, dt, .item, .spec-row, [class*="attr" i], [class*="spec" i]'));
                for (const row of structuralElements) {
                    const rowText = (row.innerText || "").toLowerCase();
                    for (const syn of labelSynonyms) {
                        const lowSyn = syn.toLowerCase();

                        const regex = new RegExp(`\\b${lowSyn}\\b`, 'i');
                        if (regex.test(rowText)) {
                            if (row.innerText.length > 500) continue;

                            if (row.tagName === 'DT' && row.nextElementSibling && row.nextElementSibling.tagName === 'DD') {
                                return row.nextElementSibling.innerText.trim();
                            }
                            if (row.tagName === 'TR') {
                                const cells = Array.from(row.querySelectorAll('td, th'));
                                if (cells.length > 1) return cells[cells.length - 1].innerText.trim();
                            }

                            let val = row.innerText.replace(new RegExp(syn, 'i'), '').trim();
                            val = val.replace(/^[:\-\s]+/, '').trim();
                            if (val && val.length > 0 && val.length < 200 && !val.includes('\n')) return val;
                        }
                    }
                }
                return null;
            };

            params.forEach(p => {
                results[p.name] = findValueForLabel(p.synonyms, p.name) || "Not found";
            });
            return results;
        }, parametersMap);

        await browser.close();
        console.log(`[${siteConfig.name}] Scraped successfully.`);
        return { site: siteConfig.name, success: true, data: extractedData, url: firstLink };
    } catch (error) {
        console.error(`[${siteConfig.name}] Error: ${error.message}`);
        if (browser) await browser.close();
        return { site: siteConfig.name, success: false, error: error.message };
    }
}

app.post('/scrape', async (req, res) => {
    const { query, sites } = req.body;
    if (!query) return res.status(400).send({ error: "Query is required" });

    const activeSites = sites ? siteConfigs.filter(s => sites.includes(s.name)) : siteConfigs;

    console.log(`Starting PARALLEL scraping for: ${query} on ${activeSites.length} sites...`);

    // Execute all site scrapers in parallel for maximum speed
    const finalResults = await Promise.all(activeSites.map(site => scrapeProduct(site, query)));

    // Calculate Consensus (Most Frequent Values)
    const consensus = {};
    parametersMap.forEach(p => {
        const values = finalResults
            .filter(r => r.success && r.data[p.name] && r.data[p.name] !== "Not found")
            .map(r => r.data[p.name]);

        if (values.length > 0) {
            // Simple frequency count
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

    res.send({
        message: "Scraping completed",
        results: finalResults,
        consensus: consensus,
        parameters: parametersMap,
        file: fileName
    });
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
