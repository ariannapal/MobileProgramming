import { Stack } from "expo-router";

export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // nasconde l’header per la home principale
        }}
      />
    

 <Stack.Screen
        name="aggiungi" 
        options={{
          headerShown: true, // Nascondiamo l'header per la schermata aggiungi
          
        }}
      />
      
    </Stack>

    
  );
}
