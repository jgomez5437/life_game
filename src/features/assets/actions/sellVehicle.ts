import { usePlayerStore } from '@/features/player/usePlayerStore';

export const sellVehicleAction = (vehicleId: string): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  const vehicleIndex = store.assets.findIndex(a => a.id === vehicleId);

  if (vehicleIndex === -1) {
    return { success: false, message: "Vehicle not found." };
  }

  const vehicle = store.assets[vehicleIndex];
  const salePrice = vehicle.value;

  const updatedAssets = [...store.assets];
  updatedAssets.splice(vehicleIndex, 1);

  usePlayerStore.setState({
    money: store.money + salePrice,
    assets: updatedAssets,
  });

  store.addLog(`Sold ${vehicle.name} for $${salePrice.toLocaleString()}.`, 'good');

  return { success: true, message: `Successfully sold ${vehicle.name}.` };
};
