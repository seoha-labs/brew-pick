import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

interface MenuItem {
  id: string;
  franchiseId: string;
  name: string;
  category: string;
  imageUrl: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');

// --- Ediya ---
// product_cate: 7=커피, 10=티
const EDIYA_CATEGORIES = [
  { code: '7', name: '커피' },
  { code: '10', name: '티' },
];

async function crawlEdiya(): Promise<MenuItem[]> {
  const items: MenuItem[] = [];
  let idCounter = 1;

  for (const category of EDIYA_CATEGORIES) {
    let page = 1;

    while (true) {
      const res = await fetch('https://ediya.com/inc/ajax_brand.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          gubun: 'menu_more',
          product_cate: category.code,
          page: String(page),
        }),
      });

      const html = await res.text();
      if (!html.trim() || html.trim() === '0') break;

      // Parse <li> blocks containing menu items
      // Structure: <li>...<a><img src="..."/></a><div class="menu_tt"><a><span>메뉴이름</span></a></div></li>
      const liRegex = /<li>([\s\S]*?)<\/li>/g;
      let liMatch;
      let foundInPage = 0;

      while ((liMatch = liRegex.exec(html)) !== null) {
        const block = liMatch[1];

        // Extract name from .menu_tt > a > span
        const nameMatch = /<div[^>]*class="menu_tt"[^>]*>\s*<a[^>]*>\s*<span>([^<]+)<\/span>/i.exec(block);
        if (!nameMatch) continue;

        // Extract image
        const imgMatch = /<img[^>]*src=["']([^"']*\/files\/menu\/[^"']*)["']/i.exec(block);
        const imageUrl = imgMatch
          ? imgMatch[1].startsWith('http')
            ? imgMatch[1]
            : `https://ediya.com${imgMatch[1]}`
          : '';

        const name = nameMatch[1].trim();
        if (!name) continue;

        // Deduplicate by name within this franchise
        if (!items.some((i) => i.franchiseId === 'ediya' && i.name === name)) {
          items.push({
            id: `ediya-${idCounter++}`,
            franchiseId: 'ediya',
            name,
            category: category.name,
            imageUrl,
          });
          foundInPage++;
        }
      }

      if (foundInPage === 0) break;
      page++;
      if (page > 20) break;
    }
  }

  return items;
}

// --- Twosome ---
async function crawlTwosome(): Promise<MenuItem[]> {
  const items: MenuItem[] = [];
  let idCounter = 1;
  const seen = new Set<string>();

  let pageNum = 1;

  while (true) {
    const res = await fetch(
      'https://mo.twosome.co.kr/mn/menuInfoListAjax.json',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grtCd: '1',
          pageNum: String(pageNum),
        }),
      },
    );

    const data = await res.json();
    const menuList = data.fetchResultListSet ?? [];
    if (!Array.isArray(menuList) || menuList.length === 0) break;

    for (const m of menuList) {
      const name: string = m.MENU_NM ?? '';
      const menuCd: string = m.MENU_CD ?? '';
      const imgPath: string = m.MENU_IMG_02 ?? m.MENU_IMG ?? '';
      const midNm: string = m.MID_NM ?? '기타';

      if (!name || seen.has(menuCd)) continue;
      seen.add(menuCd);

      // Exclude: 아이스크림/빙수, 원두/티 상품
      const excludeCategories = ['아이스크림', '빙수', '원두', '티 상품'];
      const shouldExclude = excludeCategories.some(
        (cat) => midNm.includes(cat),
      );
      if (shouldExclude) continue;

      // Filter to drinks only (커피, 음료, 티 categories)
      const drinkCategories = ['커피', '음료', '티', '라떼', '스무디', '에이드', '주스', '티/라떼'];
      const isDrink = drinkCategories.some(
        (cat) => midNm.includes(cat) || name.includes('라떼') || name.includes('커피'),
      );
      if (!isDrink && !['커피/음료'].includes(m.GRT_NM ?? '')) continue;

      items.push({
        id: `twosome-${idCounter++}`,
        franchiseId: 'twosome',
        name,
        category: midNm,
        imageUrl: imgPath
          ? `https://mcdn.twosome.co.kr${imgPath}`
          : '',
      });
    }

    // Check if there's a next page
    const hasNext = menuList.some((m: Record<string, unknown>) => m.NEXT_PAGE === 1);
    if (!hasNext) break;

    pageNum++;
    if (pageNum > 10) break;
  }

  return items;
}

async function main() {
  console.log('Crawling menus...');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    console.log('Crawling Ediya...');
    const ediyaItems = await crawlEdiya();
    if (ediyaItems.length > 0) {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'ediya.json'),
        JSON.stringify(ediyaItems, null, 2),
      );
      console.log(`Ediya: ${ediyaItems.length} items`);
    } else {
      console.log('Ediya: No items found, keeping existing data');
    }
  } catch (err) {
    console.error('Ediya crawl failed:', err);
  }

  try {
    console.log('Crawling Twosome...');
    const twosomeItems = await crawlTwosome();
    if (twosomeItems.length > 0) {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'twosome.json'),
        JSON.stringify(twosomeItems, null, 2),
      );
      console.log(`Twosome: ${twosomeItems.length} items`);
    } else {
      console.log('Twosome: No items found, keeping existing data');
    }
  } catch (err) {
    console.error('Twosome crawl failed:', err);
  }

  console.log('Done!');
}

main();
