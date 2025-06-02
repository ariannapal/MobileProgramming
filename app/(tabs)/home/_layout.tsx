import { Stack } from "expo-router";
/*Gestire la navigazione interna alla tab home, 
creando un nested stack navigator.*/
export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // nasconde l’header per la home principale
        }}
      />
    </Stack>
  );
}
