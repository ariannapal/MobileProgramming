import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
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


import { fetchDettagliSerie } from "../../_utils/fetchDettagliSerie";
import { TMDB_API_TOKEN } from '../../_utils/tmdb-config'

// per ogni stagione faccio un tipo 
type StagioneDettaglio = {
  stagione: number;
  episodi: number;
};

//tipo di una  serie
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
  //stato per il rendering delle serie in corso
  const [serieViste, setSerieViste] = useState<Serie[]>([]);
  //stato per il rendering delle serie completate
  const [serieCompletate, setSerieCompletate] = useState<Serie[]>([]);
  //stato per il rendering delle serie suggerite
  const [suggestedSeries, setSuggestedSeries] = useState<Serie[]>([
    //stato iniziale, vuoto con la scheda di scoperta nuova serie
    { id: "loadMore", titolo: "Scopri una Nuova Serie" },
  ]);

  //navigazione
  const router = useRouter();

   // Funzione che restituisce l’url dell’immagine da mostrare, o un placeholder se non c’è
  function getImageUri(item: { poster_path?: string; image?: string }): string {
    const path = item.poster_path || item.image;

    if (!path) {
      return "https://via.placeholder.com/120x180?text=?";
    }
    if (path.startsWith("file://") || path.startsWith("http")) {
      return path;
    }
    return `https://image.tmdb.org/t/p/w185${path}`;
  }

  //se lo stato è vuoto --> Card di aggiunta serie in corso o completata
  const renderEmptyState = (messaggio: string) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={() => router.push("/aggiungi")}
    >
      <Ionicons name="add-circle-outline" size={48} color="#6c2bd9" />
      <Text style={styles.actionCardText}>{messaggio}</Text>
    </TouchableOpacity>
  );

  //ogni volta che tonro sulla home, aggiorno la visualizzazione prendendo le serie da AsyncStorage
  useFocusEffect(
    useCallback(() => {
      const loadSerie = async () => {
        try {
          //prendo i dati con una promise dall'asyncstorage
          const json = await AsyncStorage.getItem("serie.json");
          //i dati devono essere di tipo serie se il parsing restituisce qualcosa lo inserisco, altrimenti array vuoto
          const data: Serie[] = json ? JSON.parse(json) : [];

          // filtro le serie
          const serieInCorso = data.filter((serie) => serie.stato?.toLowerCase().trim() === "in corso" );
          const serieCompletate = data.filter((serie) => serie.stato?.toLowerCase().trim() === "completata");
          const suggerite = data.filter((serie) => serie.stato?.toLowerCase().trim() === "suggerita");

          //setto i nuovi stati:
          setSerieViste(serieInCorso);
          setSerieCompletate(serieCompletate);
          setSuggestedSeries([  //inserisco le suggerite nuove + quella di base (per aggiungerne nuove)
            ...suggerite,
            { id: "loadMore", titolo: "Scopri una Nuova Serie" },
          ]);
        } catch (err) {
          console.error("Errore nel caricamento delle serie:", err);
        }
      };

      // Avvio la funzione di caricamento asincrono
      loadSerie();
    }, [])
  );



  // resetta asynchstorage 
  const resetAppData = async () => {
  try {
    await AsyncStorage.clear(); // Elimina tutti i dati salvati

    console.log("Tutti i dati dell'app sono stati cancellati.");
    Alert.alert("Reset completato", "Tutti i dati sono stati eliminati");

    // Pulisce lo stato locale per mostrare subito l'effetto
    setSerieViste([]);
    setSerieCompletate([]);
    setSuggestedSeries([
      { id: "loadMore", titolo: "Scopri una Nuova Serie" },
    ]);
  } catch (error) {
    console.error("Errore durante il reset dei dati:", error);
    Alert.alert("Errore", "Non è stato possibile eliminare i dati");
  }
};

  //prendo una serie TV casuale dalle più votate
  //diventa un oggetto serie, la salvo in AsyncStorage
  //aggiungo ai suggerimenti
  //la uso in renderItem quando id = loadmore
  const fetchNuovaSerie = async () => {
    try {
      // Fetch serie fra le top rated
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/top_rated?language=it-IT&page=1`,
        {
          headers: {
             Authorization: TMDB_API_TOKEN,
            accept: "application/json",
          },
        }
      );
      if (!res.ok) throw new Error("Errore fetch top rated");
      const data = await res.json();

   
      // set per evitare duplicati -> così non suggerisce serie già suggerite o già in corso/completate
      // ottengo una lista di tutti gli ID già usati
      const serieEsistenti = new Set([
        ...serieViste.map(s => s.id),
        ...serieCompletate.map(s => s.id),
        ...suggestedSeries.map(s => s.id),
      ]);

      // filtro le serie disponibili (quelle prese da API) escludendo tutte quelle presenti (in serieEsistenti)
      const serieDisponibili = data.results.filter(
        (s: any) => !serieEsistenti.has(s.id?.toString())   
      );

      //caso tutte le serie sono state già suggerite
      if (serieDisponibili.length === 0) {
        console.warn("Nessuna nuova serie da suggerire");
        return;
      }
     
      // scelgo una serie casuale tra quelle disponibili, e la salvo in show
      const randomIndex = Math.floor(Math.random() * serieDisponibili.length);
      const show = serieDisponibili[randomIndex];

      // chiamo funzione per ottenere tutti i dettagli
      const dettagli = await fetchDettagliSerie(show.id,"Netflix","suggerita" );
      if (!dettagli) {
        throw new Error("Errore nel recupero dettagli serie");
      }


      const nuovaSerie = dettagli;

      // Aggiorna stato locale
      //prendo la serie nuova inserita e quelle precedenti eccetto la card load more
      setSuggestedSeries((prev) => [
  ...prev.filter((item) => item.id !== "loadMore"),
  nuovaSerie,
  { id: "loadMore", titolo: "Scopri una Nuova Serie" },
]);
    } catch (err) {
      console.error("Errore fetch nuova serie:", err);
    }
  };

  // render della card 'scopri nuova serie'
  const renderItem = ({ item, index }: { item: Serie; index: number }) => {
    if (item.id === "loadMore") {
      return (
        <TouchableOpacity style={styles.actionCard} onPress={fetchNuovaSerie}>
          <Ionicons name="add-circle-outline" size={48} color="#6c2bd9" />
          <Text style={styles.actionCardText}>Scopri una Nuova Serie</Text>
        </TouchableOpacity>
      );
    }
    const imageUri = getImageUri(item);
    
   
    // Card  che porta alla pagina dettagli della serie
    const content = (
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
        <View style={styles.imageOverlay}>
          <Text style={styles.title} numberOfLines={2}>
            {item.titolo}
          </Text>
          {item.stato && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.stato.charAt(0).toUpperCase() +
                  item.stato.slice(1).toLowerCase()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );

    return content;
  };

  
  // Se non ci sono serie in nessuna lista, mostro schermata vuota con invito ad aggiungere
  if (
    serieViste.length === 0 &&
    serieCompletate.length === 0 &&
    suggestedSeries.length <= 1
  ) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="tv-outline" size={90} color="#6c2bd9" />
        <Text style={styles.emptyTitle}>Non hai ancora aggiunto una serie</Text>
        <Text style={styles.emptySubtitle}>
          Inizia a creare la tua libreria personale!
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push("/aggiungi")}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.emptyButtonText}>
            Aggiungi la tua prima serie
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

   // Altrimenti mostro la schermata con liste di serie in corso, completate e suggerite
  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.searchInput}
          onPress={() => router.push("/cerca")}
        >
          <Ionicons name="search-outline" size={18} color="#aaa" />
          <Text style={styles.searchInputText}>Cerca tra le tue serie</Text>
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
          ListEmptyComponent={renderEmptyState("Aggiungi una Serie in Corso")}
        />

        <Text style={styles.sectionTitle}>Serie TV Completate</Text>
        <FlatList
          data={[...serieCompletate].reverse()}
          keyExtractor={(item, index) => item.id || item.titolo + index}
          horizontal
          renderItem={renderItem}
          contentContainerStyle={styles.horizontalList}
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState("Aggiungi una Serie Completata")}
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
        <TouchableOpacity
          style={styles.resetButton}
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
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.resetText}>Resetta tutto</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/aggiungi")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
    textAlign: "left",
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f2a",
    paddingHorizontal: 24,
    gap: 12,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginHorizontal: 20,
  },
  actionCard: {
    width: 140,
    height: 210,
    borderRadius: 12,
    backgroundColor: "#1e1e3f",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },

  actionCardText: {
    marginTop: 10,
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6c2bd9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 20,
  },

  emptyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
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
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: 10,
    bottom: 8,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#6c2bd9",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  badge: {
    backgroundColor: "#6c2bd9",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 6,
  },

  badgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "500",
  },

  resetButton: {
    alignSelf: "center",
    marginVertical: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#cc4949",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  resetText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
