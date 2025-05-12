import serieJson from "@/assets/data/serie.json";
import { Ionicons } from "@expo/vector-icons";
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

// Suggeriti per te
const initialSuggestedSeries = [
  {
    id: "100",
    titolo: "The Crown",
    image: "https://i.imgur.com/4.jpg",
    categoria: "Drama",
    piattaforma: "Netflix",
  },
  {
    id: "101",
    titolo: "The Mandalorian",
    image: "https://i.imgur.com/8.jpg",
    categoria: "Sci-Fi",
    piattaforma: "Disney+",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [suggestedSeries, setSuggestedSeries] = useState(initialSuggestedSeries);
  const [serieViste] = useState(serieJson);

  const renderItem = ({ item }: any) => {
    if (item.id === "addButton") {
      return (
        <TouchableOpacity
          style={styles.addButtonCard}
          onPress={() => router.push("/aggiungi")}
        >
          <Ionicons name="add-circle" size={50} color="#fff" />
          <Text style={styles.addButtonText}>Aggiungi una serie</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/serie/${item.id}`)}
      >
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={styles.title} numberOfLines={2}>
          {item.titolo}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Barra di ricerca cliccabile */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.searchInput}
          onPress={() => router.push("/cerca")}
        >
          <Text style={{ color: "#aaa" }}>Cerca tra le serie viste</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/aggiungi")}
        >
          <Ionicons name="add" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* Serie viste */}
      <Text style={styles.sectionTitle}>Le tue Serie TV viste</Text>
      <FlatList
        data={serieViste}
        keyExtractor={(item) => item.id}
        horizontal
        renderItem={renderItem}
        contentContainerStyle={styles.horizontalList}
        showsHorizontalScrollIndicator={false}
      />

      {/* Suggeriti per te */}
      <Text style={styles.sectionTitle}>Suggeriti per te</Text>
      <FlatList
        data={[...suggestedSeries, { id: "addButton" }]}
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
    justifyContent: "center",
    backgroundColor: "#1f1f3a",
    borderRadius: 8,
    paddingHorizontal: 12,
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
