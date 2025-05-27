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

type StagioneDettaglio = {
  stagione: number;
  episodi: number;
};

type Serie = {
  id?: string;
  titolo: string;
  trama?: string;
  genere?: string;
  piattaforma?: string;
  stato?: string; // "in corso", "completata", "suggerita"
  stagioni?: string | number;
  episodi?: string | number;
  poster_path?: string;
  image?: string;
  rating?: string | number;
  anno?: string;
  stagioniDettagli?: StagioneDettaglio[];
};

export default function HomeScreen() {
  const [serieViste, setSerieViste] = useState<Serie[]>([]);
  const [serieCompletate, setSerieCompletate] = useState<Serie[]>([]);
  const [suggestedSeries, setSuggestedSeries] = useState<Serie[]>([
    { id: "loadMore", titolo: "Scopri nuova serie" },
  ]);

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
          const suggerite = data.filter(
            (serie) => serie.stato?.toLowerCase().trim() === "suggerita"
          );

          setSerieViste(serieInCorso);
          setSerieCompletate(serieFatte);
          setSuggestedSeries([
            ...suggerite,
            { id: "loadMore", titolo: "Scopri nuova serie" },
          ]);
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

  const fetchDettagliSerie = async (id: number) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?language=it-IT`,
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
            accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Errore nel recupero dettagli serie");

      const data = await res.json();

      // Mappa ogni stagione con numero e conteggio episodi
      const episodiPerStagione = data.seasons.map((s: any) => ({
        stagione: s.season_number,
        episodi: s.episode_count,
      }));

      return {
        numeroStagioni: data.number_of_seasons,
        numeroEpisodiTotale: data.number_of_episodes,
        episodiPerStagione,
        dettagliRaw: data,
      };
    } catch (err) {
      console.error("Errore dettagli serie:", err);
      return null;
    }
  };

  const fetchNuovaSerie = async () => {
    try {
      // Fetch serie top rated
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/top_rated?language=it-IT&page=1`,
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
            accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Errore fetch top rated");

      const data = await res.json();

      // Evitiamo duplicati
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

      // Ottieni dettagli completi con episodiPerStagione ecc.
      const dettagli = await fetchDettagliSerie(show.id);

      if (!dettagli) {
        throw new Error("Errore nel recupero dettagli serie");
      }

      const nuovaSerie: Serie = {
        id: dettagli.dettagliRaw.id?.toString(),
        titolo: dettagli.dettagliRaw.name,
        trama: dettagli.dettagliRaw.overview,
        genere: dettagli.dettagliRaw.genres?.[0]?.name || "",
        piattaforma: "TMDb",
        stato: "suggerita",
        stagioni: dettagli.numeroStagioni,
        episodi: dettagli.numeroEpisodiTotale,
        poster_path: dettagli.dettagliRaw.poster_path,
        rating: dettagli.dettagliRaw.vote_average?.toFixed(1) || "",
        anno: dettagli.dettagliRaw.first_air_date?.substring(0, 4) || "",
        stagioniDettagli: dettagli.episodiPerStagione,
      };

      // Leggi esistente da AsyncStorage
      const existingData = await AsyncStorage.getItem("serie.json");
      const lista: Serie[] = existingData ? JSON.parse(existingData) : [];

      // Controllo duplicati anche qui, per sicurezza
      if (!lista.some((s) => s.id === nuovaSerie.id)) {
        const aggiornata = [...lista, nuovaSerie];
        await AsyncStorage.setItem("serie.json", JSON.stringify(aggiornata));
      }

      // Aggiorna stato locale
      setSuggestedSeries((prev) => [
        ...prev.filter((item) => item.id !== "loadMore"),
        nuovaSerie,
        { id: "loadMore", titolo: "Scopri nuova serie" },
      ]);
    } catch (err) {
      console.error("❌ Errore fetch nuova serie:", err);
    }
  };

  const renderItem = ({ item }: { item: Serie }) => {
    if (item.id === "loadMore") {
      return (
        <TouchableOpacity
          style={styles.addButtonCard}
          onPress={fetchNuovaSerie}
        >
          <Ionicons name="add-circle" size={50} color="#fff" />
          <Text style={styles.addButtonText}>Scopri nuova serie</Text>
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
          <Text style={{ color: "#aaa" }}>Cerca tra le serie </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/aggiungi")}
        >
          <Ionicons name="add" size={26} color="white" />
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
    width: 140,
    height: 210,
    backgroundColor: "#1f1f3b",
    borderRadius: 8,
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
