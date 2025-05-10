import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const tutteLeSerie = [
  {
    id: "1",
    titolo: "Stranger Things",
    rating: 4,
    anno: 2025,
    categoria: "Netflix",
    poster: "https://i.imgur.com/x1.jpg",
  },
  {
    id: "2",
    titolo: "The Witcher",
    rating: 4,
    anno: 2024,
    categoria: "Netflix",
    poster: "https://i.imgur.com/x2.jpg",
  },
  {
    id: "3",
    titolo: "Loki",
    rating: 3,
    anno: 2024,
    categoria: "Disney+",
    poster: "https://i.imgur.com/x3.jpg",
  },
  {
    id: "4",
    titolo: "The Boys",
    rating: 4,
    anno: 2023,
    categoria: "Prime Video",
    poster: "https://i.imgur.com/x4.jpg",
  },
];

export default function CategoriaScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { nome } = useLocalSearchParams();
  const serieFiltrate = tutteLeSerie.filter((s) => s.categoria === nome);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Serie su {nome}</Text>

        <FlatList
          data={serieFiltrate}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => {
                console.log("Navigazione verso serie con ID:", item.id); // 👈 stampa in console
                router.push(`/serie/${item.id}`);
              }}
            >
              <Image source={{ uri: item.poster }} style={styles.poster} />
              <Text numberOfLines={1} style={styles.titolo}>
                {item.titolo}
              </Text>
              <Text style={styles.sotto}>
                ⭐ {item.rating} · {item.anno}
              </Text>
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
