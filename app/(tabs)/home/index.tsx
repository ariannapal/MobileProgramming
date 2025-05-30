import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Button,
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
  function getImageUri(item: { poster_path?: string; image?: string }) {
    if (!item.poster_path && !item.image) {
      return "https://via.placeholder.com/120x180?text=?";
    }

    if (item.poster_path) {
      if (item.poster_path.startsWith("file://")) {
        return item.poster_path;
      }
      if (item.poster_path.startsWith("/")) {
        return `https://image.tmdb.org/t/p/w185${item.poster_path}`;
      }
      if (item.poster_path.startsWith("http")) {
        return item.poster_path;
      }
    }

    return item.image || "https://via.placeholder.com/120x180?text=?";
  }

  const renderEmptyState = (message: string) => (
  <TouchableOpacity
    style={styles.addButtonCard}
    onPress={() => router.push("/aggiungi")}
  >
    <Ionicons name="add-circle" size={50} color="#aaa" />
    <Text style={styles.addButtonText}>{message}</Text>
  </TouchableOpacity>
);

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
     const episodiPerStagione = data.seasons
  .filter((s: any) => s.season_number !== 0)
  .map((s: any) => ({
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
  const resetAppData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();

      // Filtra solo le chiavi che usi nella tua app
      const relevantKeys = keys.filter(
        (key) =>
          key === "serie.json" ||
          key.startsWith("episodiVisti-") ||
          key === "preferiti"
      );

      if (relevantKeys.length > 0) {
        await AsyncStorage.multiRemove(relevantKeys);
        console.log("Dati dell'app resettati:", relevantKeys);
        Alert.alert("Reset completato", "Tutti i dati sono stati eliminati");
      } else {
        Alert.alert("Nessun dato da cancellare");
      }

      // Pulisce lo stato locale per mostrare subito l'effetto
      setSerieViste([]);
      setSerieCompletate([]);
      setSuggestedSeries([{ id: "loadMore", titolo: "Scopri nuova serie" }]);
    } catch (error) {
      console.error("Errore durante il reset dei dati:", error);
      Alert.alert("Errore", "Non è stato possibile eliminare i dati");
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
        piattaforma: "Netflix",
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
        nuovaSerie,
        ...prev.filter((item) => item.id !== "loadMore"),
        { id: "loadMore", titolo: "Scopri nuova serie" },
      ]);
    } catch (err) {
      console.error("Errore fetch nuova serie:", err);
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

    const imageUri = (() => {
      if (!item.poster_path && !item.image)
        return "https://via.placeholder.com/120x180?text=?";
      if (item.poster_path) {
        if (item.poster_path.startsWith("file://")) return item.poster_path;
        if (item.poster_path.startsWith("/"))
          return `https://image.tmdb.org/t/p/w185${item.poster_path}`;
        if (item.poster_path.startsWith("http")) return item.poster_path;
      }
      return item.image || "https://via.placeholder.com/120x180?text=?";
    })();

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
        <Image source={{ uri: imageUri }} style={styles.image} />
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
        <Text style={styles.sectionTitle}>Serie TV In Corso</Text>
        
        
      <FlatList
  data={[...serieViste].reverse()}
  keyExtractor={(item, index) => item.id || item.titolo + index}
  horizontal
  renderItem={renderItem}
  contentContainerStyle={styles.horizontalList}
  showsHorizontalScrollIndicator={false}
  ListEmptyComponent={renderEmptyState("Aggiungi una serie in corso")}
/>

  <Text style={styles.sectionTitle}>Serie TV Completate</Text>
<FlatList
  data={[...serieCompletate].reverse()}
  keyExtractor={(item, index) => item.id || item.titolo + index}
  horizontal
  renderItem={renderItem}
  contentContainerStyle={styles.horizontalList}
  showsHorizontalScrollIndicator={false}
  ListEmptyComponent={renderEmptyState("Aggiungi una serie completata")}
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
        <Button
          title="Resetta Tutto"
          color="#ff4444"
          onPress={() =>
            Alert.alert(
              "Conferma Reset",
              "Sei sicuro di voler eliminare tutti i dati dell'app?",
              [
                { text: "Annulla", style: "cancel" },
                {
                  text: "Conferma",
                  style: "destructive",
                  onPress: resetAppData,
                },
              ]
            )
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#29294d",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  addButtonText: {
    marginTop: 10,
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 26,
    marginBottom: 12,
    paddingLeft: 8,
    color: "#fff",
  },

  container: {
    flex: 1,
    paddingTop: 30,
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
});
