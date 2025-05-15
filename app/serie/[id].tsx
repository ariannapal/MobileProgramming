import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { isFavorite, saveFavorite } from "../utils/favoritesStorage";
import { Picker } from "@react-native-picker/picker";
import { Checkbox } from "expo-checkbox";  // Importa il componente Checkbox

export default function SerieDettaglioScreen() {
  const [isFav, setIsFav] = useState(false);
  const { id } = useLocalSearchParams();
  const idString = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [serie, setSerie] = useState<any | null>(null);
  const [stagioneSelezionata, setStagioneSelezionata] = useState<number | null>(null);
  const [episodiVisti, setEpisodiVisti] = useState<{ [key: string]: boolean }>({});

  // Recupera la serie e aggiorna gli episodi visti
  useEffect(() => {
    const fetchSerie = async () => {
      const data = await AsyncStorage.getItem("serie.json");
      const lista = data ? JSON.parse(data) : [];
      const trovata = lista.find((s: any) => String(s.id) === String(idString));
      setSerie(trovata);
    };
    fetchSerie();
  }, [id]);

  // Aggiorna lo stato del "favorito"
  useEffect(() => {
    if (serie) {
      isFavorite(serie.id).then((favoriteStatus) => {
        setIsFav(!!favoriteStatus);
      });
    }
  }, [serie]);

  // Carica gli episodi visti per la stagione selezionata
  useEffect(() => {
    const loadEpisodi = async () => {
      if (serie && stagioneSelezionata !== null) {
        const key = `episodiVisti-${serie.id}-s${stagioneSelezionata}`;
        const data = await AsyncStorage.getItem(key);
        if (data) {
          setEpisodiVisti(JSON.parse(data));
        } else {
          setEpisodiVisti({});
        }
      }
    };
    loadEpisodi();
  }, [stagioneSelezionata]);

  // Funzione per aggiornare lo stato di un episodio (visto/non visto)
  const toggleEpisodioVisto = async (index: number) => {
    const updated = { ...episodiVisti, [index]: !episodiVisti[index] };
    setEpisodiVisti(updated);

    const key = `episodiVisti-${serie.id}-s${stagioneSelezionata}`;
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  };

  // Funzione per segnare la serie come preferita
  const toggleFavorite = async () => {
    if (serie) {
      await saveFavorite(serie);
      const updated = await isFavorite(serie.id);
      setIsFav(updated);
    }
  };

  // Funzione per eliminare la serie
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
            const data = await AsyncStorage.getItem("serie.json");
            if (!data) return;
            const lista = JSON.parse(data);
            const nuovaLista = lista.filter((s: any) => String(s.id) !== String(serie.id));
            await AsyncStorage.setItem("serie.json", JSON.stringify(nuovaLista));
            router.back();
          },
        },
      ],
      { cancelable: true }
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
  const episodiStagioneCorrente = stagioni.find(
    (s: any) => s.stagione === stagioneSelezionata
  )?.episodi ?? 0;

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
        <Text style={styles.backText}>Indietro</Text>
      </Pressable>

      <Image
        source={{
          uri: serie.poster_path
            ? `https://image.tmdb.org/t/p/w342${serie.poster_path}`
            : "https://via.placeholder.com/342x480?text=No+Image",
        }}
        style={styles.poster}
      />

      <View style={styles.titleRow}>
        <Text style={styles.title}>{serie.titolo}</Text>
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons
            name={isFav ? "star" : "star-outline"}
            size={24}
            color="gold"
            style={styles.favoriteIcon}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.meta}>⭐ {serie.rating} · {serie.anno}</Text>
      <Text style={styles.desc}>{serie.trama ?? "Trama non disponibile."}</Text>

      {/* Picker per le stagioni */}
      {stagioni.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Stagioni</Text>
          <Picker
            selectedValue={stagioneSelezionata}
            onValueChange={(value) => setStagioneSelezionata(value)}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Seleziona una stagione" value={null} />
            {stagioni.map((stagione: any) => (
              <Picker.Item
                key={stagione.stagione}
                label={`Stagione ${stagione.stagione}`}
                value={stagione.stagione}
              />
            ))}
          </Picker>

          {/* Lista episodi */}
          {stagioneSelezionata !== null && (
            <View style={styles.episodiContainer}>
              {[...Array(episodiStagioneCorrente)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.episodioRow}
                  onPress={() => toggleEpisodioVisto(i)}
                >
                  <Text style={styles.episodio}>S{stagioneSelezionata} E{i + 1}</Text>
                  {/* Utilizzo di expo-checkbox per il checkbox */}
                  <Checkbox
                    style={styles.checkbox}
                    value={episodiVisti[i]}
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
  picker: {
    backgroundColor: "#222",
    color: "#fff",
    marginBottom: 10,
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
    justifyContent: "space-between",  // Sposta il checkbox a destra
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    marginLeft: 8,  // Per separare il checkbox dal testo
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
});
