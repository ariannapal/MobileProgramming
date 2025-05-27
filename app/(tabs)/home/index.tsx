import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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
  stato?: string;
};

export default function HomeScreen() {
  const [serieViste, setSerieViste] = useState<Serie[]>([]);
  const [serieCompletate, setSerieCompletate] = useState<Serie[]>([]);
  const [suggestedSeries, setSuggestedSeries] = useState<Serie[]>([
    { id: "loadMore", titolo: "Scopri una nuova serie" },
  ]);
  const [shimmerVisible, setShimmerVisible] = useState(false);

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const loadSerie = async () => {
        try {
          const json = await AsyncStorage.getItem("serie.json");
          const data: Serie[] = json ? JSON.parse(json) : [];

          const serieInCorso = data.filter(
            (serie) => serie.stato?.toLowerCase().trim() === "in corso"
          );

          const serieFatte = data.filter(
            (serie) => serie.stato?.toLowerCase().trim() === "completata"
          );

          setSerieViste(serieInCorso);
          setSerieCompletate(serieFatte);
        } catch (err) {
          console.error("Errore nel caricamento delle serie:", err);
        }
      };
      loadSerie();
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

  const fetchNuovaSerie = async () => {
    try {
      const [res, genresRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/tv/popular?language=it-IT&page=1`, {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
            accept: "application/json",
          },
        }),
        fetch(`https://api.themoviedb.org/3/genre/tv/list?language=it-IT`, {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
            accept: "application/json",
          },
        }),
      ]);

      if (!res.ok || !genresRes.ok) {
        throw new Error("Errore nella fetch TMDb");
      }

      const data = await res.json();
      const genresData = await genresRes.json();

      const genresMap: Record<number, string> = {};
      genresData.genres.forEach((g: { id: number; name: string }) => {
        genresMap[g.id] = g.name;
      });

      const serieEsistenti = new Set(suggestedSeries.map((s) => s.id));
      const serieDisponibili = data.results.filter(
        (s: any) => !serieEsistenti.has(s.id?.toString())
      );

      if (serieDisponibili.length === 0) {
        console.warn("Nessuna nuova serie da suggerire");
        return;
      }

      const randomIndex = Math.floor(Math.random() * serieDisponibili.length);
      const show = serieDisponibili[randomIndex];

      const nuovaSerie: Serie = {
        id: show.id?.toString(),
        titolo: show.name,
        poster_path: show.poster_path,
        genere:
          show.genre_ids?.length > 0 ? genresMap[show.genre_ids[0]] : undefined,
        piattaforma: "TMDb",
      };

      setSuggestedSeries((prev) => [
        ...prev.slice(0, -1),
        nuovaSerie,
        { id: "loadMore", titolo: "Scopri una nuova serie" },
      ]);
    } catch (err) {
      console.error("❌ Errore TMDb:", err);
    }
  };

  const renderItem = ({ item }: { item: Serie }) => {
    if (item.id === "loadMore") {
      return (
        <TouchableOpacity
          style={styles.addButtonCard}
          onPress={fetchNuovaSerie}
        >
          <Ionicons name="add-circle-outline" size={36} color="#fff" />
          <Text style={styles.addButtonText}>Scopri una nuova serie</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={async () => {
          const data = await AsyncStorage.getItem("serie.json");
          const lista = data ? JSON.parse(data) : [];
          const esiste = lista.some((s: Serie) => s.id === item.id);

          if (!esiste && item.id && item.titolo) {
            const nuovaLista = [...lista, item];
            await AsyncStorage.setItem(
              "serie.json",
              JSON.stringify(nuovaLista)
            );
          }

          router.push(`/serie/${encodeURIComponent(item.id || item.titolo)}`);
        }}
      >
        {item.poster_path || item.image ? (
          <Image
            source={{
              uri: item.poster_path?.startsWith("/")
                ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
                : item.image || "https://via.placeholder.com/120x180?text=?",
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.searchInput}
          onPress={() => router.push("/cerca")}
        >
          <Ionicons name="search-outline" size={18} color="#aaa" />
          <Text style={styles.searchInputText}>Cerca tra le serie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/aggiungi")}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Le tue Serie TV In Corso</Text>
        <FlatList
          data={serieViste}
          keyExtractor={(item, index) => item.id || item.titolo + index}
          horizontal
          renderItem={renderItem}
          contentContainerStyle={styles.horizontalList}
          showsHorizontalScrollIndicator={false}
        />

        <Text style={styles.sectionTitle}>Serie Completate</Text>
        <FlatList
          data={serieCompletate}
          keyExtractor={(item, index) => item.id || item.titolo + index}
          horizontal
          renderItem={renderItem}
          contentContainerStyle={styles.horizontalList}
          showsHorizontalScrollIndicator={false}
        />

        <Text style={styles.sectionTitle}>Suggeriti per te</Text>
        <FlatList
          data={suggestedSeries}
          keyExtractor={(item, index) => item.id || index.toString()}
          horizontal
          renderItem={renderItem}
          contentContainerStyle={styles.horizontalList}
          showsHorizontalScrollIndicator={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30, // ↓ prima era 60
    paddingHorizontal: 16,
    backgroundColor: "#0f0f2a",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f3a",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInputText: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 6,
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: "#6c2bd9",
    padding: 10,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 26,
    marginBottom: 12,
    paddingLeft: 8,
    color: "#fff",
  },
  horizontalList: {
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 4,
  },
  card: {
    width: 140,
    marginRight: 14,
    alignItems: "center",
  },
  image: {
    width: 140,
    height: 210,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#1f1f3a",
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#fff",
    paddingHorizontal: 4,
  },
  addButtonCard: {
    width: 140,
    height: 210,
    backgroundColor: "#1f1f3b",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginRight: 10,
    shadowColor: "#fff",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    marginTop: 8,
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
  },
});
