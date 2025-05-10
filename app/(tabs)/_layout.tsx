import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="categoria" options={{ title: "Categoria" }} />
      <Tabs.Screen name="statistiche" options={{ title: "Statistiche" }} />
    </Tabs>
  );
}
