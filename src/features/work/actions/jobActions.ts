import { usePlayerStore } from '@/features/player/usePlayerStore';

export const applyForJobAction = (
  jobTitle: string, 
  salary: number, 
  reqDegree: boolean = false, 
  reqGrad: string | null = null
): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();

  // Validate requirements
  if (reqDegree && !store.universityGraduated) {
    return { success: false, message: `You need a University degree to apply for ${jobTitle}.` };
  }

  if (reqGrad && store.gradSchoolDegree !== reqGrad) {
    return { success: false, message: `You need a ${reqGrad} degree to apply for ${jobTitle}.` };
  }

  if (store.jobTitle === jobTitle) {
    return { success: false, message: "You already have this job." };
  }

  // Basic interview logic (e.g., 70% chance to pass)
  const passedInterview = Math.random() < 0.7;

  if (passedInterview) {
    store.setJobInfo(jobTitle, salary);
    store.addLog(`Nailed the interview! You are now a ${jobTitle} making $${salary.toLocaleString()}/yr.`, 'good');
    return { success: true, message: `Congratulations! You got the job as ${jobTitle}.` };
  } else {
    store.addLog(`Bombed the interview for ${jobTitle}. Better luck next time.`, 'bad');
    return { success: false, message: "You didn't pass the interview. Try again later." };
  }
};

export const quitJobAction = (): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  
  if (!store.jobTitle) {
    return { success: false, message: "You don't have a job to quit." };
  }

  const oldTitle = store.jobTitle;
  store.quitJob();
  store.addLog(`You quit your job as a ${oldTitle}.`, 'neutral');

  return { success: true, message: "You have resigned from your position." };
};

export const workHarderAction = (): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  if (store.jobActions >= 2) {
    return { success: false, message: "You've already worked hard enough this year." };
  }
  const newPerf = Math.min(100, store.jobPerformance + 15);
  usePlayerStore.setState(s => ({
    jobPerformance: newPerf,
    jobActions: s.jobActions + 1
  }));
  return { success: true, message: "You worked harder. Performance increased!" };
};

export const slackOffAction = (): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  if (store.jobActions >= 2) {
    return { success: false, message: "You've already slacked off enough this year." };
  }
  const newPerf = Math.max(0, store.jobPerformance - 20);
  usePlayerStore.setState(s => ({
    jobPerformance: newPerf,
    jobActions: s.jobActions + 1
  }));
  return { success: true, message: "You slacked off. Performance decreased." };
};
