import { usePlayerStore } from '@/features/player/usePlayerStore';

export const repairVehicleAction = (vehicleId: string, cost: number): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  const vehicleIndex = store.assets.findIndex(a => a.id === vehicleId);

  if (vehicleIndex === -1) {
    return { success: false, message: "Vehicle not found." };
  }

  if (store.money < cost) {
    return { success: false, message: "Insufficient funds." };
  }

  const vehicle = store.assets[vehicleIndex];
  
  const updatedAssets = [...store.assets];
  updatedAssets[vehicleIndex] = {
    ...vehicle,
    condition: 100,
    value: Math.floor(vehicle.value * 1.05), // Slight value bump
  };

  usePlayerStore.setState({
    money: store.money - cost,
    assets: updatedAssets,
  });

  store.addLog(`Repaired ${vehicle.name} for $${cost.toLocaleString()}.`, 'neutral');

  return { success: true, message: `Successfully repaired ${vehicle.name}.` };
};
