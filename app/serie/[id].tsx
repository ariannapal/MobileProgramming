import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { SafeAreaView } from "react-native-safe-area-context"; // Per evitare sovrapposizioni con le aree non sicure
import StarRating from "react-native-star-rating-widget"; // Componente per rating con stelle
// Funzioni di utilità per la gestione dei preferiti
import {
  isFavorite,
  removeFavorite,
  saveFavorite,
} from "../_utils/favoritesStorage";

import SeasonPicker from "./SeasonPicker"; // adatta il path se necessario

// Componente principale che mostra i dettagli di una serie TV
export default function SerieDettaglioScreen() {
  // Stato per immagine personalizzata (base64)
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  // Recupero parametro `id` dalla route (URL)
  const { id } = useLocalSearchParams();
  const idString = Array.isArray(id) ? id[0] : id;

  // Hook per navigare tra schermate
  const router = useRouter();

  const [userRating, setUserRating] = useState<number | null>(null);   // Voto dell'utente

  const [serie, setSerie] = useState<any | null>(null); // Dati della serie

  const [stagioneSelezionata, setStagioneSelezionata] = useState<number | null>(null); // Stagione visualizzata

  // Episodi visti per stagione
  const [episodiVistiData, setEpisodiVistiData] = useState<{
    [stagione: string]: { [episodio: number]: boolean };
  }>({});

  const [completamentoPercentuale, setCompletamentoPercentuale] = useState(0);
  const [episodiVisti, setEpisodiVisti] = useState(0);
  const [episodiTotali, setEpisodiTotali] = useState(0);

  // Caricamento dell'immagine se è un file locale
  useEffect(() => {
    const loadBase64 = async () => {
      if (serie?.poster_path?.startsWith("file://")) {
        try {
          const base64 = await FileSystem.readAsStringAsync(serie.poster_path, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageBase64(`data:image/png;base64,${base64}`);
        } catch (e) {
          console.error("Errore caricamento base64:", e);
        }
      }
    };
    loadBase64();
  }, [serie]);

  // Carica la serie selezionata da AsyncStorage in base all'ID
  useEffect(() => {
    const fetchSerie = async () => {
      const data = await AsyncStorage.getItem("serie.json");
      const lista = data ? JSON.parse(data) : [];
      const trovata = lista.find((s: any) => String(s.id) === String(idString));
      setSerie(trovata);
      console.log("SERIE TROVATA:", trovata);
      console.log("Stagioni Dettagli:", trovata?.stagioniDettagli);
    };
    fetchSerie();
  }, [id]);

  // Verifica se è tra i preferiti
  useEffect(() => {
    if (serie) {
      isFavorite(serie.id).then((fav) => setIsFav(fav));
    }
  }, [serie]);

  // Caricamento degli episodi visti dal salvataggio
  useEffect(() => {
    const loadEpisodi = async () => {
      if (serie) {
        const key = `episodiVisti-${serie.id}`;
        const stored = await AsyncStorage.getItem(key);
        setEpisodiVistiData(stored ? JSON.parse(stored) : {});
      }
    };
    loadEpisodi();
  }, [serie]);

  // Carica il voto dell’utente se presente
  useEffect(() => {
    const loadRating = async () => {
      const stored = await AsyncStorage.getItem(`userRating-${serie?.id}`);
      if (stored) setUserRating(parseFloat(stored));
    };
    if (serie) loadRating();
  }, [serie]);

  // Salva il voto quando viene aggiornato
  useEffect(() => {
    if (userRating !== null && serie) {
      AsyncStorage.setItem(`userRating-${serie.id}`, String(userRating));
    }
  }, [userRating]);

  // Funzione per segnare un episodio come visto/non visto
  const toggleEpisodioVisto = async (index: number) => {
    if (!serie || stagioneSelezionata === null) return;

    const stagioneKey = `s${stagioneSelezionata}`;
    const episodiStagione = episodiVistiData[stagioneKey] || {};

    const updatedStagione = {
      ...episodiStagione,
      [index]: !episodiStagione[index],
    };

    const updatedData = {
      ...episodiVistiData,
      [stagioneKey]: updatedStagione,
    };

    setEpisodiVistiData(updatedData);

    const key = `episodiVisti-${serie.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(updatedData));

    // Calcola se tutte le stagioni sono completate
    const tutteLeStagioniComplete = serie.stagioniDettagli.every(
      (stagione: any) => {
        const key = `s${stagione.stagione}`;
        const visti = updatedData[key] || {};
        return Object.values(visti).filter(Boolean).length === stagione.episodi;
      }
    );

    const nuovoStato = tutteLeStagioniComplete ? "Completata" : "In corso";

    // Aggiorna lo stato nella serie e nel file JSON
    if (serie.stato !== nuovoStato) {
      const data = await AsyncStorage.getItem("serie.json");
      if (!data) return;

      const lista = JSON.parse(data);
      const aggiornata = lista.map((s: any) =>
        String(s.id) === String(serie.id) ? { ...s, stato: nuovoStato } : s
      );

      await AsyncStorage.setItem("serie.json", JSON.stringify(aggiornata));
      setSerie((prev: any) => prev && { ...prev, stato: nuovoStato });
    }
  };

  // Gestione aggiunta/rimozione dai preferiti
  const toggleFavorite = async () => {
    if (!serie) return;

    const alreadyFav = await isFavorite(serie.id);

    if (alreadyFav) {
      await removeFavorite(serie.id);
    } else {
      await saveFavorite(serie);
    }

    const updated = await isFavorite(serie.id);
    setIsFav(updated);
  };

  // Calcola percentuale completamento in base agli episodi visti
  useEffect(() => {
    if (serie && serie.stagioniDettagli) {
      let visti = 0;
      let totali = 0;

      serie.stagioniDettagli.forEach((stagione: any) => {
        const key = `s${stagione.stagione}`;
        const episodi = stagione.episodi;
        const vistiStagione = Object.values(episodiVistiData[key] || {}).filter(
          Boolean
        ).length;

        totali += episodi;
        visti += vistiStagione;
      });

      setEpisodiTotali(totali);
      setEpisodiVisti(visti);
      setCompletamentoPercentuale(totali > 0 ? visti / totali : 0);
    }
  }, [serie, episodiVistiData]);

  // Funzione per eliminare la serie (con conferma)
  const deleteSerie = () => {
    Alert.alert(
      "Conferma eliminazione",
      "Sei sicuro di voler eliminare questa serie?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            console.log("Eliminazione serie:", serie.id);

            const data = await AsyncStorage.getItem("serie.json");
            if (!data) {
              console.log("Nessun dato in serie.json");
              return;
            }
            const lista = JSON.parse(data);
            const nuovaLista = lista.filter(
              (s: any) => String(s.id) !== String(serie.id)
            );
            await AsyncStorage.setItem(
              "serie.json",
              JSON.stringify(nuovaLista)
            );
            console.log("Serie rimossa da serie.json");

            // Elimina i dati degli episodi salvati
            await AsyncStorage.removeItem(`episodiVisti-${serie.id}`);
            console.log("Dati episodi rimossi");

            // Rimuove dati episodi e preferiti
            await removeFavorite(serie.id);
            console.log("Serie rimossa dai preferiti");

            router.back(); // Torna alla schermata precedente
          },
        },
      ]
    );
  };

  // Se la serie non è stata ancora caricata, mostra un messaggio di caricamento
  if (!serie) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Caricamento...</Text>
      </View>
    );
  }

  // Recupera le stagioni della serie, oppure un array vuoto se mancano
  const stagioni = serie?.stagioniDettagli ?? [];

  // Recupera il numero di episodi della stagione attualmente selezionata
  const episodiStagioneCorrente =
    stagioni.find((s: any) => s.stagione === stagioneSelezionata)?.episodi ?? 0;

  // Recupera gli episodi visti per la stagione corrente
  const episodiAttivi =
    stagioneSelezionata !== null
      ? episodiVistiData[`s${stagioneSelezionata}`] || {}
      : {};
  // console.log("serie.poster_path", serie.poster_path);

  // Determina l'URI dell'immagine da visualizzare (online, locale o segnaposto)
  const imageUri = (() => {
    if (!serie.poster_path)
      return "https://via.placeholder.com/342x480?text=No+Image"; // fallback
    if (serie.poster_path.startsWith("file://"))
      return `${serie.poster_path}?timestamp=${Date.now()}`; // forzo reload cache
    if (serie.poster_path.startsWith("/"))
      return `https://image.tmdb.org/t/p/w342${serie.poster_path}`; // URL TMDb
    return serie.poster_path; // URL completo già pronto
  })();

  // console.log("Visualizzo immagine con URI:", imageUri);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f2a" }}>
        <ScrollView style={styles.container}>

          {/* Header con tasto Indietro e (se non è suggerita) tasto Modifica */}
          <View style={[styles.back, { justifyContent: "space-between" }]}>
            <Pressable
              onPress={() => router.back()}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
              <Text style={styles.backText}>Indietro</Text>
            </Pressable>

            {/* Se la serie non è "suggerita", consente la modifica */}
            {serie.stato !== "suggerita" && (
              <Pressable
                onPress={() => {
                  router.push({
                    pathname: "/modifica",
                    params: {
                      id: serie.id,
                      titolo: serie.titolo,
                      overview: serie.trama,
                      genere: serie.genere,
                      piattaforma: serie.piattaforma,
                      poster_path: serie.poster_path,
                      rating: serie.rating,
                      anno: serie.anno,
                    },
                  });
                }}
                style={{ paddingHorizontal: 4 }}
              >
                <Ionicons name="create-outline" size={24} color="#fff" />
              </Pressable>
            )}
          </View>

          {/* Immagine della serie */}
          <Image
            source={{ uri: imageBase64 || imageUri }}
            style={styles.poster}
          />

          {/* Titolo e pulsante preferito */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{serie.titolo}</Text>
            <TouchableOpacity onPress={toggleFavorite}>
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={30}
                color="#ff4d6d"
                style={styles.favoriteIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Anno e stato della serie (Completata / In corso) */}
          <Text style={styles.meta}>
            {serie.anno}
            {serie.stato !== "suggerita" && (
              <>
                {" · "}
                <Text
                  style={{
                    color: serie.stato === "Completata" ? "lightgreen" : "#aaa",
                  }}
                >
                  {serie.stato === "Completata" ? "Completata" : "In corso"}
                </Text>
              </>
            )}
          </Text>

          {/* Barra di progresso della visione */}
          <View style={{ marginVertical: 10 }}>
            <View
              style={{
                height: 8,
                backgroundColor: "#333",
                borderRadius: 10,
                overflow: "hidden",
                width: "100%",
              }}
            >
              <LinearGradient
                colors={["#a18cd1", "#fbc2eb"]}
                start={[0, 0]}
                end={[1, 0]}
                style={{
                  height: "100%",
                  width: `${completamentoPercentuale * 100}%`,
                }}
              />
            </View>
            <Text
              style={{ color: "#aaa", alignSelf: "flex-end", marginTop: 4 }}
            >
              {episodiVisti}/{episodiTotali}
            </Text>
          </View>

          {/* Valutazione dell'utente con stelle */}
          {serie?.stato !== "suggerita" && (
            <>
              <Text style={styles.sectionTitle}>Il tuo voto</Text>
              <View style={{ alignItems: "flex-start", marginBottom: 16 }}>
                <StarRating
                  rating={userRating ?? 0}
                  onChange={setUserRating}
                  starSize={28}
                  color="#ffdd57"
                  enableSwiping={true}
                  style={{ marginBottom: 3 }}
                />
              </View>
            </>
          )}

          {/* Trama della serie */}
          <Text style={styles.sectionTitle}>Trama</Text>
          <Text style={styles.desc}>
            {serie.trama ?? "Trama non disponibile."}
          </Text>

          {/* Picker per selezionare la stagione e lista episodi */}
          {stagioni.length > 0 && serie.stato !== "suggerita" && (
            <>
              <SeasonPicker
                stagioni={stagioni.map((s: any) => s.stagione)}
                stagioneSelezionata={stagioneSelezionata}
                onChange={(val) => setStagioneSelezionata(val)}
              />

              {stagioneSelezionata !== null && (
                <View style={styles.episodiContainer}>
                  {[...Array(episodiStagioneCorrente)].map((_, i) => (
                    <Animated.View
                      key={`ep-${i}-${stagioneSelezionata}`}
                      entering={FadeInUp.springify().delay(i * 40)}
                    >
                      <TouchableOpacity
                        style={[
                          styles.episodioRow,
                          episodiAttivi[i] && styles.episodioRowChecked,
                        ]}
                        onPress={() => toggleEpisodioVisto(i)}
                      >
                        <Text style={styles.episodioLabel}>
                          S{stagioneSelezionata} E{i + 1}
                        </Text>
                        {episodiAttivi[i] && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#6c2bd9"
                          />
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.buttonsRow}>
          {/* Bottone per iniziare a guardare la serie (se è solo suggerita) */}
          {serie.stato === "suggerita" && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                router.push({
                  pathname: "/modifica",
                  params: {
                    id: serie.id,
                    titolo: serie.titolo,
                    overview: serie.trama,
                    genere: serie.genere,
                    piattaforma: serie.piattaforma,
                    poster_path: serie.poster_path,
                    rating: serie.rating,
                    anno: serie.anno,
                    stato: "suggerita", // ancora suggerita
                    stagioni: JSON.stringify(serie.stagioniDettagli ?? []),
                    episodi: "",
                  },
                });
              }}
            >
              <Ionicons name="play-outline" size={18} color="#fff" />
              <Text style={styles.startButtonText}>Inizia a guardare</Text>

            </TouchableOpacity>
          )}

          {/* Bottone per eliminare la serie */}
          <TouchableOpacity onPress={deleteSerie} style={styles.resetButton}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.resetText}>Elimina Serie</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>
      
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f0f2a",
    flex: 1,
    padding: 16,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
  },
  pickerWrapper: {
    backgroundColor: "#222",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#444",
  },

  picker: {
    color: Platform.OS === "ios" ? "#fff" : undefined,
    height: Platform.OS === "ios" ? 200 : 50,
    width: "100%",
  },

  poster: {
    width: "100%",
    height: 480,
    resizeMode: "cover",
    borderRadius: 8,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    flex: 1,
  },
  favoriteIcon: {
    marginLeft: 8,
  },
  meta: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  desc: {
    color: "#ddd",
    fontSize: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    marginVertical: 12,
    fontWeight: "600",
  },
  episodiContainer: {
    marginBottom: 20,
  },
  episodio: {
    color: "#fff",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    margin: 4,
    fontSize: 14,
  },
  episodioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#1e1e3f",
  },

  checkbox: {
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    backgroundColor: "#0f0f2a",
    justifyContent: "center",
    alignItems: "center",
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
  startButton: {
    alignSelf: "center",
    marginVertical: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#4CAF50", // verde vivo
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  episodioLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },

  episodioRowChecked: {
    backgroundColor: "#2e2e5a",
    borderWidth: 1.5,
    borderColor: "#6c2bd9",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12, 
    marginVertical: 20,
  },
});
