import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const StatisticheScreen = () => {
  const [statistiche, setStatistiche] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const serieData = await AsyncStorage.getItem("serie.json");
        if (serieData !== null) {
          const parsed = JSON.parse(serieData);

          const totaliSeguite = parsed.filter(
            (serie: any) =>
              serie.stato === "Completata" || serie.stato === "In corso"
          ).length;

          const completate = parsed.filter(
            (serie: any) => serie.stato === "Completata"
          ).length;

          const inCorso = parsed.filter(
            (serie: any) => serie.stato === "In corso"
          ).length;

          let totaleEpisodiVisti = 0;
          let settimaneTotali = 0;
          parsed.forEach((serie: any) => {
            if (serie.episodiVisti && serie.durataSettimane) {
              totaleEpisodiVisti += serie.episodiVisti;
              settimaneTotali += serie.durataSettimane;
            }
          });

          const mediaSettimana =
            settimaneTotali > 0 ? totaleEpisodiVisti / settimaneTotali : 0;
          const mediaMese = mediaSettimana * 4;

          const distribuzioneGenere = parsed.reduce((acc: any, serie: any) => {
            const genere = serie.genere || "Non specificato";
            acc[genere] = (acc[genere] || 0) + 1;
            return acc;
          }, {});

          const distribuzionePiattaforma = parsed.reduce(
            (acc: any, serie: any) => {
              const piattaforma = serie.piattaforma || "Non specificato";
              acc[piattaforma] = (acc[piattaforma] || 0) + 1;
              return acc;
            },
            {}
          );
          // Carica episodiVisti da ogni serie
          for (const serie of parsed) {
            const key = `episodiVisti-${serie.id}`;
            const raw = await AsyncStorage.getItem(key);
            const dati = raw ? JSON.parse(raw) : {};
            const totaleVisti = Object.values(dati)
              .map((ep: any) => Object.values(ep).filter(Boolean).length)
              .reduce((sum, val) => sum + val, 0);

            serie.episodiVisti = totaleVisti;
          }

          const topSerie = parsed
            .filter(
              (s: any) =>
                typeof s.episodiVisti === "number" && s.episodiVisti > 0
            )
            .sort((a: any, b: any) => b.episodiVisti - a.episodiVisti)
            .slice(0, 5);

          const progressiSerie = parsed
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
        }
      } catch (error) {
        console.error("Errore nel recupero delle serie da AsyncStorage", error);
      }
    };

    fetchData();
  }, []);

  if (!statistiche) {
    return <Text style={styles.loadingText}>Caricamento...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statSection}>
        <Text style={styles.header}>Schermata analisi</Text>
        <Text style={styles.statText}>
          Serie seguite: {statistiche.totaliSeguite}
        </Text>
        <Text style={styles.statText}>
          Completate: {statistiche.completate}
        </Text>
        <Text style={styles.statText}>In Corso: {statistiche.inCorso}</Text>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Genere</Text>
        <PieChart
          data={getPieData(statistiche.distribuzioneGenere)}
          width={screenWidth - 10}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="10"
        />
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Piattaforma</Text>
        <PieChart
          data={getPieData(statistiche.distribuzionePiattaforma)}
          width={screenWidth - 10}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="10"
        />
      </View>

      <View style={styles.statSection}>
        <Text style={styles.title}>Top 5 serie (episodi visti)</Text>
        {statistiche.topSerie.length > 0 ? (
          statistiche.topSerie.map((serie: any, i: number) => (
            <Text key={i} style={styles.statText}>
              {i + 1}. {serie.titolo} — {serie.episodiVisti} episodi
            </Text>
          ))
        ) : (
          <Text style={styles.statText}>Nessun dato disponibile.</Text>
        )}
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
