import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const generiDisponibili = ["Fantascienza", "Commedia", "Dramma", "Thriller"];
const piattaforme = ["Netflix", "Disney+", "Amazon Prime", "HBO"];

export default function AggiungiModificaScreen() {
  const [titolo, setTitolo] = useState("");
  const [risultati, setRisultati] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any | null>(null);

  const [form, setForm] = useState({
    titolo: "",
    trama: "",
    genere: "",
    piattaforma: "",
    stato: "In corso",
    stagioni: "",
    episodi: "",
    poster_path: "", // AGGIUNTO!
  });
  const router = useRouter();

  const fetchTVShows = async () => {
    setLoading(true);
    setSelectedShow(null);
    const res = await fetch(
      `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(
        titolo
      )}&language=it-IT`,
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
          accept: "application/json",
        },
      }
    );
    const data = await res.json();
    setRisultati(data.results || []);
    setLoading(false);
  };

  const handleSelectShow = (item: any) => {
    setSelectedShow(item);
    setForm({
      titolo: item.name,
      trama: item.overview,
      genere: "",
      piattaforma: "",
      stato: "In corso",
      stagioni: "",
      episodi: "",
      poster_path: item.poster_path, // 👈 AGGIUNTO!
    });
  };

  const aggiornaCampo = (campo: string, valore: string) => {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  };
  const salvaSerieNelJson = async () => {
    try {
      const nuovaSerie = { ...form };

      const esistenti = await AsyncStorage.getItem("serie.json");
      const parsed = esistenti ? JSON.parse(esistenti) : [];

      parsed.push(nuovaSerie);

      await AsyncStorage.setItem("serie.json", JSON.stringify(parsed));

      setSelectedShow(null);
      console.log("Salvo:", nuovaSerie);

      // Redirect alla home
      router.replace("/home");
    } catch (err) {
      console.error("Errore nel salvataggio:", err);
      alert("Errore durante il salvataggio");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#0f0f2a" }} // 👈 aggiunto qui
      keyboardVerticalOffset={80} // eventualmente regola in base alla tua tab bar
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={{ flex: 1 }} // 👈 questo aiuta
      >
        <View style={styles.container}>
          {!selectedShow && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Cerca una serie"
                placeholderTextColor="#999"
                value={titolo}
                onChangeText={setTitolo}
              />
              <TouchableOpacity style={styles.button} onPress={fetchTVShows}>
                <Text style={styles.buttonText}>Cerca</Text>
              </TouchableOpacity>
              {loading && <ActivityIndicator color="#fff" size="large" />}
              {risultati.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectShow(item)}
                  style={styles.card}
                >
                  {item.poster_path && (
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w92/${item.poster_path}`,
                      }}
                      style={styles.thumbnail}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardText} numberOfLines={2}>
                      {item.overview}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {selectedShow && (
            <>
              <Text style={styles.sectionTitle}>Modifica i dettagli</Text>
              <TextInput
                style={styles.input}
                placeholder="Titolo"
                placeholderTextColor="#999"
                value={form.titolo}
                onChangeText={(v) => aggiornaCampo("titolo", v)}
              />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Trama"
                placeholderTextColor="#999"
                multiline
                value={form.trama}
                onChangeText={(v) => aggiornaCampo("trama", v)}
              />
              <Text style={styles.label}>Genere</Text>
              {generiDisponibili.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => aggiornaCampo("genere", g)}
                  style={[styles.tag, form.genere === g && styles.tagSelected]}
                >
                  <Text style={styles.tagText}>{g}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.label}>Piattaforma</Text>
              {piattaforme.map((p) => (
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

              <Text style={styles.label}>Stato</Text>
              <View style={{ flexDirection: "row", gap: 20, marginBottom: 10 }}>
                {["In corso", "Completata"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => aggiornaCampo("stato", s)}
                  >
                    <Text style={{ color: "#fff" }}>
                      {form.stato === s ? "🔘" : "⚪"} {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Stagioni"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.stagioni}
                onChangeText={(v) => aggiornaCampo("stagioni", v)}
              />
              <TextInput
                style={styles.input}
                placeholder="Episodi"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.episodi}
                onChangeText={(v) => aggiornaCampo("episodi", v)}
              />

              <TouchableOpacity
                style={[styles.button, { marginTop: 16 }]}
                onPress={salvaSerieNelJson}
              >
                <Text style={styles.buttonText}>Salva</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f0f2a",
    padding: 16,
    flexGrow: 1,
  },
  input: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    padding: 10,
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#1f1f3b",
    flexDirection: "row",
    gap: 10,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  cardTitle: {
    fontWeight: "bold",
    color: "#fff",
  },
  cardText: {
    fontSize: 12,
    color: "#ccc",
  },
  thumbnail: {
    width: 60,
    height: 90,
    borderRadius: 6,
    marginRight: 10,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#333",
    borderRadius: 20,
    marginBottom: 8,
    marginRight: 8,
    alignSelf: "flex-start",
  },
  tagSelected: {
    backgroundColor: "purple",
  },
  tagText: {
    color: "#fff",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100, // 👈 aiuta a mostrare il bottone in fondo
    backgroundColor: "#0f0f2a",
  },
});


