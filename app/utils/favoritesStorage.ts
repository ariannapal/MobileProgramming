import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'FAVORITI';

export async function getFavorites(): Promise<any[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveFavorite(item: any): Promise<void> {
  const favorites = await getFavorites();
  const exists = favorites.find((f) => f.id === item.id);
  const updated = exists
    ? favorites.filter((f) => f.id !== item.id)
    : [...favorites, item];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function isFavorite(id: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((f) => f.id === id);
}
