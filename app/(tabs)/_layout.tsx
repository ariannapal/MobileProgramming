import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="categorie" options={{ title: "Categorie" }} />
      <Tabs.Screen name="statistiche" options={{ title: "Statistiche" }} />
      <Tabs.Screen name="preferiti" options={{ title: "Preferiti" }} />
    </Tabs>
  );
}
