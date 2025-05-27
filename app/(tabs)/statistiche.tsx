import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";

const StatisticheScreen = () => {
  const [statistiche, setStatistiche] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const serieData = await AsyncStorage.getItem("serie.json");
        if (serieData !== null) {
          const parsed = JSON.parse(serieData);

          // Numero totale di serie seguite (tutte quelle con stato "Completata", "In corso" o "Pausa")
          const totaliSeguite = parsed.filter(
            (serie: any) =>
              serie.stato === "Completata" ||
              serie.stato === "In corso" ||
              serie.stato === "Pausa"
          ).length;

          // Numero totale completate
          const completate = parsed.filter(
            (serie: any) => serie.stato === "Completata"
          ).length;

          // Numero totale in pausa
          const inPausa = parsed.filter(
            (serie: any) => serie.stato === "Pausa"
          ).length;

          // Calcolo media episodi visti per settimana e per mese
          // Assume che ogni serie abbia un array di date di visione o un numero totale di episodi visti
          // Per semplicità useremo "episodiVisti" come numero totale di episodi visti e "durataSettimane" come numero di settimane seguite
          // Qui si può adattare in base ai dati reali. Ora faccio una media semplice sui dati che trovo
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

          // Distribuzione per genere
          const distribuzioneGenere = parsed.reduce((acc: any, serie: any) => {
            const genere = serie.genere || "Non specificato";
            acc[genere] = (acc[genere] || 0) + 1;
            return acc;
          }, {});

          // Distribuzione per piattaforma
          const distribuzionePiattaforma = parsed.reduce(
            (acc: any, serie: any) => {
              const piattaforma = serie.piattaforma || "Non specificato";
              acc[piattaforma] = (acc[piattaforma] || 0) + 1;
              return acc;
            },
            {}
          );

          // Serie più seguite in termini di episodi visti (top 5)
          const topSerie = [...parsed]
            .filter((s: any) => s.episodiVisti)
            .sort((a: any, b: any) => b.episodiVisti - a.episodiVisti)
            .slice(0, 5);

          // Progressi di visione (% completamento per serie)
          // Assume che ogni serie abbia proprietà episodiVisti e episodiTotali
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
            inPausa,
            mediaSettimana,
            mediaMese,
            distribuzioneGenere,
            distribuzionePiattaforma,
            topSerie,
            progressiSerie,
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
      {/* Numero totale di serie seguite, completate, in pausa */}
      <View style={styles.statSection}>
        <Text style={styles.header}>Schermata analisi</Text>
        <Text style={styles.statText}>
          • Numero totale di serie seguite: {statistiche.totaliSeguite}
        </Text>
        <Text style={styles.statText}>
          • Completate: {statistiche.completate}
        </Text>
        <Text style={styles.statText}>• In pausa: {statistiche.inPausa}</Text>
      </View>

      {/* Numero medio di episodi visti per settimana/mese */}
      <View style={styles.statSection}>
        <Text style={styles.statText}>
          • Numero medio di episodi visti per settimana:{" "}
          {statistiche.mediaSettimana.toFixed(2)}
        </Text>
        <Text style={styles.statText}>
          • Numero medio di episodi visti per mese:{" "}
          {statistiche.mediaMese.toFixed(2)}
        </Text>
      </View>

      {/* Distribuzione per genere */}
      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Genere</Text>
        {statistiche.distribuzioneGenere &&
        Object.keys(statistiche.distribuzioneGenere).length > 0 ? (
          <PieChart
            data={Object.entries(statistiche.distribuzioneGenere).map(
              ([key, value]) => ({
                name: key,
                population: value,
                color: randomColor(),
                legendFontColor: "#7F7F7F",
                legendFontSize: 15,
              })
            )}
            width={300}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        ) : (
          <Text style={styles.statText}>
            Nessun dato disponibile per il genere.
          </Text>
        )}
      </View>

      {/* Distribuzione per piattaforma */}
      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Piattaforma</Text>
        {statistiche.distribuzionePiattaforma &&
        Object.keys(statistiche.distribuzionePiattaforma).length > 0 ? (
          <PieChart
            data={Object.entries(statistiche.distribuzionePiattaforma).map(
              ([key, value]) => ({
                name: key,
                population: value,
                color: randomColor(),
                legendFontColor: "#7F7F7F",
                legendFontSize: 15,
              })
            )}
            width={300}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        ) : (
          <Text style={styles.statText}>
            Nessun dato disponibile per la piattaforma.
          </Text>
        )}
      </View>

      {/* Serie più seguite (top 5 episodi visti) */}
      <View style={styles.statSection}>
        <Text style={styles.title}>Serie più seguite (episodi visti)</Text>
        {statistiche.topSerie.length > 0 ? (
          statistiche.topSerie.map((serie: any, index: number) => (
            <Text key={index} style={styles.statText}>
              {index + 1}. {serie.titolo} - {serie.episodiVisti} episodi visti
            </Text>
          ))
        ) : (
          <Text style={styles.statText}>Nessun dato disponibile.</Text>
        )}
      </View>

      {/* Progressi di visione */}
      <View style={styles.statSection}>
        <Text style={styles.title}>Progressi di visione (%)</Text>
        {statistiche.progressiSerie.length > 0 ? (
          statistiche.progressiSerie.map((serie: any, index: number) => (
            <Text key={index} style={styles.statText}>
              {serie.titolo}: {serie.completamento}%
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
  backgroundColor: "#e26a00",
  backgroundGradientFrom: "#fb8c00",
  backgroundGradientTo: "#ffdd00",
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
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
    marginTop: 20,
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

// Genera un colore casuale per i grafici
const randomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default StatisticheScreen;
