import { usePlayerStore } from '@/features/player/usePlayerStore';
import { VEHICLES_FOR_SALE } from '@/lib/constants';
import { Asset } from '@/types/player';

export const buyVehicleAction = (vehicleId: number): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  const vehicleDef = VEHICLES_FOR_SALE.find(v => v.id === vehicleId);

  if (!vehicleDef) {
    return { success: false, message: "Vehicle not found." };
  }

  if (store.money < vehicleDef.price) {
    return { success: false, message: "Insufficient funds." };
  }

  // Generate unique ID for the new asset instance
  const newAsset: Asset = {
    id: `veh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: vehicleDef.name,
    category: 'vehicle',
    type: vehicleDef.type,
    value: vehicleDef.price,
    condition: vehicleDef.condition,
    purchasePrice: vehicleDef.price,
  };

  // Perform mutations via store methods
  usePlayerStore.setState(state => ({
    money: state.money - vehicleDef.price,
    assets: [...state.assets, newAsset],
  }));

  // Add life log
  store.addLog(`Purchased a ${vehicleDef.name} for $${vehicleDef.price.toLocaleString()}.`, 'good');

  return { success: true, message: `Successfully purchased ${vehicleDef.name}.` };
};
