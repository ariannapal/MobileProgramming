import { View, Text, StyleSheet } from "react-native";

export default function AggiungiScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aggiungi Nuova Serie</Text>
      {/* Qui andrà il form per aggiungere una nuova serie */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});