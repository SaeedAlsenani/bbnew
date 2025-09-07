export async function fetchGiftPrices(collections: string[]) {
  const query = collections.join(",");
  const response = await fetch(
    `https://physbubble-bot.onrender.com/api/gifts?target_items=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("فشل في جلب بيانات الهدايا");
  }

  return response.json();
}
