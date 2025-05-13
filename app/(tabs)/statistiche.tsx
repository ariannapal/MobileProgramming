import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";

type Serie = {
  id?: string;
  titolo: string;
  stato?: string;
  genere?: string;
  piattaforma?: string;
  episodiVisti?: number;
  totaleEpisodi?: number;
};

export default function StatisticheScreen() {
  const [serie, setSerie] = useState<Serie[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const json = await AsyncStorage.getItem("serie.json");
      const data = json ? JSON.parse(json) : [];
      setSerie(data);
    };

    loadData();
  }, []);

  // Calcoli statistici
  const totale = {
    seguito: serie.filter((s) => s.stato?.toLowerCase() === "in corso").length,
    completato: serie.filter((s) => s.stato?.toLowerCase() === "completata").length,
    inPausa: serie.filter((s) => s.stato?.toLowerCase() === "in pausa").length,
  };

  const distribuzioneGenere: Record<string, number> = {};
  const distribuzionePiattaforma: Record<string, number> = {};

  serie.forEach((s) => {
    if (s.genere) distribuzioneGenere[s.genere] = (distribuzioneGenere[s.genere] || 0) + 1;
    if (s.piattaforma) distribuzionePiattaforma[s.piattaforma] = (distribuzionePiattaforma[s.piattaforma] || 0) + 1;
  });

  const chartData = (data: Record<string, number>) =>
    Object.entries(data).map(([key, value]) => ({
      name: key,
      population: value,
      color: randomColor(),
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statSection}>
        <Text style={styles.title}>Totale Serie</Text>
        <Text style={styles.statText}>Seguite: {totale.seguito}</Text>
        <Text style={styles.statText}>Completate: {totale.completato}</Text>
        <Text style={styles.statText}>In Pausa: {totale.inPausa}</Text>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.title}>Distribuzione per Genere</Text>
        <PieChart
          data={chartData(distribuzioneGenere)}
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
          data={chartData(distribuzionePiattaforma)}
          width={300}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>
    </ScrollView>
  );
}

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
    borderRadius: 16,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f2a",
    padding: 20,
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

