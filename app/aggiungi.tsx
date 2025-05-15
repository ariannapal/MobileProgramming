import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function AggiungiModificaScreen() {
  const [categorieGeneri, setCategorieGeneri] = useState<string[]>([]);
  const [categoriePiattaforme, setCategoriePiattaforme] = useState<string[]>(
    []
  );

  const [titolo, setTitolo] = useState("");
  const [risultati, setRisultati] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any | null>(null);
  const [stagioniDettagli, setStagioniDettagli] = useState<any[]>([]);

  const [form, setForm] = useState({
    titolo: "",
    trama: "",
    genere: "",
    piattaforma: "",
    stato: "In corso",
    stagioni: "",
    episodi: "",
    poster_path: "",
    rating: "",
    anno: "",
  });

  useEffect(() => {
    const caricaCategorie = async () => {
      try {
        const data = await AsyncStorage.getItem("categorie_dati");
        if (data) {
          const parsed = JSON.parse(data);
          setCategorieGeneri(parsed.generi.map((g: any) => g.nome));
          setCategoriePiattaforme(parsed.piattaforme.map((p: any) => p.nome));
        }
      } catch (err) {
        console.error("Errore nel caricamento categorie:", err);
      }
    };

    caricaCategorie();
  }, []);

  const router = useRouter();

  const fetchTVShows = async () => {
    setLoading(true);
    setSelectedShow(null);

    try {
      const [res, genresRes] = await Promise.all([
        fetch(
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
        ),
        fetch(`https://api.themoviedb.org/3/genre/tv/list?language=it-IT`, {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
            accept: "application/json",
          },
        }),
      ]);

      if (!res.ok || !genresRes.ok) {
        throw new Error("Errore nella fetch TMDb");
      }

      const data = await res.json();
      const genresData = await genresRes.json();

      const genresMap: Record<number, string> = {};

      if (Array.isArray(genresData.genres)) {
        genresData.genres.forEach((g: { id: number; name: string }) => {
          genresMap[g.id] = g.name;
        });
      } else {
        console.warn("⚠️ genresData.genres non trovato:", genresData);
      }

      const resultsWithGenre = (data.results || []).map((item: any) => ({
        ...item,
        genere_nome:
          item.genre_ids && item.genre_ids.length > 0
            ? genresMap[item.genre_ids[0]]
            : "",
      }));

      setRisultati(resultsWithGenre);
    } catch (err) {
      console.error("Errore nella fetch TMDb:", err);
    }

    setLoading(false);
  };

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

    if (!res.ok) throw new Error("Errore nel recupero dettagli serie");

    const data = await res.json();

    // 👇 Mappa ogni stagione con numero e conteggio episodi
    const episodiPerStagione = data.seasons.map((s: any) => ({
      stagione: s.season_number,
      episodi: s.episode_count,
    }));

    return {
      numeroStagioni: data.number_of_seasons,
      numeroEpisodiTotale: data.number_of_episodes,
      episodiPerStagione, // 👈 qui hai l'elenco dettagliato
    };
  } catch (err) {
    console.error("Errore dettagli serie:", err);
    return null;
  }
};
const handleSelectShow = async (item: any) => {
  const genereAuto = item.genere_nome || "";

  if (genereAuto && !categorieGeneri.includes(genereAuto)) {
    setCategorieGeneri((prev) => [...prev, genereAuto]);
  }

  const dettagli = await fetchDettagliSerie(item.id);

  const numStagioni = dettagli?.numeroStagioni?.toString() || "";
  const numEpisodi = dettagli?.numeroEpisodiTotale?.toString() || "";
  const episodiPerStagione = dettagli?.episodiPerStagione || [];

  setSelectedShow(item);
  setForm({
    titolo: item.name,
    trama: item.overview,
    genere: genereAuto,
    piattaforma: "",
    stato: "In corso",
    stagioni: numStagioni,
    episodi: numEpisodi,
    poster_path: item.poster_path,
    rating: item.vote_average?.toFixed(1) || "",
    anno: item.first_air_date?.substring(0, 4) || "",
  });

  // Salva i dettagli delle stagioni per la visualizzazione
  setStagioniDettagli(episodiPerStagione);
};


  const aggiornaCampo = (campo: string, valore: string) => {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  };
  const salvaSerieNelJson = async () => {
    try {
      const nuovaSerie = { id: Date.now().toString(), ...form,   stagioniDettagli: stagioniDettagli, };
      // 🔄 aggiorna le categorie se mancano
      const categorieRaw = await AsyncStorage.getItem("categorie_dati");
      let categorie = categorieRaw
        ? JSON.parse(categorieRaw)
        : { generi: [], piattaforme: [] };

      if (
        nuovaSerie.genere &&
        !categorie.generi.some((g: any) => g.nome === nuovaSerie.genere)
      ) {
        categorie.generi.push({
          id: Date.now().toString() + "_gen",
          nome: nuovaSerie.genere,
        });
      }

      if (
        nuovaSerie.piattaforma &&
        !categorie.piattaforme.some(
          (p: any) => p.nome === nuovaSerie.piattaforma
        )
      ) {
        categorie.piattaforme.push({
          id: Date.now().toString() + "_plat",
          nome: nuovaSerie.piattaforma,
        });
      }
      await AsyncStorage.setItem("categorie_dati", JSON.stringify(categorie));
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
      style={{ flex: 1, backgroundColor: "#0f0f2a" }} 
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
                style={styles.searchinput}
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
    {categorieGeneri.map((g) => (
      <TouchableOpacity
        key={g}
        onPress={() => aggiornaCampo("genere", g)}
        style={[styles.tag, form.genere === g && styles.tagSelected]}
      >
        <Text style={styles.tagText}>{g}</Text>
      </TouchableOpacity>
    ))}

    <Text style={styles.label}>Piattaforma</Text>
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

       <Text style={styles.label}>Dettaglio stagioni</Text>
    {stagioniDettagli.map((stagione, index) => (
      <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
        <Text style={{ color: "#fff", width: 110 }}>
          Stagione {stagione.stagione}:
        </Text>
        <TextInput
          style={[styles.input, { flex: 1, height: 40, marginLeft: 8}]}
          placeholder="Episodi"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={stagione.episodi.toString()}
          onChangeText={(v) => {
            const nuovi = [...stagioniDettagli];
            nuovi[index].episodi = parseInt(v) || 0;
            setStagioniDettagli(nuovi);

            // aggiorna anche il form con il nuovo totale episodi e stagioni
            aggiornaCampo("episodi", nuovi.reduce((sum, s) => sum + s.episodi, 0).toString());
            aggiornaCampo("stagioni", nuovi.length.toString());
          }}
        />
      </View>
    ))}

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
    marginTop: 16,    
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
},
searchinput: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    padding: 10,
    marginTop: 16,    
    borderRadius: 8,
    marginBottom: 42, 
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

