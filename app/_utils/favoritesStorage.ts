import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "FAVORITI";

export type FavoriteItem = {
  id: string;
  titolo: string;
  poster_path?: string;
  image?: string;
  anno?: number;
};

function normalizeSerie(item: any): FavoriteItem {
  return {
    id: String(item.id),
    titolo: item.titolo || item.title || "Senza titolo",
    poster_path: item.poster_path,
    image: item.image,
    anno: item.anno,
  };
}

export async function getFavorites(): Promise<FavoriteItem[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  console.log("Sono nella get favoriti"); 
  return json ? JSON.parse(json) : [];
}

export async function saveFavorite(item: any): Promise<void> {
  console.log("Sono nella salva favoriti"); 

  const favorites = await getFavorites();
  const cleanedItem = normalizeSerie(item);

  // ⚠️ controllo ID su stringa, sempre
  const exists = favorites.some((f) => String(f.id) === String(cleanedItem.id));

  const updated = exists
  ? favorites.map((f) =>
      String(f.id) === String(cleanedItem.id) ? cleanedItem : f
    )
  : [...favorites, cleanedItem];


  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function isFavorite(id: string): Promise<boolean> {
  console.log("Sono nella verifica favoriti"); 

  const favorites = await getFavorites();
  return favorites.some((f) => String(f.id) === String(id));
}

export async function removeFavorite(id: string): Promise<void> {
  console.log("Sono nella rimuovi  favoriti"); 

  const favorites = await getFavorites();
  const updated = favorites.filter((f) => String(f.id) !== String(id));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function clearFavorites(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

