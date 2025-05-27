import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type HeaderSearchBarProps = {
  value: string;
  onChange: (text: string) => void;
};

export default function HeaderSearchBar({
  value,
  onChange,
}: HeaderSearchBarProps) {
  const router = useRouter();

  return (
    <View style={{ backgroundColor: "#0f0f2a", paddingBottom: 16 }}>
      <View
        style={{
          paddingTop: 10,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
          Search
        </Text>
        <View style={{ width: 24 }} /> {/* Spazio di simmetria */}
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#1f1f1f",
          marginHorizontal: 16,
          marginTop: 12,
          borderRadius: 12,
          paddingHorizontal: 12,
          alignItems: "center",
        }}
      >
        <Ionicons
          name="search"
          size={18}
          color="#888"
          style={{ marginRight: 6 }}
        />
        <TextInput
          placeholder="Cerca una Serie..."
          placeholderTextColor="#888"
          value={value}
          onChangeText={onChange}
          style={{
            flex: 1,
            paddingVertical: 10,
            color: "#fff",
          }}
        />
      </View>
    </View>
  );
}
