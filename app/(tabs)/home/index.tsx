import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
type Serie = {
  id?: string;
  titolo: string;
  genere?: string;
  piattaforma?: string;
  poster_path?: string;
  image?: string;
};

// Suggeriti per te (fissi per ora)
const initialSuggestedSeries = [
  {
    id: "100",
    titolo: "The Crown",
    image: "https://i.imgur.com/4.jpg",
    genere: "Drama",
    piattaforma: "Netflix",
  },
  {
    id: "101",
    titolo: "The Mandalorian",
    image: "https://i.imgur.com/8.jpg",
    genere: "Sci-Fi",
    piattaforma: "Disney+",
  },
];

export default function HomeScreen() {
  const [serieViste, setSerieViste] = useState<Serie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedSeries, setSuggestedSeries] = useState(
    initialSuggestedSeries
  );
  const router = useRouter();

  // 🔁 Carica le serie viste ogni volta che la schermata è attiva
  useFocusEffect(
    useCallback(() => {
      const loadSerie = async () => {
        const data = await AsyncStorage.getItem("serie.json");
        setSerieViste(data ? JSON.parse(data) : []);
      };
      loadSerie();
    }, [])
  );

  const filteredViste = serieViste.filter((serie) => {
    const query = searchQuery.toLowerCase();
    return (
      (serie.titolo?.toLowerCase().includes(query) ?? false) ||
      (serie.genere?.toLowerCase().includes(query) ?? false) ||
      (serie.piattaforma?.toLowerCase().includes(query) ?? false)
    );
  });

  const renderItem = ({ item }: { item: Serie }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push(`/serie/${encodeURIComponent(item.id || item.titolo)}`)
      }
    >
      {item.poster_path || item.image ? (
        <Image
          source={{
            uri: item.poster_path
              ? `https://image.tmdb.org/t/p/w185/${item.poster_path}`
              : item.image!,
          }}
          style={styles.image}
        />
      ) : (
        <View style={styles.image} />
      )}
      <Text style={styles.title} numberOfLines={2}>
        {item.titolo}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 🔍 Barra di ricerca + ➕ */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca tra le serie viste"
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(tabs)/home/aggiungi")}
        >
          <Ionicons name="add" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* ✅ Serie viste */}
      <Text style={styles.sectionTitle}>Le tue Serie TV viste</Text>
      <FlatList
        data={filteredViste}
        keyExtractor={(item, index) => item.id || item.titolo + index}
        horizontal
        renderItem={renderItem}
        contentContainerStyle={styles.horizontalList}
        showsHorizontalScrollIndicator={false}
      />

      {/* ✅ Suggeriti per te */}
      <Text style={styles.sectionTitle}>Suggeriti per te</Text>
      <FlatList
        data={suggestedSeries}
        keyExtractor={(item) => item.id}
        horizontal
        renderItem={renderItem}
        contentContainerStyle={styles.horizontalList}
        showsHorizontalScrollIndicator={false}
      />
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#1f1f3a",
    borderRadius: 8,
    paddingHorizontal: 12,
    color: "#fff",
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: "purple",
    padding: 12,
    borderRadius: 50,
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
  addButtonCard: {
    width: 120,
    height: 180,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#444",
  },
  addButtonText: {
    marginTop: 8,
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
});
