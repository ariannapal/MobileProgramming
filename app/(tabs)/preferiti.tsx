import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { clearFavorites, getFavorites } from "../utils/favoritesStorage";

// oppure un semplice <View style={styles.header} />

type FavoriteItem = {
  id: string;
  titolo?: string;
  title?: string;
  image?: string;
  poster_path?: string;
  userRating?: number;
};

export default function PreferitiScreen() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadFavorites = async () => {
        const data = await getFavorites();
        const valid = data.filter((item: any) => item?.id);

        const enriched = await Promise.all(
          valid.map(async (item) => {
            const ratingRaw = await AsyncStorage.getItem(
              `userRating-${item.id}`
            );
            const userRating = ratingRaw ? parseFloat(ratingRaw) : undefined;

            return { ...item, userRating };
          })
        );

        if (isActive) {
          setFavorites(enriched);
        }
      };

      loadFavorites();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem("serie.json");
      await clearFavorites();

      const keys = await AsyncStorage.getAllKeys();
      const ratingKeys = keys.filter((k) => k.startsWith("userRating-"));
      await AsyncStorage.multiRemove(ratingKeys);

      Alert.alert("Successo", "Tutti i dati sono stati cancellati");
      setFavorites([]);
    } catch (e) {
      console.error("Errore nella cancellazione dei dati", e);
    }
  };

  const renderStars = (rating?: number) => {
    if (rating == null) return null;

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Text key={`full-${i}`} style={{ color: "#f5c518" }}>
          ★
        </Text>
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Text key={`empty-${i}`} style={{ color: "#555" }}>
          ★
        </Text>
      );
    }

    return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
  };

  const renderItem = ({ item }: { item: FavoriteItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/serie/${item.id}`)}
    >
      <Image
        source={{
          uri: item.poster_path
            ? `https://image.tmdb.org/t/p/w185/${item.poster_path}`
            : item.image || "https://via.placeholder.com/120x180?text=?",
        }}
        style={styles.image}
      />
      <Text style={styles.title} numberOfLines={2}>
        {item.titolo || item.title}
      </Text>
      {renderStars(item.userRating)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {favorites.length === 0 ? (
        <Text style={styles.empty}>Non hai ancora aggiunto preferiti</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : `fallback-${index}`
          }
          numColumns={3} // 👈 griglia a 3 colonne
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Pulsante reset */}
      <TouchableOpacity
        onPress={clearAllData}
        style={{
          marginTop: 20,
          backgroundColor: "#444",
          padding: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ textAlign: "center", color: "#fff" }}>
          🧹 Reset AsyncStorage
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f0f2a", // sfondo generale
  },
  header: {
    paddingTop: 60,
    paddingBottom: 10,

    alignItems: "center",
    backgroundColor: "#6b4eff", // viola come nell’esempio Hobi
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },

  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: "#0f0f2a",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "left",
    color: "#fff",
  },
  grid: {
    paddingVertical: 10,
    gap: 8,
  },
  card: {
    flex: 1 / 3,
    margin: 6,
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#ccc",
  },
  title: {
    fontSize: 13,
    textAlign: "center",
    color: "#fff",
  },
  empty: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginTop: 40,
  },
});
