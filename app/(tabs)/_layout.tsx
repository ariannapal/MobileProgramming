/*Definisce la navigazione principale, cioè quella che permette di passare 
tra le Categorie, Statistiche, ecc.
Imposto gli stili comuni (navbar scura, colori icone, ecc.).
*/

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f0f2a" }, // viola tab bar
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#0f0f2a", // navbar scura diversa
          borderTopColor: "#222",
        },
        tabBarActiveTintColor: "purple",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categorie"
        options={{
          title: "Categorie",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistiche"
        options={{
          title: "Statistiche",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preferiti"
        options={{
          title: "Preferiti",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
