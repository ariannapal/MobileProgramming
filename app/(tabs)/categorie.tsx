import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

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

  //stato per il setting e l'inserimento di una categoria
  const [categorie, setCategorie] = useState<{
    piattaforme: Categoria[];
    generi: Categoria[];
  }>({ piattaforme: [], generi: [] });

  //numero di serie per categorie
  const [conteggi, setConteggi] = useState<{
    //creo un oggetto record con due proprieta
    piattaforme: Record<string, number>;
    generi: Record<string, number>;
  }>({ piattaforme: {}, generi: {} });

  //modale di aggiunta della categoria o del genere, inizialmente non visibile
  const [modalVisible, setModalVisible] = useState(false);
  //testo digitato dall'utente
  const [nomeCategoria, setNomeCategoria] = useState("");

  //indico se lo l'utente aggiunge una piattafotma o un genere
  //iniziale : piattaforma
  const [tipoCategoria, setTipoCategoria] = useState<"piattaforma" | "genere">(
    "piattaforma"
  );

  //elimino le catagorie
  //passo l'id e la piattaforma/genere
  //creo le nuove categorie, filtrando a quelle vecchie l'item da eliminare
  //sovrascrivo con setCategorie
  //sovrascrivo in AsyncStorage
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

  //funzione per bug fixing in refactoring quando ho categorie con id undefined
  useEffect(() => {
    const normalizzaCategorie = async () => {
      //prendo tutto il file delle categorie
      const raw = await AsyncStorage.getItem("categorie_dati");
      if (!raw) return;

      const parsed = JSON.parse(raw);

      let modificato = false;

      //se ci sono degli id di generi undefined genero l'id anche per loro
      parsed.generi = parsed.generi.map((g: any) => {
        if (!g.id) {
          modificato = true;
          return {
            ...g,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          };
        }
        return g;
      });
      //se ho modificato un id sovrascrivo tutto
      if (modificato) {
        await AsyncStorage.setItem("categorie_dati", JSON.stringify(parsed));
      }
    };

    normalizzaCategorie();
  }, []);

  //ogni volta che rientro sulla pagina rifaccio il caricamento dall'async
  useFocusEffect(
    useCallback(() => {
      const caricaCategorie = async () => {
        try {
          //prendo tutte le categorie salvate
          const salvate = await AsyncStorage.getItem(STORAGE_KEY);
          if (salvate) {
            //aggiorno lo stato facendo parsing
            setCategorie(JSON.parse(salvate));
          } else {
            //se non ce ne sono prendo quelle hardcoded e le salvo nell'asyncstorage
            setCategorie(categorieJson);
            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(categorieJson)
            );
          }

          // Carica le serie per fare il conteggio
          const serieSalvate = await AsyncStorage.getItem(SERIE_KEY);
          const parsedSerie = serieSalvate ? JSON.parse(serieSalvate) : [];

          //inizializzo due variabili record per inserirli nello stato dopo
          const conteggiGeneri: Record<string, number> = {};
          const conteggiPiattaforme: Record<string, number> = {};

          //scorro le seire nle parsing e salto quelle nei suggeriti
          for (const serie of parsedSerie) {
            if (serie.stato === "suggerita") {
              continue; // Salta questa serie
            }
            //incremento i conteggi in ConteggiGeneri
            if (serie.genere) {
              //accedo alla chiave, se non esiste la setto a 0 + 1
              //se esiste prendo il conteggio di prima + 1
              conteggiGeneri[serie.genere] =
                (conteggiGeneri[serie.genere] || 0) + 1;
            }
            if (serie.piattaforma) {
              conteggiPiattaforme[serie.piattaforma] =
                (conteggiPiattaforme[serie.piattaforma] || 0) + 1;
            }
          }
          //setto lo stato
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

  //utente aggiunge la categoria
  const aggiungiCategoria = async () => {
    //prendo il valore dal textinput
    const nomePulito = nomeCategoria.trim().toLowerCase();
    if (!nomePulito) return;

    //prendo la lista in base allo stato che ho settato quando ho premuto +
    const listaEsistente =
      tipoCategoria === "piattaforma"
        ? categorie.piattaforme
        : categorie.generi;

    //verifica esistenza duplicati
    //some verifica che esista almeno un elemento con quel avlore nella lista
    const esisteGia = listaEsistente.some(
      //per ogni cat nella lista, prendo il nome e lo pulisco  e lo confronto con nomepulito
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

    //setto la nuova categoria con un count pari a 0
    const nuovaCategoria = {
      id: Date.now().toString(),
      nome: nomeCategoria.trim(),
      count: 0,
    };

    //setto un nuovo stato
    //copio tutte le categorie precedenti (sia piattaforme che generi)
    //setto il nuovo tipo della categoria
    const nuovoStato = {
      ...categorie,
      //calcolo chiave, se tipo = piattaforma, la chiave --> piattaforma
      [tipoCategoria === "piattaforma" ? "piattaforme" : "generi"]: [
        //copio tutti gli elementi gia presenti
        ...listaEsistente,
        //aggiungo la nuova categoria
        nuovaCategoria,
      ],
    };

    //setto il nuovo stato
    setCategorie(nuovoStato);
    //aggiorno lo storage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuovoStato));

    //riporto lo stato a quello iniziale
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

        {categorie.generi
          .filter((item) => item?.id !== undefined)
          .map((item) => (
            <Pressable
              key={item.id}
              style={styles.riga}
              onPress={() =>
                router.push(`/categorie/${encodeURIComponent(item.nome)}`)
              }
              onLongPress={() =>
                Alert.alert(
                  "Elimina genere",
                  `Vuoi eliminare "${item.nome}"?`,
                  [
                    { text: "Annulla", style: "cancel" },
                    {
                      text: "Elimina",
                      style: "destructive",
                      onPress: () => eliminaCategoria(item.id, "generi"),
                    },
                  ]
                )
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
