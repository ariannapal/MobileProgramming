import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkbox } from "expo-checkbox";
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
import { SafeAreaView } from "react-native-safe-area-context";
import StarRating from "react-native-star-rating-widget";
import {
  isFavorite,
  removeFavorite,
  saveFavorite,
} from "../_utils/favoritesStorage";

import SeasonPicker from "./SeasonPicker"; // adatta il path se necessario

export default function SerieDettaglioScreen() {
  //ciaoooo loeg
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);
  const { id } = useLocalSearchParams();
  const idString = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [userRating, setUserRating] = useState<number | null>(null);

  const [serie, setSerie] = useState<any | null>(null);
  const [stagioneSelezionata, setStagioneSelezionata] = useState<number | null>(
    null
  );
  const [episodiVistiData, setEpisodiVistiData] = useState<{
    [stagione: string]: { [episodio: number]: boolean };
  }>({});
  const [completamentoPercentuale, setCompletamentoPercentuale] = useState(0);
  const [episodiVisti, setEpisodiVisti] = useState(0);
  const [episodiTotali, setEpisodiTotali] = useState(0);
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

  useEffect(() => {
    if (serie) {
      isFavorite(serie.id).then((fav) => setIsFav(fav));
    }
  }, [serie]);

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
  useEffect(() => {
    const loadRating = async () => {
      const stored = await AsyncStorage.getItem(`userRating-${serie?.id}`);
      if (stored) setUserRating(parseFloat(stored));
    };
    if (serie) loadRating();
  }, [serie]);

  useEffect(() => {
    if (userRating !== null && serie) {
      AsyncStorage.setItem(`userRating-${serie.id}`, String(userRating));
    }
  }, [userRating]);

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

    // Verifica se tutte le stagioni sono completate
    const tutteLeStagioniComplete = serie.stagioniDettagli.every(
      (stagione: any) => {
        const key = `s${stagione.stagione}`;
        const visti = updatedData[key] || {};
        return Object.values(visti).filter(Boolean).length === stagione.episodi;
      }
    );

    const nuovoStato = tutteLeStagioniComplete ? "Completata" : "In corso";

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

            // ✅ Elimina i dati degli episodi salvati
            await AsyncStorage.removeItem(`episodiVisti-${serie.id}`);
            console.log("Dati episodi rimossi");

            await removeFavorite(serie.id);
            console.log("Serie rimossa dai preferiti");

            router.back();
          },
        },
      ]
    );
  };

  if (!serie) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Caricamento...</Text>
      </View>
    );
  }

  const stagioni = serie?.stagioniDettagli ?? [];
  const episodiStagioneCorrente =
    stagioni.find((s: any) => s.stagione === stagioneSelezionata)?.episodi ?? 0;

  const episodiAttivi =
    stagioneSelezionata !== null
      ? episodiVistiData[`s${stagioneSelezionata}`] || {}
      : {};
  console.log("serie.poster_path", serie.poster_path);
  const imageUri = (() => {
    if (!serie.poster_path)
      return "https://via.placeholder.com/342x480?text=No+Image";
    if (serie.poster_path.startsWith("file://"))
      return `${serie.poster_path}?timestamp=${Date.now()}`; // forzo reload cache
    if (serie.poster_path.startsWith("/"))
      return `https://image.tmdb.org/t/p/w342${serie.poster_path}`;
    return serie.poster_path;
  })();

  console.log("Visualizzo immagine con URI:", imageUri);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f2a" }}>
        <ScrollView style={styles.container}>
          <View style={[styles.back, { justifyContent: "space-between" }]}>
            <Pressable
              onPress={() => router.back()}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
              <Text style={styles.backText}>Indietro</Text>
            </Pressable>
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

          <Image
            source={{ uri: imageBase64 || imageUri }}
            style={styles.poster}
          />

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

          <Text style={styles.sectionTitle}>Trama</Text>
          <Text style={styles.desc}>
            {serie.trama ?? "Trama non disponibile."}
          </Text>

          {serie.stato === "suggerita" && (
           <TouchableOpacity
           style={styles.startButton}
           onPress={async () => {
             const data = await AsyncStorage.getItem("serie.json");
             if (!data) return;
         
             const lista = JSON.parse(data);
             const aggiornata = lista.map((s: any) =>
               String(s.id) === String(serie.id)
                 ? { ...s, stato: "In corso" }
                 : s
             );
         
             await AsyncStorage.setItem(
               "serie.json",
               JSON.stringify(aggiornata)
             );
         
             // Trova la serie aggiornata
             const nuovaSerie = aggiornata.find((s: any) => String(s.id) === String(serie.id));
         
             // Aggiorna lo stato locale
             setSerie(nuovaSerie);
         
             // Naviga verso la pagina di modifica passando tutti i dati
             router.push({
               pathname: "/modifica",
               params: {
                 id: nuovaSerie.id,
                 titolo: nuovaSerie.titolo,
                 overview: nuovaSerie.trama,
                 genere: nuovaSerie.genere,
                 piattaforma: nuovaSerie.piattaforma,
                 poster_path: nuovaSerie.poster_path,
                 rating: nuovaSerie.rating,
                 anno: nuovaSerie.anno,
                 stato: nuovaSerie.stato,
                 stagioni: JSON.stringify(nuovaSerie.stagioniDettagli ?? []), // se stagioniDettagli è un array, passa stringificato
                 episodi: "" // se vuoi puoi gestire gli episodi qui o nella pagina di modifica
               },
             });
           }}
         >
           <Text style={styles.startButtonText}>Inizia a guardare</Text>
         </TouchableOpacity>
         
          )}

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
                    <TouchableOpacity
                      key={i}
                      style={styles.episodioRow}
                      onPress={() => toggleEpisodioVisto(i)}
                    >
                      <Text style={styles.episodio}>
                        S{stagioneSelezionata} E{i + 1}
                      </Text>
                      <Checkbox
                        style={styles.checkbox}
                        value={!!episodiAttivi[i]}
                        onValueChange={() => toggleEpisodioVisto(i)}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          <TouchableOpacity onPress={deleteSerie} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Elimina Serie</Text>
          </TouchableOpacity>
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
    marginBottom: 8,
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
  startButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
