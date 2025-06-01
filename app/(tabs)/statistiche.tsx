import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;


const StatisticheScreen = () => {
  const [statistiche, setStatistiche] = useState<any>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const serieData = await AsyncStorage.getItem("serie.json");

          if (!serieData) {
            setStatistiche({
              totaliSeguite: 0,
              completate: 0,
              inCorso: 0,
              mediaSettimana: 0,
              mediaMese: 0,
              distribuzioneGenere: {},
              distribuzionePiattaforma: {},
              topSerie: [],
            });
            return;
          }

          const parsed = JSON.parse(serieData);

          for (const serie of parsed) {
            const key = `episodiVisti-${serie.id}`;
            const raw = await AsyncStorage.getItem(key);
            const dati = raw ? JSON.parse(raw) : {};
            const totaleVisti = Object.values(dati)
              .map((ep: any) => Object.values(ep).filter(Boolean).length)
              .reduce((sum, val) => sum + val, 0);
            serie.episodiVisti = totaleVisti;
          }

          const serieValide = parsed.filter(
            (serie: any) =>
              typeof serie.titolo === "string" &&
              typeof serie.stato === "string" &&
              serie.stato.toLowerCase() !== "suggerita"
          );

          let totaleEpisodiVisti = 0;

// Trova la data di inizio più vecchia tra tutte le serie
let dataInizioPiuVecchia: Date | null = null;

for (const serie of serieValide) {
  if (serie.dataInizio) {
    const data = new Date(serie.dataInizio);
    if (!dataInizioPiuVecchia || data < dataInizioPiuVecchia) {
      dataInizioPiuVecchia = data;
    }
  }
}

// Se non trovi una data di inizio, metti oggi per evitare divisioni per 0
if (!dataInizioPiuVecchia) {
  dataInizioPiuVecchia = new Date();
}

// Calcola il totale episodi visti su tutte le serie
for (const serie of serieValide) {
  const key = `episodiVisti-${serie.id}`;
  const raw = await AsyncStorage.getItem(key);
  const dati = raw ? JSON.parse(raw) : {};

  let episodiVistiSerie = 0;
  for (const stagione in dati) {
    episodiVistiSerie += Object.values(dati[stagione]).filter(Boolean).length;
  }

  totaleEpisodiVisti += episodiVistiSerie;
}

const adesso = new Date();
const diffMs = adesso.getTime() - dataInizioPiuVecchia.getTime();
// const giorniTotali = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
const settimaneTotali = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));

const mediaSettimana = totaleEpisodiVisti / settimaneTotali;


const dataInizio = dataInizioPiuVecchia || adesso;

const mesiTotali =
  Math.max(
    1,
    (adesso.getFullYear() - dataInizio.getFullYear()) * 12 +
      (adesso.getMonth() - dataInizio.getMonth()) +
      1
  );

