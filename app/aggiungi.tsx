import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import HeaderSearchBar from "./components/headerSearchBar";

export default function AggiungiModificaScreen() {
  const router = useRouter();
  const [titolo, setTitolo] = useState("");
  const [risultati, setRisultati] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTVShows = async () => {
    if (titolo.length < 2) return setRisultati([]);
    setLoading(true);
    try {
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

      const genresRes = await fetch(
        `https://api.themoviedb.org/3/genre/tv/list?language=it-IT`,
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
            accept: "application/json",
          },
        }
      );

      const data = await res.json();
      const genresData = await genresRes.json();
      const genresMap: Record<number, string> = {};
      genresData.genres.forEach((g: any) => (genresMap[g.id] = g.name));

      const resultsWithGenre = data.results
        .filter((item: any) => item.poster_path)
        .map((item: any) => ({
          ...item,
          genere_nome: item.genre_ids?.length
            ? genresMap[item.genre_ids[0]]
            : "",
        }));

      setRisultati(resultsWithGenre);
    } catch (err) {
      console.error("Errore TMDb:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTVShows();
  }, [titolo]);

  const handleSelectShow = async (item: any) => {
    router.push({
      pathname: "/modifica",
      params: {
        tmdbId: item.id.toString(), // ✅ corretto
        titolo: item.name,
        poster_path: item.poster_path,
        overview: item.overview,
        rating: item.vote_average?.toFixed(1) || "",
        anno: item.first_air_date?.substring(0, 4) || "",
        genere: item.genere_nome || "",
        piattaforma: "", // opzionale
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f2a" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
      >
        <FlatList
          data={risultati}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === "ios" ? 16 : 80,
          }}
          ListHeaderComponent={
            <>
              <HeaderSearchBar value={titolo ?? ""} onChange={setTitolo} />
              {loading && (
                <ActivityIndicator
                  color="#fff"
                  size="large"
                  style={{ marginTop: 20 }}
                />
              )}
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSelectShow(item)}
              style={styles.cardGridItem}
            >
              <View style={styles.posterWrapper}>
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w185/${item.poster_path}`,
                  }}
                  style={styles.posterImage}
                />
                <View style={styles.ratingBadge}>
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {item.vote_average?.toFixed(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.posterTitle} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardGridItem: {
    width: 110,
    marginBottom: 20,
    alignItems: "center",
  },
  posterWrapper: {
    position: "relative",
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
  },
  posterImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  ratingBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  posterTitle: {
    color: "#fff",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
});
