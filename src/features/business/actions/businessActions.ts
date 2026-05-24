import { usePlayerStore } from '@/features/player/usePlayerStore';
import { INDUSTRIES, SUPPLIERS } from '@/lib/constants';
import { BusinessState } from '@/types/player';
import { checkLifeStatus } from '@/lib/gameLogic';

export const incorporateBusinessAction = (
  companyName: string, 
  industryId: keyof typeof INDUSTRIES, 
  supplierId: string
): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  const ind = INDUSTRIES[industryId];

  if (store.money < ind.startupCost) {
    return { success: false, message: `You need $${ind.startupCost.toLocaleString()} to start this business.` };
  }

  const initialBusiness: BusinessState = {
    industry: industryId,
    supplier: supplierId,
    productPrice: ind.unitPrice,
    marketingBudget: 1000,
    employeePay: ind.baseSalary,
    revenue: 0,
    expenses: 0,
    cash: 50000, // starting cash injection
    customers: 0
  };

  usePlayerStore.setState(state => {
    const nextState = {
      ...state,
      money: state.money - ind.startupCost,
      hasBusiness: true,
      companyName: companyName,
      ceoSalary: 0,
      business: initialBusiness,
      jobTitle: '',
      jobSalary: 0,
      jobPerformance: 50
    };
    return { ...nextState, lifeStatus: checkLifeStatus(nextState) };
  });

  store.addLog(`Incorporated ${companyName} in the ${ind.name} industry.`, 'good');

  return { success: true, message: `Successfully incorporated ${companyName}!` };
};

export const updateBusinessSettingsAction = (
  productPrice: number,
  marketingBudget: number,
  employeePay: number,
  ceoSalary: number
): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  if (!store.business) {
    return { success: false, message: "No business found." };
  }

  usePlayerStore.setState(state => ({
    ceoSalary: ceoSalary,
    business: {
      ...state.business!,
      productPrice,
      marketingBudget,
      employeePay
    }
  }));

  return { success: true, message: "Settings updated." };
};

export const sellBusinessAction = (): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  if (!store.business) {
    return { success: false, message: "No business found." };
  }

  // Very simple valuation: Cash + (Revenue * 2)
  const valuation = store.business.cash + (store.business.revenue * 2);

  usePlayerStore.setState(state => {
    const nextState = {
      ...state,
      money: state.money + valuation,
      hasBusiness: false,
      companyName: null,
      ceoSalary: 0,
      business: null
    };
    return { ...nextState, lifeStatus: checkLifeStatus(nextState) };
  });

  store.addLog(`Sold ${store.companyName} for $${valuation.toLocaleString()}.`, 'good');

  return { success: true, message: `You sold your company for $${valuation.toLocaleString()}.` };
};

export const startBusinessAction = (
  name: string,
  industryKey: string,
  supplierId: string,
  price: number,
  marketing: number,
  employeePay: number,
  ceoSalary: number
): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  
  if (store.hasBusiness) return { success: false, message: "You already own a business." };

  const ind = INDUSTRIES[industryKey as keyof typeof INDUSTRIES];
  if (!ind) return { success: false, message: "Invalid industry." };

  const sup = SUPPLIERS.find(s => s.id === supplierId);
  if (!sup) return { success: false, message: "Invalid supplier." };

  const initialInventoryCost = ind.unitCost * sup.costMultiplier * 1000;
  const initialMarketing = marketing;
  const initialPayroll = employeePay * 2; 
  const totalCost = initialInventoryCost + initialMarketing + initialPayroll;

  if (store.money < totalCost) {
    return { success: false, message: `You need ${formatMoney(totalCost)} to start this business.` };
  }

  usePlayerStore.setState(state => {
    const nextState = {
      ...state,
      hasBusiness: true,
      companyName: name,
      ceoSalary,
      money: state.money - totalCost,
      business: {
        industry: industryKey,
        supplier: supplierId,
        productPrice: price,
        marketingBudget: marketing,
        employeePay,
        revenue: 0,
        expenses: 0,
        cash: 10000, 
        customers: 0
      }
    };
    return { ...nextState, lifeStatus: checkLifeStatus(nextState) };
  });

  usePlayerStore.getState().addLog(`You founded ${name} in the ${ind.name} industry!`, 'good');
  return { success: true, message: `Business started! Total startup cost: ${formatMoney(totalCost)}` };
};
