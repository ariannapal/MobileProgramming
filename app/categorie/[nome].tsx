import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Serie = {
  id?: string;
  titolo: string;
  rating?: number;
  anno?: number;
  genere?: string;
  piattaforma?: string;
  poster_path?: string;
  poster?: string;
};

export default function CategoriaScreen() {
  const { nome } = useLocalSearchParams<{ nome: string }>();
  const router = useRouter();

  const [serieFiltrate, setSerieFiltrate] = useState<Serie[]>([]);

  useEffect(() => {
    const caricaSerie = async () => {
      const data = await AsyncStorage.getItem("serie.json");
      const tutteLeSerie: Serie[] = data ? JSON.parse(data) : [];

      const filtrate = tutteLeSerie.filter(
        (s) => s.genere === nome || s.piattaforma === nome
      );

      setSerieFiltrate(filtrate);
    };

    caricaSerie();
  }, [nome]);

  const renderStars = (rating?: number) => {
    if (!rating) return null;

    const fullStars = Math.round(rating / 2); // 8.1 -> 4
    const stars = [];

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Text key={i} style={{ color: i < fullStars ? "#f5c518" : "#555" }}>
          ★
        </Text>
      );
    }

    return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Serie in: {nome}</Text>

        <FlatList
          data={serieFiltrate}
          numColumns={3}
          keyExtractor={(item, index) => item.id || item.titolo + index}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => {
                router.push(
                  `/serie/${item.id || encodeURIComponent(item.titolo)}`
                );
              }}
            >
              <Image
                source={{
                  uri: item.poster_path
                    ? `https://image.tmdb.org/t/p/w185/${item.poster_path}`
                    : item.poster ||
                      "https://via.placeholder.com/100x150?text=?",
                }}
                style={styles.poster}
              />
              <Text numberOfLines={1} style={styles.titolo}>
                {item.titolo}
              </Text>
              {renderStars(item.rating)}
              <Text style={styles.sotto}>{item.anno || "-"}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ color: "#aaa", textAlign: "center" }}>
              Nessuna serie trovata.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0c0c1e",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  grid: {
    gap: 8,
  },
  card: {
    flex: 1 / 3,
    margin: 6,
    alignItems: "center",
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    resizeMode: "cover",
  },
  titolo: {
    marginTop: 6,
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  sotto: {
    color: "#bbb",
    fontSize: 11,
  },
});