const mediaMese = totaleEpisodiVisti / mesiTotali;

          const distribuzioneGenere = serieValide.reduce(
            (acc: any, serie: any) => {
              const genere = serie.genere || "Non specificato";
              acc[genere] = (acc[genere] || 0) + 1;
              return acc;
            },
            {}
          );

          const distribuzionePiattaforma = serieValide.reduce(
            (acc: any, serie: any) => {
              const piattaforma = serie.piattaforma || "Non specificato";
              acc[piattaforma] = (acc[piattaforma] || 0) + 1;
              return acc;
            },
            {}
          );

          const totaliSeguite = serieValide.filter(
            (serie: any) =>
              serie.stato === "Completata" || serie.stato === "In corso"
          ).length;

          const completate = serieValide.filter(
            (serie: any) => serie.stato === "Completata"
          ).length;

          const inCorso = serieValide.filter(
            (serie: any) => serie.stato === "In corso"
          ).length;

          const topSerie = serieValide
            .filter(
              (s: any) =>
                typeof s.episodiVisti === "number" && s.episodiVisti > 0
            )
            .sort((a: any, b: any) => b.episodiVisti - a.episodiVisti)
            .slice(0, 5);

          const progressiSerie = serieValide
            .map((serie: any) => {
              if (serie.episodiVisti && serie.episodiTotali) {
                return {
                  titolo: serie.titolo,
                  completamento: Math.min(
                    100,
                    Math.round((serie.episodiVisti / serie.episodiTotali) * 100)
                  ),
                };
              }
              return null;
            })
            .filter((x: any) => x !== null);

          setStatistiche({
            totaliSeguite,
            completate,
            inCorso,
            mediaSettimana,
            mediaMese,
            distribuzioneGenere,
            distribuzionePiattaforma,
            topSerie,
          });
        } catch (error) {
          console.error(
            "Errore nel recupero delle serie da AsyncStorage",
            error
          );
        }
      };

      fetchData();
    }, [])
  );

  if (!statistiche) {
    return <Text style={styles.loadingText}>Caricamento...</Text>;
  }
  const ChartPlaceholder = ({ label }: { label: string }) => (
    <View style={{ alignItems: "center", marginTop: 20 }}>
      <Ionicons name="pie-chart-outline" size={50} color="#555" />
      <Text style={[styles.statText, { marginTop: 10, textAlign: "center" }]}>
        Nessun dato disponibile
      </Text>
    </View>
  );
  if (!statistiche) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Caricamento statistiche...</Text>
      </View>
    );
  }  
  return (

    <ScrollView style={styles.container}> 

      <Text style={styles.sectionIntro}>
      Ecco un riepilogo delle tue serie
</Text>
      <View style={styles.row}>
  <View style={styles.cardMini}>
    <Text style={styles.cardMiniTitle}>Serie Completate</Text>
    <Text style={styles.cardMiniValue}>{statistiche.completate}</Text>
  </View>
  <View style={styles.cardMini}>
    <Text style={styles.cardMiniTitle}>Serie In Corso</Text>
    <Text style={styles.cardMiniValue}>{statistiche.inCorso}</Text>
  </View>
</View>
<View style={{ height: 1, backgroundColor: "#333", marginVertical: 20 }} />

<View style={styles.statSection}>
  <Text style={styles.title}>Le Tue Serie Preferite</Text>

  {statistiche.topSerie.length > 0 ? (
  statistiche.topSerie.map((serie: any, i: number) => {
    return (
      <TouchableOpacity
        key={serie.id}
        onPress={() => router.push(`/serie/${serie.id}`)}
      >
        <View style={styles.topSerieCard}>  
          <View style={styles.topSerieHeader}>
            <Text style={styles.topSerieIndex}>{i + 1}</Text>
            <Text style={styles.topSerieTitle}>{serie.titolo}</Text>
          </View>
          <Text style={styles.topSerieEpisodes}>
            Episodi visti: {serie.episodiVisti}
          </Text>
        </View>
      </TouchableOpacity>
    );
  })
) : (
  <Text style={styles.statText}>Nessun dato disponibile</Text>
)}

</View>

<View style={{ height: 1, backgroundColor: "#333", marginVertical: 20 }} />

<View style={styles.statSection}>
  <Text style={styles.title}>I Tuoi Generi Preferiti</Text>
  {Object.keys(statistiche.distribuzioneGenere).length > 0 ? (
    <PieChart
      data={getPieData(statistiche.distribuzioneGenere)}
      width={screenWidth - 50}
      height={220}
      chartConfig={chartConfig}
      accessor="population"
      backgroundColor="transparent"
      paddingLeft="15"
    />
  ) : (
    <ChartPlaceholder label="Genere" />
  )}
</View>
<View style={{ height: 1, backgroundColor: "#333", marginVertical: 20 }} />
<View style={styles.statSection}>
  <Text style={styles.title}>Le Tue Piattaforme Preferite</Text>
  {Object.keys(statistiche.distribuzionePiattaforma).length > 0 ? (
    <PieChart
      data={getPieData(statistiche.distribuzionePiattaforma)}
      width={screenWidth - 50}
      height={220}
      chartConfig={chartConfig}
      accessor="population"
      backgroundColor="transparent"
      paddingLeft="15"
    />
  ) : (
    <ChartPlaceholder label="Piattaforma" />
  )}
</View>
<View style={{ height: 1, backgroundColor: "#333", marginVertical: 20 }} />
<View style={styles.mediaSectionCard}>
  <Text style={styles.title}>Quanti Episodi Guardi in Media?</Text>
  <View style={styles.mediaContainer}>
    <View style={styles.mediaCard}>
      <Ionicons name="calendar-outline" size={30} color="#d7bde2" />
      <Text style={styles.mediaLabel}>Media settimanale</Text>
      <Text style={styles.mediaValue}>{statistiche.mediaSettimana.toFixed(2)}</Text>
    </View>
    <View style={styles.mediaCard}>
      <Ionicons name="calendar-number-outline" size={30} color="#d7bde2" />
      <Text style={styles.mediaLabel}>Media mensile</Text>
      <Text style={styles.mediaValue}>{statistiche.mediaMese.toFixed(2)}</Text>
    </View>
  </View>
</View> 
    </ScrollView>
  );
};

