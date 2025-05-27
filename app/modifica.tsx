import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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

export default function ModificaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [categorieGeneri, setCategorieGeneri] = useState<string[]>([]);
  const [categoriePiattaforme, setCategoriePiattaforme] = useState<string[]>(
    []
  );

  const [form, setForm] = useState({
    titolo: params.titolo as string,
    trama: params.overview as string,
    genere: params.genere as string,
    piattaforma: "",
    stato: "In corso",
    stagioni: "",
    episodi: "",
    poster_path: params.poster_path as string,
    rating: params.rating as string,
    anno: params.anno as string,
  });
  const fetchDettagliSerie = async (id: number) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?language=it-IT`,
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
            accept: "application/json",
          },
        }
      );

      const data = await res.json();
      const episodiPerStagione = data.seasons.map((s: any) => ({
        stagione: s.season_number,
        episodi: s.episode_count,
      }));

      setStagioniDettagli(episodiPerStagione);
      aggiornaCampo("stagioni", data.number_of_seasons?.toString() || "");
      aggiornaCampo("episodi", data.number_of_episodes?.toString() || "");
    } catch (err) {
      console.error("Errore dettagli serie:", err);
    }
  };

  const [stagioniDettagli, setStagioniDettagli] = useState<
    { stagione: number; episodi: number }[]
  >([{ stagione: 1, episodi: 0 }]);
  useEffect(() => {
    if (params.id) {
      fetchDettagliSerie(parseInt(params.id as string));
    }
  }, []);
  useEffect(() => {
    const caricaCategorie = async () => {
      try {
        const data = await AsyncStorage.getItem("categorie_dati");
        if (data) {
          const parsed = JSON.parse(data);
          const generi = parsed.generi.map((g: any) => g.nome);
          const piattaforme = parsed.piattaforme.map((p: any) => p.nome);

          // ✅ se il genere del form non è presente, lo aggiungo temporaneamente
          if (form.genere && !generi.includes(form.genere)) {
            generi.push(form.genere);
          }
          if (form.piattaforma && !piattaforme.includes(form.piattaforma)) {
            piattaforme.push(form.piattaforma);
          }

          setCategorieGeneri(generi);
          setCategoriePiattaforme(piattaforme);
        }
      } catch (err) {
        console.error("Errore nel caricamento categorie:", err);
      }
    };

    caricaCategorie();
  }, []);

  const aggiornaCampo = (campo: string, valore: string) => {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  };

  const salvaSerieNelJson = async () => {
    try {
      const nuovaSerie = {
        id: Date.now().toString(),
        ...form,
        stagioniDettagli: stagioniDettagli,
      };
      // Salva categorie nuove (genere e piattaforma)
      const categorieRaw = await AsyncStorage.getItem("categorie_dati");
      let categorie = categorieRaw
        ? JSON.parse(categorieRaw)
        : { generi: [], piattaforme: [] };

      if (
        form.genere &&
        !categorie.generi.some((g: any) => g.nome === form.genere)
      ) {
        categorie.generi.push({
          id: Date.now().toString() + "_gen",
          nome: form.genere,
        });
      }

      if (
        form.piattaforma &&
        !categorie.piattaforme.some((p: any) => p.nome === form.piattaforma)
      ) {
        categorie.piattaforme.push({
          id: Date.now().toString() + "_plat",
          nome: form.piattaforma,
        });
      }

      await AsyncStorage.setItem("categorie_dati", JSON.stringify(categorie));

      const esistenti = await AsyncStorage.getItem("serie.json");
      const parsed = esistenti ? JSON.parse(esistenti) : [];

      const giàPresente = parsed.some(
        (s: any) => s.titolo === nuovaSerie.titolo
      );

      if (giàPresente) {
        alert("Questa serie è già presente.");
        return;
      }

      parsed.push(nuovaSerie);
      await AsyncStorage.setItem("serie.json", JSON.stringify(parsed));

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
                value={stagione.episodi.toString()}
                onChangeText={(v) => {
                  const nuovi = [...stagioniDettagli];
                  nuovi[index].episodi = parseInt(v) || 0;
                  setStagioniDettagli(nuovi);

                  aggiornaCampo(
                    "episodi",
                    nuovi.reduce((sum, s) => sum + s.episodi, 0).toString()
                  );
                  aggiornaCampo("stagioni", nuovi.length.toString());
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
