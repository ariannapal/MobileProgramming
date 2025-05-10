import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const seriesList = [
  {
    id: "1",
    titolo: "Stranger Things",
    image: "https://i.imgur.com/1.jpg",
  },
  {
    id: "2",
    titolo: "Breaking Bad",
    image: "https://i.imgur.com/2.jpg",
  },
];

const suggestedSeries = [
  {
    id: "3",
    titolo: "The Witcher",
    image: "https://i.imgur.com/3.jpg",
  },
  {
    id: "4",
    titolo: "The Crown",
    image: "https://i.imgur.com/4.jpg",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/serie/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title} numberOfLines={2}>
        {item.titolo}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Bottone Aggiungi */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/(tabs)/home/aggiungi")}
      >
        <Ionicons name="add" size={26} color="white" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Le tue Serie TV viste</Text>
      <FlatList
        data={seriesList}
        keyExtractor={(item) => item.id}
        horizontal
        renderItem={renderItem}
        contentContainerStyle={styles.horizontalList}
        showsHorizontalScrollIndicator={false}
      />

      <Text style={styles.sectionTitle}>Suggeriti per te</Text>
      <FlatList
        data={suggestedSeries}
        keyExtractor={(item) => item.id}
        horizontal
        renderItem={renderItem}
        contentContainerStyle={styles.horizontalList}
        showsHorizontalScrollIndicator={false}
      />
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
  addButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "purple",
    padding: 12,
    borderRadius: 50,
    zIndex: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "left",
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
});
