import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Dettagli() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Schermata Dettagli</Text>
      <Button title="Torna indietro" onPress={() => router.back()} />
    </View>
  );
}
