import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

const preferiteMock = [
  { id: "1", titolo: "Breaking Bad" },
  { id: "2", titolo: "Stranger Things" },
  { id: "3", titolo: "Dark" },
];

export default function PreferitiScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Le tue serie preferite</Text>
      <FlatList
        data={preferiteMock}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardText}>{item.titolo}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 18,
  },
});
