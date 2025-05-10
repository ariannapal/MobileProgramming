import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Lista di serie viste
const seriesList = [
  {
    id: "1",
    titolo: "Stranger Things",
    image: "https://i.imgur.com/1.jpg",
  },
  {
    id: "2",
    titolo: "Breaking Bad",
    image: "https://i.imgur.com/2.jpg",
  },
];

const initialSuggestedSeries = [
  {
    id: "3",
    titolo: "The Witcher",
    image: "https://i.imgur.com/3.jpg",
    categoria: "Fantasy",
    piattaforma: "Netflix",
  },
  {
    id: "4",
    titolo: "The Crown",
    image: "https://i.imgur.com/4.jpg",
    categoria: "Drama",
    piattaforma: "Netflix",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [suggestedSeries, setSuggestedSeries] = useState(
    initialSuggestedSeries
  );
  const [searchQuery, setSearchQuery] = useState("");

  const addSeries = () => {
    const newSeries = {
      id: `${suggestedSeries.length + 1}`,
      titolo: "Nuova Serie",
      image: "https://i.imgur.com/5.jpg",
      categoria: "Mistero",
      piattaforma: "Disney+",
    };
    setSuggestedSeries((prev) => [...prev, newSeries]);
  };

  const filteredSeries = suggestedSeries.filter((serie) => {
    const query = searchQuery.toLowerCase();
    return (
      serie.titolo.toLowerCase().includes(query) ||
      serie.categoria.toLowerCase().includes(query) ||
      serie.piattaforma.toLowerCase().includes(query)
    );
  });

  const renderItem = ({ item }: any) => {
    if (item.id === "addButton") {
      return (
        <TouchableOpacity style={styles.addButtonCard} onPress={addSeries}>
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
      {/* Search + Add Row */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca per nome, categoria o piattaforma"
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

      <Text style={styles.sectionTitle}>Le tue Serie TV viste</Text>
      <FlatList
        data={seriesList}
        keyExtractor={(item) => item.id}
        horizontal
        renderItem={renderItem}
        contentContainerStyle={styles.horizontalList}
        showsHorizontalScrollIndicator={false}
      />

      <Text style={styles.sectionTitle}>Suggeriti per te</Text>
      <FlatList
        data={[...filteredSeries, { id: "addButton" }]}
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
});
