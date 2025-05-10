import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>Home</Text>
      <Button
        title="Vai alla schermata extra"
        onPress={() => router.push("/(tabs)/home/extra")}
      />
    </View>
  );
}
