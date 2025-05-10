import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function ExtraScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>Schermata Extra</Text>
      <Button title="Torna indietro" onPress={() => router.back()} />
    </View>
  );
}
