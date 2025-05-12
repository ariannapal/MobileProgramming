import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import seriesData from "@/assets/data/serie.json";

const categorie = ["Fantascienza", "Fantasy", "Dramma", "Commedia"];
const piattaforme = ["Netflix", "Disney+", "Amazon Prime", "HBO"];
const stati = ["in corso", "completata"];

export default function SearchScreen() {
  const [titolo, setTitolo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [piattaforma, setPiattaforma] = useState("");
  const [stato, setStato] = useState("");
  const router = useRouter();

  const filtrate = seriesData.filter((serie) => {
    return (
      serie.titolo.toLowerCase().includes(titolo.toLowerCase()) &&
      (categoria ? serie.categoria === categoria : true) &&
      (piattaforma ? serie.piattaforma === piattaforma : true) &&
      (stato ? serie.stato === stato : true)
    );
  });

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/serie/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {item.titolo}
        </Text>
        <Text style={styles.subtitle}>
          {item.categoria} • {item.piattaforma}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Cerca per titolo..."
          placeholderTextColor="#aaa"
          value={titolo}
          onChangeText={setTitolo}
        />

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.tagsContainer}>
          {categorie.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoria(cat === categoria ? "" : cat)}
              style={[styles.tag, categoria === cat && styles.tagSelected]}
            >
              <Text style={styles.tagText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Piattaforma</Text>
        <View style={styles.tagsContainer}>
          {piattaforme.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPiattaforma(p === piattaforma ? "" : p)}
              style={[styles.tag, piattaforma === p && styles.tagSelected]}
            >
              <Text style={styles.tagText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Stato</Text>
        <View style={styles.tagsContainer}>
          {stati.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStato(s === stato ? "" : s)}
              style={[styles.tag, stato === s && styles.tagSelected]}
            >
              <Text style={styles.tagText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>
          Risultati trovati: {filtrate.length}
        </Text>
        <FlatList
          data={filtrate}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ color: "#888", marginTop: 20 }}>Nessun risultato</Text>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f0f2a",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  input: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#333",
    borderRadius: 20,
  },
  tagSelected: {
    backgroundColor: "purple",
  },
  tagText: {
    color: "#fff",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#1f1f3b",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  image: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 12,
    marginTop: 4,
  },
});
