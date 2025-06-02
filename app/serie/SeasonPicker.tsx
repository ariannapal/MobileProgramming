// Componente Picker personalizzato con Modal per selezionare stagioni
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  stagioni: number[];
  stagioneSelezionata: number | null;
  onChange: (val: number) => void;
}

export default function SeasonPicker({
  stagioni,
  stagioneSelezionata,
  onChange,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Stagioni</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>
          {stagioneSelezionata
            ? `Stagione ${stagioneSelezionata}`
            : "Seleziona una stagione"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Seleziona una stagione</Text>
            <FlatList
              data={stagioni}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onChange(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.itemText}>Stagione {item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#1f1f3a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalContainer: {
    backgroundColor: "#2a2a45",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  item: {
    paddingVertical: 12,
    borderBottomColor: "#444",
    borderBottomWidth: 1,
  },
  itemText: {
    color: "#fff",
    fontSize: 16,
  },
});
