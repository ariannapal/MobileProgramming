import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
};

export default function PreferitiScreen() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const router = useRouter();

  // Carica i preferiti quando la schermata è in focus
  useFocusEffect(
    React.useCallback(() => {
      const loadFavorites = async () => {
        const data = await getFavorites();
        setFavorites(data);
      };

      loadFavorites();
    }, [])
  );

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/serie/${item.id}`)}
    >
      <Image
        source={{ uri: item.image || item.poster_path }}
        style={styles.image}
      />
      <Text style={styles.title} numberOfLines={2}>
        {item.titolo || item.title}
      </Text>
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
          keyExtractor={(item) => item.id.toString()}
          horizontal
          renderItem={renderItem}
          contentContainerStyle={styles.horizontalList}
          showsHorizontalScrollIndicator={false}
        />
      )}
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
});
