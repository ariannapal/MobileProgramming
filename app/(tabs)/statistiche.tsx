import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from "@react-native-async-storage/async-storage"; 

const StatisticheScreen = () => {
  const [statistiche, setStatistiche] = useState<any>(null);

  useEffect(() => {
    // Funzione per caricare le statistiche da AsyncStorage
    const fetchData = async () => {
      try {
        const serieData = await AsyncStorage.getItem("serie.json");
        if (serieData !== null) {
          const parsed = JSON.parse(serieData);

          // Calcola il totale delle serie
          const totaleSerie = parsed.length;

          // Calcola il totale delle serie completate
          const completate = parsed.filter((serie: any) => serie.stato === "Completata").length;

          // Calcola il totale delle serie in corso
          const inCorso = parsed.filter((serie: any) => serie.stato === "In corso").length;

          // Calcola la distribuzione per Genere
          const distribuzioneGenere = parsed.reduce((acc: any, serie: any) => {
            const genere = serie.genere;
            if (genere) {
              acc[genere] = (acc[genere] || 0) + 1;
            }
            return acc;
          }, {});

          // Calcola la distribuzione per Piattaforma
          const distribuzionePiattaforma = parsed.reduce((acc: any, serie: any) => {
            const piattaforma = serie.piattaforma;
            if (piattaforma) {
              acc[piattaforma] = (acc[piattaforma] || 0) + 1;
            }
            return acc;
          }, {});

          // Imposta i dati delle statistiche
          setStatistiche({
            totaleSerie: {
              seguita: totaleSerie,
              completato: completate,
              inCorso: inCorso,
            },
            distribuzioneGenere,
            distribuzionePiattaforma,
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

  // Funzione di debug per controllare i dati
  console.log("Distribuzione Genere:", statistiche.distribuzioneGenere);
  console.log("Distribuzione Piattaforma:", statistiche.distribuzionePiattaforma);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statSection}>
        <Text style={styles.title}>Totale Serie</Text>
        <Text style={styles.statText}>Seguite: {statistiche.totaleSerie.seguita}</Text>
        <Text style={styles.statText}>Completate: {statistiche.totaleSerie.completato}</Text>
        <Text style={styles.statText}>In Corso: {statistiche.totaleSerie.inCorso}</Text>
      </View>

      {/* Distribuzione per Genere */}
      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Genere</Text>
        {statistiche.distribuzioneGenere && Object.keys(statistiche.distribuzioneGenere).length > 0 ? (
          <PieChart
            data={Object.entries(statistiche.distribuzioneGenere).map(([key, value]) => ({
              name: key,
              population: value,
              color: randomColor(),
              legendFontColor: "#7F7F7F",
              legendFontSize: 15,
            }))}
            width={300}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        ) : (
          <Text style={styles.statText}>Nessun dato disponibile per il genere.</Text>
        )}
      </View>

      {/* Distribuzione per Piattaforma */}
      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Piattaforma</Text>
        {statistiche.distribuzionePiattaforma && Object.keys(statistiche.distribuzionePiattaforma).length > 0 ? (
          <PieChart
            data={Object.entries(statistiche.distribuzionePiattaforma).map(([key, value]) => ({
              name: key,
              population: value,
              color: randomColor(),
              legendFontColor: "#7F7F7F",
              legendFontSize: 15,
            }))}
            width={300}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        ) : (
          <Text style={styles.statText}>Nessun dato disponibile per la piattaforma.</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#0f0f2a",
    padding: 20,
  },
  loadingText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
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
  },
  chartSection: {
    marginVertical: 20,
    alignItems: "center",
    
  },
});

// Funzione per generare colori casuali per il grafico
const randomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default StatisticheScreen;
