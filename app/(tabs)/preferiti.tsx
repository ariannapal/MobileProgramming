import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getFavorites } from "../utils/favoritesStorage";

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
            const userRating = ratingRaw ? parseFloat(ratingRaw) : null;
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
      Alert.alert("Successo", "Dati delle serie TV cancellati");
    } catch (e) {
      console.error("Errore nella cancellazione dei dati", e);
    }
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
      {item.userRating !== undefined && (
        <Text style={styles.rating}>⭐ {item.userRating.toFixed(1)}/5</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Le tue Serie TV preferite</Text>

      {favorites.length === 0 ? (
        <Text style={styles.empty}>Non hai ancora aggiunto preferiti</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : `fallback-${index}`
          }
          horizontal
          renderItem={renderItem}
          contentContainerStyle={styles.horizontalList}
          showsHorizontalScrollIndicator={false}
        />
      )}
      <Button title="🧹 Reset AsyncStorage" onPress={clearAllData} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  horizontalList: {
    paddingVertical: 10,
  },
  card: {
    width: 120,
    marginRight: 12,
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 180,
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
  rating: {
    color: "#ffdd57",
    fontSize: 13,
    marginTop: 2,
  },
});
