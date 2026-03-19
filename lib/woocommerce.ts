import { SyncedProduct, setProducts, setSyncLog } from './store';

interface WCProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  short_description: string;
  description: string;
  categories: { name: string }[];
  images: { src: string }[];
  stock_status: string;
  status: string;
  meta_data: { key: string; value: string }[];
}

const META_KEYS = [
  '_wp_subtitle',
  '_wp_highlights',
  '_wp_specs',
  '_wp_faq',
  '_wp_bonus_title',
  '_wp_bonus_text',
  '_wp_cta_text',
  '_wc_badge',
  '_wc_cat',
  '_wc_plabel',
];

function getMeta(product: WCProduct, key: string): string {
  const meta = product.meta_data?.find((m) => m.key === key);
  return meta?.value || '';
}

async function fetchWCProducts(): Promise<WCProduct[]> {
  const baseUrl = process.env.WC_STORE_URL!;
  const ck = process.env.WC_CONSUMER_KEY!;
  const cs = process.env.WC_CONSUMER_SECRET!;

  const allProducts: WCProduct[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${baseUrl}/wp-json/wc/v3/products?consumer_key=${ck}&consumer_secret=${cs}&per_page=${perPage}&page=${page}&status=publish`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`WooCommerce API error: ${res.status} ${res.statusText}`);
    }

    const products: WCProduct[] = await res.json();
    if (products.length === 0) break;

    allProducts.push(...products);

    // Check if there are more pages
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
    if (page >= totalPages) break;
    page++;
  }

  return allProducts;
}

function transformProduct(wc: WCProduct): SyncedProduct {
  return {
    id: wc.id,
    name: wc.name,
    slug: wc.slug,
    price: wc.price,
    regularPrice: wc.regular_price,
    salePrice: wc.sale_price,
    shortDescription: wc.short_description,
    description: wc.description,
    categories: wc.categories.map((c) => c.name),
    image: wc.images?.[0]?.src || '',
    inStock: wc.stock_status === 'instock',
    // Woopify custom fields from meta_data
    subtitle: getMeta(wc, '_wp_subtitle'),
    highlights: getMeta(wc, '_wp_highlights'),
    specs: getMeta(wc, '_wp_specs'),
    faq: getMeta(wc, '_wp_faq'),
    bonusTitle: getMeta(wc, '_wp_bonus_title'),
    bonusText: getMeta(wc, '_wp_bonus_text'),
    ctaText: getMeta(wc, '_wp_cta_text'),
    badge: getMeta(wc, '_wc_badge'),
    category: getMeta(wc, '_wc_cat'),
    priceLabel: getMeta(wc, '_wc_plabel'),
  };
}

export async function syncProducts(): Promise<{ count: number; message: string }> {
  try {
    const wcProducts = await fetchWCProducts();
    const products = wcProducts.map(transformProduct);

    await setProducts(products);
    await setSyncLog({
      lastSync: new Date().toISOString(),
      productCount: products.length,
      status: 'success',
      message: `Sincronizzati ${products.length} prodotti`,
    });

    return { count: products.length, message: `Sincronizzati ${products.length} prodotti` };
  } catch (error: any) {
    const message = error?.message || 'Errore sconosciuto durante la sync';
    await setSyncLog({
      lastSync: new Date().toISOString(),
      productCount: 0,
      status: 'error',
      message,
    });
    throw error;
  }
}
