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
import { fetchDettagliSerie } from "../../_utils/fetchDettagliSerie";

// per ogni stagione faccio un tipo
type StagioneDettaglio = {
  stagione: number;
  episodi: number;
};

//singola serie
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
    { id: "loadMore", titolo: "Scopri nuova serie" },
  ]);

  //navigazione
  const router = useRouter();

  //immagine da mostrare, prende in ingresso un item che se ha un poster_path è una stringa
  //e se ha un'immagine è una stringa
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

  //stato vuoto --> Card di aggiunta serie in corso o completata
  const renderEmptyState = (message: string) => (
    <TouchableOpacity
      style={styles.addButtonCard}
      //stack schermata di aggiunta
      onPress={() => router.push("/aggiungi")}
    >
      <Ionicons name="add-circle" size={50} color="#aaa" />
      <Text style={styles.addButtonText}>{message}</Text>
    </TouchableOpacity>
  );
  //ogni volta che tonro sulla home, aggiorno visualizzazione di serie completate, in corso e suggerite
  useFocusEffect(
    useCallback(() => {
      const loadSerie = async () => {
        try {
          //prendo i dati con una promise dall'asyncstorage
          const json = await AsyncStorage.getItem("serie.json");
          //i dati devono essere di tipo serie se il parsing restituisce qualcosa lo inserisco
          // altrimenti array vuoto
          const data: Serie[] = json ? JSON.parse(json) : [];

          //prendo solo le serieincorso filtrando da data per ogni serie,
          //il campo stato deve essere in corso
          const serieInCorso = data.filter(
            (serie) => serie.stato?.toLowerCase().trim() === "in corso"
          );

          //prendo solo le seriefinite filtrando da data per ogni serie,
          //il campo stato deve essere completata
          const serieFatte = data.filter(
            (serie) => serie.stato?.toLowerCase().trim() === "completata"
          );
          //prendo solo le suggerite filtrando da data per ogni serie,
          //il campo stato deve essere suggerita
          const suggerite = data.filter(
            (serie) => serie.stato?.toLowerCase().trim() === "suggerita"
          );
          //setto il nuovo stato delle viste, delle completate e delle suggerite
          setSerieViste(serieInCorso);
          setSerieCompletate(serieFatte);

          //inserisco le suggerite nuove + quella di base (stato 0)
          setSuggestedSeries([
            ...suggerite,
            { id: "loadMore", titolo: "Scopri nuova serie" },
          ]);
        } catch (err) {
          console.error("Errore nel caricamento delle serie:", err);
        }
      };
      // Avvio la funzione di caricamento asincrono
      loadSerie();
    }, [])
  );

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

  //prendo una serie TV casuale dalle più votate
  //diventa un oggetto serie, la salvo in AsyncStor
  //aggiungo ai suggerimenti
  //la uso in renderItem quando id = loadmore
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
      //suggestedSeries stato e array delle serie suggerite
      //nel set, per ogni serie mappo solo il suo id
      //set --> senza duplicati
      //risultato: serie nei suggeriti sempre diverse dalle presenti
      const serieEsistenti = new Set(suggestedSeries.map((s) => s.id));

      //disponibili le serie che ha dato l'API
      //con filter mantengo solo quelle che non hanno corrispondenza in SerieEsisenti
      const serieDisponibili = data.results.filter(
        (s: any) => !serieEsistenti.has(s.id?.toString())
      );

      //caso tutte le serie sono state già suggerite
      if (serieDisponibili.length === 0) {
        console.warn("Nessuna nuova serie da suggerire");
        return;
      }
      //calcola un numero casuale dalle serie disponibili
      const randomIndex = Math.floor(Math.random() * serieDisponibili.length);
      //salvo in show la serie casuale scelta con un indice casuale
      const show = serieDisponibili[randomIndex];

      // Ottieni dettagli completi con episodiPerStagione ecc.
      const dettagli = await fetchDettagliSerie(
        show.id,
        "Netflix",
        "suggerita"
      );

      if (!dettagli) {
        throw new Error("Errore nel recupero dettagli serie");
      }

      //inserisco la nuova serie con i suoi dettagli nei suggeriti
      // Inserisco la nuova serie con i suoi dettagli nei suggeriti
      const nuovaSerie = dettagli;

      // Leggo elenco esistente da AsyncStorage
      const existingData = await AsyncStorage.getItem("serie.json");
      const lista: Serie[] = existingData ? JSON.parse(existingData) : [];

      // Controllo duplicati anche qui, per sicurezza
      if (!lista.some((s) => s.id === nuovaSerie.id)) {
        const aggiornata = [...lista, nuovaSerie];
        await AsyncStorage.setItem("serie.json", JSON.stringify(aggiornata));
      }

      // Aggiorna stato locale
      //prendo la serie nuova inserita e quelle precedenti eccetto la card load more
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
    //renderizzo la card di scoperta nuova serie
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
    //prendo il path dell'immagine dalla funzione
    const imageUri = getImageUri(item);

    //caso card normale
    return (
      //card tipo bottone
      <TouchableOpacity
        style={styles.card}
        onPress={async () => {
          //leggo il contenuto di serie.json nell'Async
          const data = await AsyncStorage.getItem("serie.json");

          //trasformo in una lista con il parser
          const lista = data ? JSON.parse(data) : [];

          //se esiste già lo stesso componente nella lista da true
          //item parametro passato dalla flatlist
          const esiste = lista.some((s: Serie) => s.id === item.id);

          //se non è presente la aggiungo
          if (!esiste && item.id && item.titolo) {
            //prendo la lista di prima + l'item nuovo
            const nuovaLista = [...lista, item];
            await AsyncStorage.setItem(
              "serie.json",
              JSON.stringify(nuovaLista)
            );
          }
          //dopo salvataggio passo a serie/id
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
