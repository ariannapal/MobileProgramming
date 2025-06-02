import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";

import {
  Alert,
  Button,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import categorieJson from "../../assets/data/categorie.json";

const STORAGE_KEY = "categorie_dati";
const SERIE_KEY = "serie.json";

const CategorieScreen = () => {
  const router = useRouter();
  type Categoria = { id: string; nome: string };

  const [categorie, setCategorie] = useState<{
    piattaforme: Categoria[];
    generi: Categoria[];
  }>({ piattaforme: [], generi: [] });

  const [conteggi, setConteggi] = useState<{
    piattaforme: Record<string, number>;
    generi: Record<string, number>;
  }>({ piattaforme: {}, generi: {} });

  const [modalVisible, setModalVisible] = useState(false);
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState<"piattaforma" | "genere">(
    "piattaforma"
  );
  const eliminaCategoria = async (
    id: string,
    tipo: "piattaforme" | "generi"
  ) => {
    const nuoveCategorie = {
      ...categorie,
      [tipo]: categorie[tipo].filter((item) => item.id !== id),
    };

    setCategorie(nuoveCategorie);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuoveCategorie));
  };

  useFocusEffect(
    useCallback(() => {
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

          // Carica le serie
          const serieSalvate = await AsyncStorage.getItem(SERIE_KEY);
          const parsedSerie = serieSalvate ? JSON.parse(serieSalvate) : [];

          const conteggiGeneri: Record<string, number> = {};
          const conteggiPiattaforme: Record<string, number> = {};

          for (const serie of parsedSerie) {
            if (serie.stato === "suggerita") {
              continue; // Salta questa serie
            }
            if (serie.genere) {
              conteggiGeneri[serie.genere] =
                (conteggiGeneri[serie.genere] || 0) + 1;
            }
            if (serie.piattaforma) {
              conteggiPiattaforme[serie.piattaforma] =
                (conteggiPiattaforme[serie.piattaforma] || 0) + 1;
            }
          }

          setConteggi({
            generi: conteggiGeneri,
            piattaforme: conteggiPiattaforme,
          });
        } catch (err) {
          console.error("Errore nel caricamento categorie:", err);
        }
      };

      caricaCategorie();
    }, [])
  );

  const aggiungiCategoria = async () => {
    const nomePulito = nomeCategoria.trim().toLowerCase();
    if (!nomePulito) return;

    const listaEsistente =
      tipoCategoria === "piattaforma"
        ? categorie.piattaforme
        : categorie.generi;

    const esisteGia = listaEsistente.some(
      (cat) => cat.nome.trim().toLowerCase() === nomePulito
    );

    if (esisteGia) {
      Alert.alert(
        "Categoria esistente",
        `Esiste già una ${
          tipoCategoria === "piattaforma"
            ? "piattaforma"
            : "categoria di genere"
        } con questo nome.`
      );
      return;
    }

    const nuovaCategoria = {
      id: Date.now().toString(),
      nome: nomeCategoria.trim(),
      count: 0,
    };

    const nuovoStato = {
      ...categorie,
      [tipoCategoria === "piattaforma" ? "piattaforme" : "generi"]: [
        ...listaEsistente,
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.header}>Piattaforme</Text>
          <Pressable
            onPress={() => {
              setTipoCategoria("piattaforma");
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
            onLongPress={() =>
              // Mostra conferma eliminazione
              Alert.alert(
                "Elimina piattaforma",
                `Sei sicuro di voler eliminare "${item.nome}"?`,
                [
                  { text: "Annulla", style: "cancel" },
                  {
                    text: "Elimina",
                    style: "destructive",
                    onPress: () => eliminaCategoria(item.id, "piattaforme"),
                  },
                ]
              )
            }
          >
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.contatore}>
              ({conteggi.piattaforme[item.nome] || 0} serie)
            </Text>
          </Pressable>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.header}>Generi</Text>
          <Pressable
            onPress={() => {
              setTipoCategoria("genere");
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
            onLongPress={() =>
              Alert.alert("Elimina genere", `Vuoi eliminare "${item.nome}"?`, [
                { text: "Annulla", style: "cancel" },
                {
                  text: "Elimina",
                  style: "destructive",
                  onPress: () => eliminaCategoria(item.id, "generi"),
                },
              ])
            }
          >
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.contatore}>
              ({conteggi.generi[item.nome] || 0} serie)
            </Text>
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
                <Button
                  title="Annulla"
                  onPress={() => setModalVisible(false)}
                />
                <Button title="Salva" onPress={aggiungiCategoria} />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategorieScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f2a", // dark blu/viola
    padding: 16,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 20,
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
