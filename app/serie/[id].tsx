import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { isFavorite, saveFavorite } from "../utils/favoritesStorage";

const tutteLeSerie = [
  {
    id: "1",
    titolo: "Stranger Things",
    descrizione: "Un gruppo di ragazzi affronta il Sottosopra...",
    poster: "https://i.imgur.com/1.jpg",
    rating: 4,
    anno: 2025,
    categoria: "Netflix",
  },
  // Altre serie...
];

export default function SerieDettaglioScreen() {
  const [isFav, setIsFav] = useState(false);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const serie = tutteLeSerie.find((s) => s.id === id);

  useEffect(() => {
    if (serie) {
      isFavorite(serie.id).then(setIsFav);
    }
  }, []);

  const toggleFavorite = async () => {
    await saveFavorite(serie);
    const updated = await isFavorite(serie.id);
    setIsFav(updated);
  };

  if (!serie) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Serie non trovata.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
        <Text style={styles.backText}>Indietro</Text>
      </Pressable>

      <Image source={{ uri: serie.poster }} style={styles.poster} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>{serie.titolo}</Text>
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons
            name={isFav ? "star" : "star-outline"}
            size={24}
            color="gold"
            style={styles.favoriteIcon}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.meta}>
        ⭐ {serie.rating} · {serie.anno}
      </Text>
      <Text style={styles.desc}>{serie.descrizione}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f2a", padding: 16 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: "#fff", marginLeft: 4 },
  poster: { width: "100%", height: 320, borderRadius: 12, marginBottom: 16 },
  meta: { color: "#ccc", fontSize: 15, marginBottom: 10 },
  desc: { color: "#ddd", fontSize: 16, lineHeight: 22 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f2a",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginRight: 10,
  },
  icon: {
    paddingHorizontal: 4,
  },
  favoriteIcon: {
    paddingHorizontal: 4,
  },
});
