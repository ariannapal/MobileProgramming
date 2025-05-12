import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { isFavorite, saveFavorite } from "../utils/favoritesStorage";

export default function SerieDettaglioScreen() {
  const [isFav, setIsFav] = useState(false);
  const { id } = useLocalSearchParams();
  const idString = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [serie, setSerie] = useState<any | null>(null);

  /*useEffect(() => {
    const fetchSerie = async () => {
      const data = await AsyncStorage.getItem("serie.json");
      const lista = data ? JSON.parse(data) : [];
      const trovata = lista.find((s: any) => s.id === idString); // Assicurati che 'id' sia corretto
      setSerie(trovata); // Imposta la serie trovata
    };
  
    fetchSerie();
  }, [id]);*/

  useEffect(() => {
    const fetchSerie = async () => {
      const data = await AsyncStorage.getItem("serie.json");
      const lista = data ? JSON.parse(data) : [];
  
      console.log("DEBUG: lista JSON", lista);
      console.log("DEBUG: id cercato:", idString);
  
      //const trovata = lista.find((s: any) => String(s.id) === String(idString));
      const trovata = lista.find(
        (s: any) =>
          String(s.id) === String(idString) || s.titolo === idString
      );
      
      console.log("DEBUG: serie trovata:", trovata);
  
      setSerie(trovata);
    };
  
    fetchSerie();
  }, [id]);
  
  

  useEffect(() => {
    if (serie) {
      isFavorite(serie.id).then((favoriteStatus) => {
        setIsFav(!!favoriteStatus);  // Assicurati che il valore sia booleano
      });
    }
  }, [serie]);
  

  const toggleFavorite = async () => {
    if (serie) {
      await saveFavorite(serie);
      const updated = await isFavorite(serie.id);
      setIsFav(updated);
    }
  };

  // se non trova la serie: spoiler non la trova maiiiii
  if (!serie) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Caricamento...</Text>
      </View>
    );
  }


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
      : 'https://via.placeholder.com/342x480?text=No+Image' 
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
      <Text style={styles.meta}>
        ⭐ {serie.rating} · {serie.anno}
      </Text>
      <Text style={styles.desc}>{serie.trama ?? "Trama non disponibile."}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f2a", padding: 16 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { color: "#fff", marginLeft: 4 },
  meta: { color: "#ccc", fontSize: 15, marginBottom: 10 },
  desc: { color: "#ddd", fontSize: 16, lineHeight: 22 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f2a",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginRight: 10,
  },
  icon: {
    paddingHorizontal: 4,
  },
  favoriteIcon: {
    paddingHorizontal: 4,
  },
  poster: { 
    width: "100%", // Mantieni la larghezza al 100%
    height: 320,   // Imposta un'altezza fissa
    borderRadius: 12, 
    marginBottom: 16,
    resizeMode: "cover",  // Impedisce che l'immagine venga deformata
  },  
});
