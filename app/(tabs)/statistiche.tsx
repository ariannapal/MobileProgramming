import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const StatisticheScreen = () => {
  const [statistiche, setStatistiche] = useState<any>(null);

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
const giorniTotali = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statSection}>
        <Text style={styles.header}>Report delle Tue Serie</Text>
        <Text style={styles.statText}>
          Serie seguite: {statistiche.totaliSeguite}
        </Text>
        <Text style={styles.statText}>
          Completate: {statistiche.completate}
        </Text>
        <Text style={styles.statText}>In Corso: {statistiche.inCorso}</Text>
      </View>
      <View style={styles.statSection}>
        <Text style={styles.title}>Top 5 serie</Text>
        {statistiche.topSerie.length > 0 ? (
          statistiche.topSerie.map((serie: any, i: number) => (
            <Text key={i} style={styles.statText}>
              {i + 1}. {serie.titolo} — {serie.episodiVisti} episodi
            </Text>
          ))
        ) : (
          <Text style={styles.statText}>Nessun dato disponibile</Text>
        )}
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Genere</Text>

        {Object.keys(statistiche.distribuzioneGenere).length > 0 ? (
          <PieChart
            data={getPieData(statistiche.distribuzioneGenere)}
            width={screenWidth - 10}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
          />
        ) : (
          <ChartPlaceholder label="Genere" />
        )}
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Piattaforma</Text>
        {Object.keys(statistiche.distribuzionePiattaforma).length > 0 ? (
          <PieChart
            data={getPieData(statistiche.distribuzionePiattaforma)}
            width={screenWidth - 10}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
          />
        ) : (
          <ChartPlaceholder label="Piattaforma" />
        )}
      </View>

      <View style={styles.statSection}>
  <Text style={styles.title}>Media Episodi</Text>
  <Text style={styles.statText}>
    Media episodi visti a settimana: {statistiche.mediaSettimana.toFixed(2)}
  </Text>
  <Text style={styles.statText}>
    Media episodi visti al mese (stimata): {statistiche.mediaMese.toFixed(2)}
  </Text>
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
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
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
  return Object.entries(source).map(([label, count]) => ({
    name: label.length > 20 ? label.slice(0, 17) + "..." : label,

    population: count,
    color: stableColor(label),
    legendFontColor: "#ccc",
    legendFontSize: 12,
  }));
};

export default StatisticheScreen;
