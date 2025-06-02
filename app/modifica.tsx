import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import categorieHardcoded from "../assets/data/categorie.json";

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { isFavorite, saveFavorite } from "./_utils/favoritesStorage";
import { TMDB_API_TOKEN } from "./_utils/tmdb-config";

export default function ModificaScreen() {
  //stato del poster inserito da locale. Valore stringa o null, stato 0 = null
  const [localPosterUri, setLocalPosterUri] = useState<string | null>(null);
  //navigazione expo router
  const router = useRouter();
  //prendo i params da handleSelectShow
  const params = useLocalSearchParams();

  //prendo l'id di [id].tsx
  //caso in cui id sia un array invece di una stringa
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isModifica = !!id;
  //Se params.id è presente (es. "123"), allora id = "123" → !!id = true
  //Se params.id è undefined o null, allora id = undefined → !!id = false
  //stato episodi modificati
  const [episodiInput, setEpisodiInput] = useState<string[]>([]);

  const tmdbId = Array.isArray(params.tmdbId)
    ? params.tmdbId[0]
    : params.tmdbId;

  const [categorieGeneri, setCategorieGeneri] = useState<string[]>([]);
  const [categoriePiattaforme, setCategoriePiattaforme] = useState<string[]>(
    []
  );
  const posterParam = Array.isArray(params.poster_path)
    ? params.poster_path[0]
    : params.poster_path ?? "";

  console.log("DEBUG → poster_param:", posterParam);

  const imageUrl = (() => {
    if (!posterParam)
      return "https://via.placeholder.com/342x480?text=Nessuna+immagine";

    // Se inizia con 'http' o 'file://' → già valido
    if (posterParam.startsWith("http") || posterParam.startsWith("file://")) {
      return posterParam;
    }

    // Se inizia con '/' → path TMDb valido
    if (posterParam.startsWith("/")) {
      return `https://image.tmdb.org/t/p/w500${posterParam}`;
    }

    // fallback per ogni altro caso
    return "https://via.placeholder.com/342x480?text=Nessuna+immagine";
  })();

  console.log("DEBUG → imageUrl usato nel form:", imageUrl);

  //Copia tutti i campi già esistenti dell’oggetto form + quello che inserisco nella chiamata a funzione
  const aggiornaCampo = (campo: string, valore: string) => {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  };

  //dati della schermata precedente
  const [form, setForm] = useState({
    titolo: params.titolo as string,
    trama: params.overview as string,
    genere: params.genere as string,
    piattaforma: (params.piattaforma as string) || "Netflix",
    stato: (params.stato as string) || "In corso",
    stagioni: "",
    episodi: "",
    poster_path: imageUrl,
    // Se il poster inizia con file:// o http,
    // vuol dire che è già un URL valido → lo usa così com'è
    //Se non inizia con file:// o http, vuol dire che è solo un path parziale da TMDb
    //quindi lo costruisce
    rating: params.rating as string,
    anno: params.anno as string,
  });

  //funzione per copiare l'immagine da locale a permanente
  const copiaImmagineLocale = async (uri: string) => {
    //prendo il nome del file dall'uri
    const filename = uri.split("/").pop();
    //vedo se documentDirectory è disp
    if (!FileSystem.documentDirectory) {
      throw new Error("documentDirectory non disponibile");
    }
    //percorso di dest = cartella documenti + nomefile
    const dest = FileSystem.documentDirectory + filename;
    try {
      //copia il file dall'uri alla posizione permanente
      await FileSystem.copyAsync({ from: uri, to: dest });
      return dest; // percorso permanente
    } catch (e) {
      console.error("Errore copia file", e);
      return uri; // fallback
    }
  };
  //chiedo permesso per accedere alla galleria e scegliere un'immagine
  // immagine --> copiaImmagineLocale
  const pickImage = async () => {
    //permesso
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permesso negato alla galleria");
      return;
    }
    // Apre la galleria immagini e permette la selezione di un file
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, //accetta solo immagini
      quality: 1, //massima qualita
    });

    //se l'utente non ha annullato e ha selezionato almeno un'immagine
    if (
      !pickerResult.canceled &&
      pickerResult.assets &&
      pickerResult.assets.length > 0
    ) {
      // Salva l'uri della prima immagine selezionata
      setLocalPosterUri(pickerResult.assets[0].uri);
    }
  };

  //chiamata asincrona che si aspetta una promise dall'api
  //passiamo anche l'id
  const fetchDettagliSerie = async (id: number) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?language=it-IT`,
        {
          headers: {
            Authorization: TMDB_API_TOKEN,
            accept: "application/json",
          },
        }
      );

      const data = await res.json();

      if (!data || !Array.isArray(data.seasons)) {
        console.warn("Attenzione: dati stagioni non disponibili", data);
        return;
      }

      //data.seasons è un array di stagioni provenienti dalla risposta di TMDb.
      //Ogni s rappresenta una stagione
      const episodiPerStagione = data.seasons
        //elimino la stagione 0
        .filter((s: any) => s.season_number !== 0)
        //invece di avere season_number ho solo stagione:1
        .map((s: any) => ({
          stagione: s.season_number,
          episodi: s.episode_count,
        }));
      //aggiorno numero episodi per stagione
      setStagioniDettagli(episodiPerStagione);
      //aggiorno i capi visibili all'utente
      aggiornaCampo("stagioni", data.number_of_seasons?.toString() || "");
      aggiornaCampo("episodi", data.number_of_episodes?.toString() || "");
    } catch (err) {
      console.error("Errore dettagli serie:", err);
    }
  };
  //Definisco uno stato stagioniDettagli
  //Tipizzato come array di oggetti:  {stagione: number; episodi: number }
  //inizializzato a [{ stagione: 1, episodi: 0 }]
  const [stagioniDettagli, setStagioniDettagli] = useState<
    { stagione: number; episodi: number }[]
  >([{ stagione: 1, episodi: 0 }]);

  //al caricamento della pagine faccio il fetch con l'id da aggiungi.tsx
  useEffect(() => {
    const idNumerico = parseInt(tmdbId as string);
    if (!isNaN(idNumerico)) {
      fetchDettagliSerie(idNumerico);
    }
  }, []);

  //sincronizzo il numero degli episodi dentro i campi di text input
  useEffect(() => {
    //prendo le stagioni --> estraggo solo gli episodi
    //salvo nel set episodi input
    setEpisodiInput(stagioniDettagli.map((s) => s.episodi.toString()));
  }, [stagioniDettagli]);

  //Carica le categorie da AsyncStorage per dropdown e hardcoded
  useEffect(() => {
    const caricaCategorie = async () => {
      try {
        // categorie hardcoded da file
        const hardcoded = categorieHardcoded;

        // categorie salvate in AsyncStorage
        const data = await AsyncStorage.getItem("categorie_dati");
        const parsed = data
          ? JSON.parse(data)
          : { generi: [], piattaforme: [] };

        // unione (eliminando duplicati per nome)
        const tuttiGeneri = Array.from(
          new Set([
            ...parsed.generi.map((g: any) => g.nome),
            ...hardcoded.generi.map((g: any) => g.nome),
          ])
        );

        const tuttePiattaforme = Array.from(
          new Set([
            ...parsed.piattaforme.map((p: any) => p.nome),
            ...hardcoded.piattaforme.map((p: any) => p.nome),
          ])
        );

        // aggiungo il genere della serie se non presente
        if (form.genere && !tuttiGeneri.includes(form.genere)) {
          tuttiGeneri.push(form.genere);
        }

        // idem per piattaforma
        if (form.piattaforma && !tuttePiattaforme.includes(form.piattaforma)) {
          tuttePiattaforme.push(form.piattaforma);
        }

        setCategorieGeneri(tuttiGeneri);
        setCategoriePiattaforme(tuttePiattaforme);
      } catch (err) {
        console.error("Errore nel caricamento categorie:", err);
      }
    };

    caricaCategorie();
  }, []);

  /* SETTING PER LA MODIFICA DA [ID].TSX */

  //se faccio una modifica, ho un form diverso
  useEffect(() => {
    const caricaSerieInModifica = async () => {
      //is modifica = !!id
      if (isModifica) {
        try {
          //prendo prima tutte le serie esistenti dall'asynx
          const esistentiRaw = await AsyncStorage.getItem("serie.json");
          //se esistentiRaw non è vuoto faccio il parsing
          const esistenti = esistentiRaw ? JSON.parse(esistentiRaw) : [];
          //cerco la serie che mi è stata passata da parametro String(params.id) e me la prendo in serie
          const serie = esistenti.find((s: any) => String(s.id) === String(id));

          //se serie esiste:
          if (serie) {
            // aggiorna tutto il form con i dati salvati
            setForm({
              titolo: serie.titolo || "",
              trama: serie.trama || "",
              genere: serie.genere || "",
              piattaforma: serie.piattaforma || "Netflix",
              stato: serie.stato || "In corso",
              stagioni: serie.stagioni || "",
              episodi: serie.episodi || "",
              poster_path: imageUrl,
              rating: serie.rating || "",
              anno: serie.anno || "",
            });
            //ogni stagione con i relativi episodi
            if (serie.stagioniDettagli) {
              setStagioniDettagli(serie.stagioniDettagli);
            }
          }
        } catch (err) {
          console.error("Errore nel caricamento dati per modifica:", err);
        }
      }
    };

    caricaSerieInModifica();
  }, []);

  //salvataggio nel file serie.json in AsyncStorage
  const salvaSerieNelJson = async () => {
    //caso in cui l'utente abbia scelto il poster originale
    let percorsoFinalePoster = form.poster_path;
    if (localPosterUri) {
      //se lo stato è presente copio l'immagine da locale a document directory su file system
      percorsoFinalePoster = await copiaImmagineLocale(localPosterUri);
    }

    try {
      //leggo le serie già salvate se non ce ne sono faccio un array
      const esistentiRaw = await AsyncStorage.getItem("serie.json");
      const esistenti = esistentiRaw ? JSON.parse(esistentiRaw) : [];

      //creazione della nuovaserie
      //copiuo tutti i campi del form (...form)
      const nuovoStato = form.stato === "suggerita" ? "In corso" : form.stato;
      let nuovaSerie = {
        ...form,
        //se è una modifica uso l'id vecchio, altrimenti uno nuovo
        id: isModifica ? id : Date.now().toString(),
        tmdbId: tmdbId ?? null,
        //per salvare quello locale o il remoto
        poster_path: percorsoFinalePoster,
        stagioniDettagli: stagioniDettagli,
        stato: nuovoStato,
      };
      //se era preferita, dopo il salvataggio aggiorno anche i preferiti
      //verifico se esiste già un record con lo stesso id
      const eraPreferita = await isFavorite(nuovaSerie.id);
      let nuovaLista;

      //se è una modifica sostituisco la serie
      if (isModifica) {
        //ogni elemento s è una serie già salvata
        nuovaLista = esistenti.map((s: any) =>
          //se l'id della serie corrisponde a quello che modifico,
          // lo stsotuisco con nuova serie
          String(s.id) === String(id) ? nuovaSerie : s
        );
      } else {
        //non modifico, ma aggiungo nuova serie
        //verifico se almeno una serie con lo stesso titolo non è già presente (some)
        const giàPresente = esistenti.some(
          (s: any) => s.titolo === nuovaSerie.titolo
        );
        //errore provo ad inserire una serie già inserita
        if (giàPresente) {
          alert("Questa serie è già presente.");
          return;
        }
        //se non già presente, mantengo tutte le serie precedenti e aggiungo quella nuova
        nuovaLista = [...esistenti, nuovaSerie];
      }
      //salvo in serie.json la nuova lista sovrascritta
      //set item(chiave, valore)
      await AsyncStorage.setItem("serie.json", JSON.stringify(nuovaLista));

      //sovrascrivo anche la nuova serie preferita
      if (eraPreferita) {
        await saveFavorite(nuovaSerie); // aggiorna i dati salvati
      }

      alert(isModifica ? "Modifica salvata!" : "Serie aggiunta alla libreria!");

      //!params.id = non sono in modifica, ma in aggiunta
      //inizializzazione episodi visti
      if (!params.id || form.stato === "Completata") {
        //salvo lo stato degli episodi totali
        const episodiVistiTotali: {
          //mappa chiave : stagione, valore: episodio
          [stagione: string]: { [episodio: number]: boolean };
        } = {};

        //per ogni stagione in stagioniDettagli:
        for (const stagione of stagioniDettagli) {
          const numeroEpisodi = stagione.episodi;
          //episodi stagione per ogni episodio
          //se vedo un episodio setta a true, altrimenti false
          const episodiStagione: { [episodio: number]: boolean } = {};

          //per tutti gli episodi, se la serie è completata
          //lo stato di visione dell'episodio è true
          for (let i = 0; i < numeroEpisodi; i++) {
            episodiStagione[i] = form.stato === "Completata";
          }
          //aggiungo la chiave = nome stagione
          //s1: { 0: true, 1: true, 2: true },
          episodiVistiTotali[`s${stagione.stagione}`] = episodiStagione;
        }
        //memorizzo in locale gli episodi visti
        const key = `episodiVisti-${nuovaSerie.id}`;
        await AsyncStorage.setItem(key, JSON.stringify(episodiVistiTotali));
      }
      //salvo la nuova categoria inserita se non era già presente
      try {
        const categorieRaw = await AsyncStorage.getItem("categorie_dati");
        const categorie = categorieRaw
          ? JSON.parse(categorieRaw)
          : { generi: [], piattaforme: [] };

        //prendo il genere e la piattaforma della nuova serie
        const nuovoGenere = nuovaSerie.genere?.trim();
        const nuovaPiattaforma = nuovaSerie.piattaforma?.trim();

        let modificato = false;
        //se non ci sono duplicati sui generi pusho
        if (
          nuovoGenere &&
          !categorie.generi.some((g: any) => g.nome === nuovoGenere)
        ) {
          categorie.generi.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            nome: nuovoGenere,
          });
          modificato = true;
        }
        //stessa cosa per la piattaforma
        if (
          nuovaPiattaforma &&
          !categorie.piattaforme.some((p: any) => p.nome === nuovaPiattaforma)
        ) {
          categorie.piattaforme.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            nome: nuovaPiattaforma,
          });
          modificato = true;
        }
        //se è stato modificato sovracsrivo
        if (modificato) {
          await AsyncStorage.setItem(
            "categorie_dati",
            JSON.stringify(categorie)
          );
        }
      } catch (err) {
        console.error("Errore aggiornamento categorie:", err);
      }

      router.replace("/home");
    } catch (err) {
      console.error("Errore nel salvataggio:", err);
      alert("Errore durante il salvataggio");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f2a" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: 12 }}
          >
            <Text style={{ color: "#fff", fontSize: 18 }}>
              <Text> ← Indietro</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Modifica i dettagli</Text>

          <TextInput
            style={styles.input}
            placeholder="Titolo"
            placeholderTextColor="#999"
            value={form.titolo}
            onChangeText={(v) => aggiornaCampo("titolo", v)}
          />
          <TouchableOpacity
            onPress={pickImage}
            style={{ marginVertical: 20, alignItems: "center" }}
          >
            {localPosterUri ? (
              <Image
                key={localPosterUri}
                source={{ uri: localPosterUri }}
                style={{ width: 150, height: 225, borderRadius: 12 }}
              />
            ) : form.poster_path ? (
              <Image
                key={form.poster_path}
                source={{
                  uri:
                    form.poster_path.startsWith("http") ||
                    form.poster_path.startsWith("https")
                      ? `${form.poster_path}?t=${Date.now()}`
                      : form.poster_path,
                }}
                style={{ width: 150, height: 225, borderRadius: 12 }}
                onError={(e) =>
                  console.log(
                    "❌ Errore caricamento immagine finale:",
                    e.nativeEvent
                  )
                }
              />
            ) : (
              <View
                style={{
                  width: 150,
                  height: 225,
                  backgroundColor: "#333",
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff" }}>Nessuna immagine</Text>
              </View>
            )}
            <Text style={{ color: "purple", marginTop: 8 }}>
              Cambia immagine
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.tramaInput}
            placeholder="Inserisci la trama..."
            placeholderTextColor="#888"
            multiline
            textAlignVertical="top"
            numberOfLines={6}
            value={form.trama}
            onChangeText={(v) => aggiornaCampo("trama", v)}
          />

          <Text style={styles.label}>Genere</Text>
          <View style={styles.tagContainer}>
            {categorieGeneri.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => aggiornaCampo("genere", g)}
                style={[styles.tag, form.genere === g && styles.tagSelected]}
              >
                <Text style={styles.tagText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Piattaforma</Text>
          <View style={styles.tagContainer}>
            {categoriePiattaforme.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => aggiornaCampo("piattaforma", p)}
                style={[
                  styles.tag,
                  form.piattaforma === p && styles.tagSelected,
                ]}
              >
                <Text style={styles.tagText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Stato</Text>
          <View style={{ flexDirection: "row", gap: 30, marginBottom: 16 }}>
            {["In corso", "Completata"].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => aggiornaCampo("stato", s)}
                style={styles.radioButtonContainer}
              >
                <View
                  style={[
                    styles.radioOuter,
                    form.stato === s && styles.radioSelectedOuter,
                  ]}
                >
                  {form.stato === s && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Dettaglio stagioni</Text>

          {stagioniDettagli.map((stagione, index) => (
            <View
              key={index}
              style={{
                backgroundColor: "#1a1a2e",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#ccc",
                  fontSize: 14,
                  fontWeight: "500",
                  width: 100,
                }}
              >
                Stagione {stagione.stagione}:
              </Text>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: "#2a2a3f",
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  color: "#fff",
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: "#444",
                }}
                placeholder="Episodi"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={episodiInput[index]}
                onChangeText={(v) => {
                  const nuovaInput = [...episodiInput];
                  nuovaInput[index] = v;
                  setEpisodiInput(nuovaInput);

                  const nuovoValore = parseInt(v);
                  if (!isNaN(nuovoValore)) {
                    const nuovi = [...stagioniDettagli];
                    nuovi[index].episodi = nuovoValore;
                    setStagioniDettagli(nuovi);

                    aggiornaCampo(
                      "episodi",
                      nuovi.reduce((sum, s) => sum + s.episodi, 0).toString()
                    );
                  }
                }}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, { marginTop: 24 }]}
            onPress={salvaSerieNelJson}
          >
            <Text style={styles.buttonText}>Salva</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#333",
    borderRadius: 20,
  },
  tagSelected: {
    backgroundColor: "purple",
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    cursor: "pointer", // opzionale
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioSelectedOuter: {
    borderColor: "purple",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "purple",
  },
  radioLabel: {
    color: "#fff",
    fontSize: 14,
  },

  tagText: {
    color: "#fff",
    fontSize: 13,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 16 : 80, // meno spazio di default
    backgroundColor: "#0f0f2a",
  },
  input: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    padding: 10,
    marginTop: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  button: {
    backgroundColor: "purple",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    marginTop: 32,
  },
  tramaInput: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    marginTop: 16,
    marginBottom: 12,
    minHeight: 120,
    fontSize: 14,
    lineHeight: 20,
  },
});
