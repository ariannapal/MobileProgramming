import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Serie viste
const seriesList = [
  {
    id: "1",
    title: "Breaking Bad",
    image: "https://via.placeholder.com/120x180.png?text=Breaking+Bad",
  },
  {
    id: "2",
    title: "The Mandalorian",
    image: "https://via.placeholder.com/120x180.png?text=Mandalorian",
  },
  {
    id: "3",
    title: "Stranger Things",
    image: "https://via.placeholder.com/120x180.png?text=Stranger+Things",
  },
  {
    id: "4",
    title: "Loki",
    image: "https://via.placeholder.com/120x180.png?text=Loki",
  },
];

// Suggeriti per te
const suggestedSeries = [
  {
    id: "5",
    title: "The Witcher",
    image: "https://via.placeholder.com/120x180.png?text=Witcher",
  },
  {
    id: "6",
    title: "Dark",
    image: "https://via.placeholder.com/120x180.png?text=Dark",
  },
  {
    id: "7",
    title: "The Boys",
    image: "https://via.placeholder.com/120x180.png?text=Boys",
  },
  {
    id: "8",
    title: "The Crown",
    image: "https://via.placeholder.com/120x180.png?text=Crown",
  },
];

export default function HomeScreen() {
  const router = useRouter();



  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
    </View>
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
    backgroundColor: "#fff",
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
  },
});