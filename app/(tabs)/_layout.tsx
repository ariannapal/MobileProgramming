import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerStyle: {
            backgroundColor: "#6a11cb", // Colore di sfondo dell'header
          },
          headerTintColor: "#fff", // Colore del testo dell'header
        }}
      />
      <Tabs.Screen
        name="categorie"
        options={{
          title: "Categorie",
          headerStyle: {
            backgroundColor: "#6a11cb", // Colore di sfondo dell'header
          },
          headerTintColor: "#fff", // Colore del testo dell'header
        }}
      />
      <Tabs.Screen
        name="statistiche"
        options={{
          title: "Statistiche",
          headerStyle: {
            backgroundColor: "#6a11cb", // Colore di sfondo dell'header
          },
          headerTintColor: "#fff", // Colore del testo dell'header
        }}
      />
      <Tabs.Screen
        name="preferiti"
        options={{
          title: "Preferiti",
          headerStyle: {
            backgroundColor: "#6a11cb", // Colore di sfondo dell'header
          },
          headerTintColor: "#fff", // Colore del testo dell'header
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
