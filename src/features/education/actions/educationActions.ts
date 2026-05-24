import { usePlayerStore } from '@/features/player/usePlayerStore';

type PaymentMethod = 'cash' | 'loan' | 'scholarship' | 'parents';

export const enrollUniversityAction = (major: string, method: PaymentMethod): { success: boolean; message: string; requiresChoiceAgain?: boolean } => {
  const store = usePlayerStore.getState();
  const tuition = 40000;

  if (method === 'cash') {
    if (store.money < tuition) return { success: false, message: "Insufficient funds." };
    store.updateMoney(-tuition);
    finishEnrollment(major, "paid with cash");
    return { success: true, message: `Enrolled in ${major}.` };
  } 
  
  if (method === 'loan') {
    usePlayerStore.setState(s => ({ studentLoans: s.studentLoans + tuition }));
    finishEnrollment(major, "took out student loans");
    return { success: true, message: `Enrolled in ${major}.` };
  }

  if (method === 'scholarship') {
    const passed = Math.random() < 0.3;
    if (passed) {
      finishEnrollment(major, "received a full scholarship");
      return { success: true, message: `Got scholarship and enrolled in ${major}.` };
    } else {
      // Failed scholarship
      usePlayerStore.setState({ scholarshipTried: true });
      return { success: false, message: "Scholarship denied.", requiresChoiceAgain: true };
    }
  }

  if (method === 'parents') {
    const passed = Math.random() < 0.3;
    if (passed) {
      finishEnrollment(major, "parents paid your tuition");
      return { success: true, message: `Parents paid! Enrolled in ${major}.` };
    } else {
      // Failed parents
      usePlayerStore.setState({ parentsTried: true });
      return { success: false, message: "Parents refused.", requiresChoiceAgain: true };
    }
  }

  return { success: false, message: "Invalid method." };
};

const finishEnrollment = (major: string, methodMsg: string) => {
  const store = usePlayerStore.getState();
  usePlayerStore.setState({
    universityEnrolled: true,
    isStudent: true,
    major: major,
    schoolPerformance: 50,
    schoolActions: 0
  });
  store.addLog(`Enrolled in University for ${major}. You ${methodMsg}.`, 'good');
};

export const enrollGradSchoolAction = (schoolType: string, method: PaymentMethod): { success: boolean; message: string; requiresChoiceAgain?: boolean } => {
  const store = usePlayerStore.getState();
  const tuition = 100000;

  if (method === 'cash') {
    if (store.money < tuition) return { success: false, message: "Insufficient funds." };
    store.updateMoney(-tuition);
    finishGradEnrollment(schoolType, "paid with cash");
    return { success: true, message: `Enrolled in ${schoolType}.` };
  } 
  
  if (method === 'loan') {
    usePlayerStore.setState(s => ({ studentLoans: s.studentLoans + tuition }));
    finishGradEnrollment(schoolType, "took out student loans");
    return { success: true, message: `Enrolled in ${schoolType}.` };
  }

  if (method === 'scholarship') {
    const passed = Math.random() < 0.3;
    if (passed) {
      finishGradEnrollment(schoolType, "received a full scholarship");
      return { success: true, message: `Got scholarship and enrolled in ${schoolType}.` };
    } else {
      usePlayerStore.setState({ scholarshipTried: true });
      return { success: false, message: "Scholarship denied.", requiresChoiceAgain: true };
    }
  }

  if (method === 'parents') {
    const passed = Math.random() < 0.3;
    if (passed) {
      finishGradEnrollment(schoolType, "parents paid your tuition");
      return { success: true, message: `Parents paid! Enrolled in ${schoolType}.` };
    } else {
      usePlayerStore.setState({ parentsTried: true });
      return { success: false, message: "Parents refused.", requiresChoiceAgain: true };
    }
  }

  return { success: false, message: "Invalid method." };
};

const finishGradEnrollment = (schoolType: string, methodMsg: string) => {
  const store = usePlayerStore.getState();
  usePlayerStore.setState({
    gradSchoolEnrolled: true,
    isStudent: true,
    gradSchoolType: schoolType,
    gradSchoolYear: 0,
    schoolPerformance: 50,
    schoolActions: 0
  });
  store.addLog(`Enrolled in ${schoolType}. You ${methodMsg}.`, 'good');
};

export const studyHarderAction = (): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  if (store.schoolActions >= 2) {
    return { success: false, message: "You've already focused on school enough this year." };
  }
  const newPerf = Math.min(100, store.schoolPerformance + 15);
  usePlayerStore.setState(s => ({
    schoolPerformance: newPerf,
    schoolActions: s.schoolActions + 1
  }));
  return { success: true, message: "You studied harder. Performance increased!" };
};

export const skipSchoolAction = (): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  if (store.schoolActions >= 2) {
    return { success: false, message: "You've already acted out enough this year." };
  }
  const newPerf = Math.max(0, store.schoolPerformance - 20);
  usePlayerStore.setState(s => ({
    schoolPerformance: newPerf,
    schoolActions: s.schoolActions + 1
  }));
  return { success: true, message: "You skipped school. Performance decreased." };
};
