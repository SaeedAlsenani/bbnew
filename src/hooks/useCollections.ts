import { useState, useCallback } from 'react';

const FALLBACK_COLLECTIONS = [
  "Plush Pepe", "Eternal Candle", "Snoop Dogg", "Jingle Bells", "Pet Snake",
  "Tama Gadget", "Lunar Snake", "Snow Mittens", "Witch Hat", "Lol Pop",
  "Spy Agaric", "Bunny Muffin", "Low Rider", "Whip Cupcake", "Berry Box",
  "Swag Bag", "Precious Peach", "Light Sword", "Durov's Cap", "Bow Tie",
  "Candy Cane", "Heroic Helmet", "Sleigh Bell", "Snake Box", "Neko Helmet",
  "Diamond Ring", "Sakura Flower", "Westside Sign", "Evil Eye", "Record Player",
  "Skull Flower", "Easter Egg", "B-Day Candle", "Desk Calendar", "Star Notepad",
  "Joyful Bundle", "Plush Pepe", "Eternal Candle", "Snoop Dogg", "Sharp Tongue",
  "Snow Globe", "Holiday Drink", "Flying Broom", "Big Year", "Hypno Lollipop",
  "Genie Lamp", "Bonded Ring", "Spiced Wine", "Snoop Cigar", "Xmas Stocking",
  "Homemade Cake", "Toy Bear", "Vintage Cigar", "Signet Ring", "Gem Signet",
  "Lush Bouquet", "Santa Hat", "Winter Wreath", "Nail Bracelet", "Ginger Cookie",
  "Perfume Bottle", "Crystal Ball", "Mini Oscar", "Jelly Bunny", "Jester Hat",
  "Cookie Heart", "Jack-in-the-Box", "Hanging Star", "Trapped Heart", "Heart Locket",
  "Magic Potion", "Mad Pumpkin", "Party Sparkler", "Cupid Charm", "Kissed Frog",
  "Loot Bag", "Eternal Rose", "Love Candle", "Electric Skull", "Valentine Box",
  "Hex Pot", "Swiss Watch", "Top Hat", "Scared Cat", "Love Potion", "Astral Shard",
  "Ion Gem", "Voodoo Doll", "Restless Jar"
];

export const useCollections = () => {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollectionsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let collectionsData;
      try {
        console.log('🔍 جلب قائمة المجموعات من الكاش...');
        const { fetchCachedCollections } = await import('../services/api');
        const cachedResponse = await fetchCachedCollections();
        collectionsData = cachedResponse.collections;
        console.log('✅ تم جلب المجموعات من الكاش بنجاح:', collectionsData.length);
      } catch (cacheError) {
        console.warn('⚠️ فشل جلب المجموعات من الكاش، جاري المحاولة بالطريقة العادية', cacheError);
        const { fetchCollections } = await import('../services/api');
        const liveResponse = await fetchCollections();
        collectionsData = liveResponse.collections;
      }
      
      if (collectionsData && collectionsData.length > 0) {
        const collectionNames = collectionsData.map((col: any) => col.name);
        setCollections(collectionNames);
        console.log('تم جلب المجموعات بنجاح:', collectionNames.length);
      } else {
        console.warn('استجابة API للمجموعات فارغة، استخدام القائمة الافتراضية');
        setCollections(FALLBACK_COLLECTIONS);
      }
      
    } catch (err: any) {
      console.error("فشل في جلب قائمة المجموعات:", err);
      setError(`فشل في جلب قائمة المجموعات: ${err.message}`);
      setCollections(FALLBACK_COLLECTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    collections,
    loading,
    error,
    fetchCollectionsData
  };
};
