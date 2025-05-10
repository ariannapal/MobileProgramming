import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import categorieJson from "../../assets/data/categorie.json";

const STORAGE_KEY = "categorie_dati";

const CategorieScreen = () => {
  const router = useRouter();
  type Categoria = { id: string; nome: string; count: number };

  const [categorie, setCategorie] = useState<{
    piattaforme: Categoria[];
    generi: Categoria[];
  }>({ piattaforme: [], generi: [] });

  const [modalVisible, setModalVisible] = useState(false);
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState<"piattaforma" | "genere">(
    "piattaforma"
  );
  useEffect(() => {
    const caricaCategorie = async () => {
      try {
        const salvate = await AsyncStorage.getItem(STORAGE_KEY);
        if (salvate) {
          setCategorie(JSON.parse(salvate));
        } else {
          setCategorie(categorieJson);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(categorieJson)
          );
        }
      } catch (err) {
        console.error("Errore nel caricamento categorie:", err);
      }
    };

    caricaCategorie();
  }, []);

  const aggiungiCategoria = async () => {
    if (!nomeCategoria.trim()) return;

    const nuovaCategoria = {
      id: Date.now().toString(),
      nome: nomeCategoria.trim(),
      count: 0,
    };

    const nuovoStato = {
      ...categorie,
      [tipoCategoria === "piattaforma" ? "piattaforme" : "generi"]: [
        ...categorie[
          tipoCategoria === "piattaforma" ? "piattaforme" : "generi"
        ],
        nuovaCategoria,
      ],
    };

    setCategorie(nuovoStato);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuovoStato));

    setNomeCategoria("");
    setTipoCategoria("piattaforma");
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.header}>Piattaforme</Text>
        <Pressable
          onPress={() => {
            setTipoCategoria("piattaforma"); // o "genere"
            setModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={30} color="#a866ff" />
        </Pressable>
      </View>

      {categorie.piattaforme.map((item) => (
        <Pressable
          key={item.id}
          style={styles.riga}
          onPress={() =>
            router.push(`/categorie/${encodeURIComponent(item.nome)}`)
          }
        >
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.contatore}>({item.count} serie)</Text>
        </Pressable>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.header}>Generi</Text>
        <Pressable
          onPress={() => {
            setTipoCategoria("genere"); // o "genere"
            setModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={30} color="#a866ff" />
        </Pressable>
      </View>

      {categorie.generi.map((item) => (
        <Pressable
          key={item.id}
          style={styles.riga}
          onPress={() =>
            router.push(`/categorie/${encodeURIComponent(item.nome)}`)
          }
        >
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.contatore}>({item.count} serie)</Text>
        </Pressable>
      ))}

      {/* MODALE */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Nuova{" "}
              {tipoCategoria === "piattaforma"
                ? "Piattaforma"
                : "Categoria di Genere"}
            </Text>

            <TextInput
              placeholder="Nome categoria"
              value={nomeCategoria}
              onChangeText={setNomeCategoria}
              style={styles.input}
            />

            <View style={styles.buttons}>
              <Button title="Annulla" onPress={() => setModalVisible(false)} />
              <Button title="Salva" onPress={aggiungiCategoria} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CategorieScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f2a", // dark blu/viola
    padding: 16,
  },
  header: {
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 20,
    marginBottom: 8,
    color: "#fff",
  },
  riga: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#1c1c3c",
    borderRadius: 10,
    marginBottom: 10,
  },
  nome: {
    fontSize: 16,
    color: "#fff",
  },
  contatore: {
    fontSize: 14,
    color: "#aaa",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  plus: {
    fontSize: 18,
    color: "#a866ff",
  },
  nuovaCategoria: {
    marginTop: 32,
    alignItems: "center",
  },
  link: {
    fontSize: 16,
    color: "#a866ff",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#1c1c3c",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    color: "#fff",
    backgroundColor: "#2a2a45",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
