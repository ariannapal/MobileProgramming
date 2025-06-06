import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import HeaderSearchBar from "./components/headerSearchBar"; 
import { useFocusEffect } from "@react-navigation/native";
export default function SearchScreen() {

  // stati per filtri ricerca
  const [titolo, setTitolo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [piattaforma, setPiattaforma] = useState("");
  const [stato, setStato] = useState("");

  // stati per dati caricati
  const [serie, setSerie] = useState<any[]>([]);
  const [categorie, setCategorie] = useState<string[]>([]);
  const [piattaforme, setPiattaforme] = useState<string[]>([]);

  // navigazione
  const router = useRouter();

  // Caricamento iniziale di categorie e piattaforme
  useEffect(() => {
    const caricaCategorie = async () => {
      const categorieRaw = await AsyncStorage.getItem("categorie_dati");
      if (categorieRaw) {
        const parsed = JSON.parse(categorieRaw);
        setCategorie(parsed.generi.map((g: any) => g.nome));
        setPiattaforme(parsed.piattaforme.map((p: any) => p.nome));
      }
    };

    caricaCategorie();
  }, []);


   // ogni volta che torno su questa schermata ricarico le serie
  useFocusEffect(
    React.useCallback(() => {
      const caricaSerie = async () => {
        const serieRaw = await AsyncStorage.getItem("serie.json");
        const serieData = serieRaw ? JSON.parse(serieRaw) : [];
        setSerie(serieData);
      };

      caricaSerie();
    }, [])
  );


  //filtra in base ai filtri selezionati
  const filtrate = serie.filter((s) => {
    return (
      s.titolo?.toLowerCase().includes(titolo.toLowerCase()) &&
      (categoria ? s.genere === categoria : true) &&
      (piattaforma ? s.piattaforma === piattaforma : true) &&
      (stato ? s.stato === stato : true)
    );
  });

  // gestisce il path corretto per l'immagine (che può essere presa dalla galleria, da tmdb o un placeholder)
  const getPosterUri = (posterPath?: string, fallback?: string) => {
    if (!posterPath)
      return fallback || "https://via.placeholder.com/120x180?text=?";
    if (posterPath.startsWith("file://")) return posterPath;
    if (posterPath.startsWith("/"))
      return `https://image.tmdb.org/t/p/w185${posterPath}`;
    if (posterPath.startsWith("http")) return posterPath;
    return fallback || "https://via.placeholder.com/120x180?text=?";
  };


  // render della card della singola serie
  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/serie/${item.id}`)}
    >
      <Image
        source={{
          uri: getPosterUri(item.poster_path, item.image),
        }}
        style={styles.image}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {item.titolo}
        </Text>
        <Text style={styles.subtitle}>
          {item.genere || "-"} • {item.piattaforma || "-"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const stati = ["In corso", "Completata"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <HeaderSearchBar value={titolo} onChange={setTitolo} />

        <Text style={styles.label}>Genere</Text>
        <View style={styles.tagsContainer}>
             {/* crea un bottone per ogni categoria*/}
          {categorie.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoria(cat === categoria ? "" : cat)}  
               /*Quando cliccato, se è già selezionato, lo deseleziona (setCategoria("")), altrimenti lo seleziona (setCategoria(cat)) */
              style={[styles.tag, categoria === cat && styles.tagSelected]}
            >
              <Text style={styles.tagText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Piattaforma</Text>
        <View style={styles.tagsContainer}>  
        {/* crea un bottone per ogni piattaforma */}
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
          {/* lista serie */}
        <FlatList
          data={filtrate}
          keyExtractor={(item, index) => item.id || item.titolo + index}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
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
