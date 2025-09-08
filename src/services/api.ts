export interface Collection {
  name: string;
  image_url: string;
  count: number;
  floor: string;
}

export async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch("https://physbubble-bot.onrender.com/api/collections");

  if (!response.ok) {
    throw new Error("فشل في جلب قائمة المجموعات");
  }

  const data = await response.json();
  return data.collections || [];
}