const chartConfig = {
  backgroundColor: "#1c1c3c",
  backgroundGradientFrom: "#1c1c3c",
  backgroundGradientTo: "#1c1c3c",
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: () => "#fff",
  style: {
    borderRadius: 16,
  },
};

const styles = StyleSheet.create({
  loadingText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#ccc",
    textAlign: "center",
    marginTop: 30,
  },
  container: {
    flex: 1,
    backgroundColor: "#0f0f2a",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },  
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,  // abbassa tutto sotto il titolo
  },
  statSection: {
    marginVertical: 15,
    backgroundColor: "#1c1c3c",
    padding: 15,
    borderRadius: 10,
  },
  statText: {
    fontSize: 16,
    color: "#ccc",
    marginVertical: 2,
  },
  chartSection: {
    marginVertical: 20,
    alignItems: "center",
  },
  cardMini: {
    flex: 1,
    backgroundColor: "#2a2a4c",
    margin: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cardMiniTitle: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 5,
  },
  cardMiniValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f39ac7",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },  
  sectionIntro: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 10,   // meno padding orizzontale
    width: '100%',            // occuperà tutta la larghezza disponibile
  },

  topSerieCard: {
  backgroundColor: '#2a2a4c',
  padding: 15,
  marginVertical: 8,
  borderRadius: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.4,
  shadowRadius: 5,
  elevation: 5,
},
topSerieHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
},
topSerieIndex: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#f39ac7',
  marginRight: 10,
  width: 30,
  textAlign: 'center',
},
topSerieTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
  flexShrink: 1,
},
topSerieEpisodes: {
  fontSize: 14,
  color: '#ccc',
  marginBottom: 6,
},

mediaContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginVertical: 20,
  paddingHorizontal: 10,
  paddingBottom: 30,
},
mediaCard: {
  flex: 1,
  backgroundColor: "#2a2a4c",
  marginHorizontal: 5,
  paddingVertical: 20,
  borderRadius: 20,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 7,
},
mediaLabel: {
  color: "#d7bde2",
  fontSize: 16,
  fontWeight: "600",
  marginTop: 5,
},
mediaValue: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#fff",
  marginTop: 5,
},
mediaSectionCard: {
  backgroundColor: "rgba(42, 42, 76, 0.5)",
  borderRadius: 20,
  padding: 15,
  marginVertical: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 7,
},


});

const stableColor = (label: string) => {
  const hash = label
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const getPieData = (source: Record<string, number>) => {
  const total = Object.values(source).reduce((sum, val) => sum + val, 0);
  const labels = Object.keys(source);
  return labels.map((label, i) => ({
    name: label.length > 20 ? label.slice(0, 17) + "..." : label,
    population: source[label],
    color: colorPalette[i % colorPalette.length],
    legendFontColor: "#ccc",
    legendFontSize: 12,
  }));
};

const colorPalette = [
  "#f39ac7", // rosa acceso (accanto al testo rosa)
  "#9b59b6", // viola
  "#2980b9", // blu
  "#8e44ad", // viola scuro
  "#34495e", // blu grigio scuro
  "#c39bd3", // lilla chiaro
  "#d7bde2", // lilla pastello
];


export default StatisticheScreen;
