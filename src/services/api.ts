// src/services/api.ts
const API_BASE = (import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'https://physbubble-bot.onrender.com/api');

function withTimeout(fetchPromise: Promise<Response>, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return fetchPromise.finally(() => clearTimeout(timeoutId));
}

function setCache(key: string, data: any, ttlSeconds: number) {
  const payload = {
    ts: Date.now(),
    ttl: ttlSeconds * 1000,
    data
  };
  localStorage.setItem(key, JSON.stringify(payload));
}

function getCache(key: string): any {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  
  try {
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts < parsed.ttl) {
      return parsed.data;
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export interface Collection {
  name: string;
  // يمكن إضافة حقول أخرى إذا كانت موجودة في API
}

export async function fetchCollections(): Promise<string[]> {
  const CACHE_KEY = 'phys_collections_v1';
  const cached = getCache(CACHE_KEY);
  if (cached) return cached;

  const url = `${API_BASE}/collections`;
  try {
    const res = await withTimeout(fetch(url, { method: 'GET' }), 5000);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const json = await res.json();
    
    // محاولة استخراج المجموعات بطرق مختلفة للتوافق
    let collections: string[] = [];
    
    if (Array.isArray(json)) {
      // إذا كان الرد مصفوفة مباشرة
      collections = json.map(item => typeof item === 'string' ? item : item.name);
    } else if (json.collections && Array.isArray(json.collections)) {
      // إذا كان الرد يحتوي على خاصية collections
      collections = json.collections.map((item: any) => typeof item === 'string' ? item : item.name);
    } else if (json.gift_models && Array.isArray(json.gift_models)) {
      // إذا كان الرد يحتوي على gift_models
      collections = json.gift_models.map((item: any) => typeof item === 'string' ? item : item.name);
    }
    
    // تصفية القيم غير الصالحة
    collections = collections.filter((item): item is string => 
      typeof item === 'string' && item.trim() !== ''
    );
    
    if (collections.length > 0) {
      setCache(CACHE_KEY, collections, 300); // 5 دقائق
    }
    
    return collections;
  } catch (err) {
    console.error('Failed to fetch collections:', err);
    throw err;
  }
}

export async function fetchGiftPrices(collections: string[]): Promise<any> {
  if (collections.length === 0) {
    return { gifts: [] };
  }
  
  const cacheKey = `phys_gifts_${collections.sort().join(',')}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const query = collections.map(col => encodeURIComponent(col)).join(',');
  const url = `${API_BASE}/gifts?target_items=${query}`;
  
  try {
    const res = await withTimeout(fetch(url, { method: 'GET' }), 10000);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const json = await res.json();
    setCache(cacheKey, json, 60); // 1 دقيقة
    return json;
  } catch (err) {
    console.error('Failed to fetch gift prices:', err);
    throw err;
  }
}
