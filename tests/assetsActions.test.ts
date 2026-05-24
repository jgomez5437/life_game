import { usePlayerStore } from '../src/features/player/usePlayerStore';
import { buyVehicleAction } from '../src/features/assets/actions/buyVehicle';
import { sellVehicleAction } from '../src/features/assets/actions/sellVehicle';
import { repairVehicleAction } from '../src/features/assets/actions/repairVehicle';

describe('Asset Actions', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  test('buyVehicleAction - success', () => {
    usePlayerStore.setState({ money: 30000 });
    // ID 1 is "Rusty Toyota Camry" for 2000
    const result = buyVehicleAction(1);
    
    expect(result.success).toBe(true);
    expect(usePlayerStore.getState().money).toBe(28000);
    expect(usePlayerStore.getState().assets.length).toBe(1);
    expect(usePlayerStore.getState().assets[0].name).toBe("Rusty Toyota Camry");
  });

  test('buyVehicleAction - insufficient funds', () => {
    usePlayerStore.setState({ money: 1000 });
    const result = buyVehicleAction(1); // Costs 2000
    
    expect(result.success).toBe(false);
    expect(usePlayerStore.getState().money).toBe(1000);
    expect(usePlayerStore.getState().assets.length).toBe(0);
  });

  test('sellVehicleAction - success', () => {
    usePlayerStore.setState({ 
      money: 5000,
      assets: [{
        id: 'test_car',
        name: 'Test Car',
        category: 'vehicle',
        value: 15000,
        condition: 100
      }]
    });

    const result = sellVehicleAction('test_car');
    
    expect(result.success).toBe(true);
    expect(usePlayerStore.getState().money).toBe(20000); // 5000 + 15000
    expect(usePlayerStore.getState().assets.length).toBe(0);
  });

  test('repairVehicleAction - success', () => {
    usePlayerStore.setState({ 
      money: 5000,
      assets: [{
        id: 'test_car',
        name: 'Test Car',
        category: 'vehicle',
        value: 20000,
        condition: 50 // 50 damage
      }]
    });

    // 50 damage * 20 base = 1000. 1000 * 1 (multiplier for 20k) = 1000 repair cost.
    const result = repairVehicleAction('test_car', 1000);
    
    expect(result.success).toBe(true);
    expect(usePlayerStore.getState().money).toBe(4000); // 5000 - 1000
    expect(usePlayerStore.getState().assets[0].condition).toBe(100);
    expect(usePlayerStore.getState().assets[0].value).toBe(21000); // 20000 * 1.05
  });
});
