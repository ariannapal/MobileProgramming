import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
// Importa il file JSON locale
import categorieJson from "../../assets/data/statistiche.json";

const StatisticheScreen = () => {
  const [statistiche, setStatistiche] = useState<any>(null);

  useEffect(() => {
    // Imposta i dati direttamente dal file JSON
    setStatistiche(categorieJson);
  }, []);

  if (!statistiche) {
    return <Text style={styles.loadingText}>Caricamento...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statSection}>
        <Text style={styles.title}>Totale Serie</Text>
        <Text style={styles.statText}>Seguite: {statistiche.totaleSerie.seguito}</Text>
        <Text style={styles.statText}>Completate: {statistiche.totaleSerie.completato}</Text>
        <Text style={styles.statText}>In Pausa: {statistiche.totaleSerie.inPausa}</Text>
      </View>

      <View style={styles.statSection}>
        <Text style={styles.title}>Episodi Visti</Text>
        <Text style={styles.statText}>Media settimanale: {statistiche.episodiVisti.mediaSettimanale}</Text>
        <Text style={styles.statText}>Media mensile: {statistiche.episodiVisti.mediaMensile}</Text>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Genere</Text>
        <PieChart
          data={Object.entries(statistiche.distribuzioneGenere).map(([key, value]) => ({
            name: key,
            population: value,
            color: randomColor(),
            legendFontColor: "#7F7F7F",
            legendFontSize: 15
          }))}
          width={300}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Piattaforma</Text>
        <PieChart
          data={Object.entries(statistiche.distribuzionePiattaforma).map(([key, value]) => ({
            name: key,
            population: value,
            color: randomColor(),
            legendFontColor: "#7F7F7F",
            legendFontSize: 15
          }))}
          width={300}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>

      <View style={styles.statSection}>
        <Text style={styles.title}>Serie più Seguite</Text>
        {statistiche.seriePiùSeguite.map((serie: any, index: number) => (
          <Text key={index} style={styles.statText}>
            {serie.titolo} - Episodi Visti: {serie.episodiVisti}
          </Text>
        ))}
      </View>

      <View style={styles.statSection}>
        <Text style={styles.title}>Progressi di Visione</Text>
        {statistiche.progressiVisione.map((serie: any, index: number) => (
          <Text key={index} style={styles.statText}>
            {serie.titolo} - {serie.percentualeCompletamento}% completato
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

// Funzione per generare colori casuali per il grafico
const randomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const chartConfig = {
  backgroundColor: "#e26a00",
  backgroundGradientFrom: "#fb8c00",
  backgroundGradientTo: "#ffdd00",
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f2a", // Dark blue/purple
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
    marginVertical: 25,
    alignItems: "center",
  },
});

export default StatisticheScreen;
