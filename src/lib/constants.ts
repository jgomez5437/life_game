export const MAJORS = [
  { name: "Psychology", icon: "fa-brain" },
  { name: "Computer Science", icon: "fa-laptop-code" },
  { name: "English", icon: "fa-book-open" },
  { name: "Education", icon: "fa-chalkboard-teacher" },
  { name: "Marketing", icon: "fa-bullhorn" }, 
  { name: "Business", icon: "fa-chart-line" },
  { name: "Nursing", icon: "fa-user-nurse" },
  { name: "Religious Studies", icon: "fa-church" },
  { name: "Biology", icon: "fa-leaf" },
  { name: "Graphic Design", icon: "fa-palette" },
  { name: "Chemistry", icon: "fa-flask" },
  { name: "Political Science", icon: "fa-landmark" },
  { name: "Criminal Justice", icon: "fa-gavel" }
];

export const CAREERS = [
  { title: "Jr. Associate", salary: 70000, icon: "fa-briefcase", reqDegree: true, reqGrad: "Law School" },
  { title: "Firefighter", salary: 57000, icon: "fa-fire-extinguisher", reqDegree: false, reqLaw: false },
  { title: "Graphic Designer", salary: 55000, icon: "fa-pen-nib", reqDegree: true, reqLaw: false }, 
  { title: "Resident Doctor", salary: 65000, icon: "fa-user-md", reqDegree: true, reqGrad: "Medical School" },
  { title: "Psychiatry Resident", salary: 65000, icon: "fa-brain", reqDegree: true, reqGrad: "Psychiatry School" },
  { title: "Police Officer", salary: 55000, icon: "fa-user-shield", reqDegree: false, reqLaw: false },
  { title: "Jr. Software Developer", salary: 50000, icon: "fa-code", reqDegree: true, reqLaw: false }, 
  { title: "Banker", salary: 40000, icon: "fa-money-check-dollar", reqDegree: true, reqLaw: false }, 
  { title: "Jr. Business Analyst", salary: 65000, icon: "fa-chart-line", reqDegree: true, reqGrad: "Business School" },
  { title: "Apprentice Plumber", salary: 40000, icon: "fa-wrench", reqDegree: false, reqLaw: false },
  { title: "Baker", salary: 35000, icon: "fa-bread-slice", reqDegree: false, reqLaw: false }
];

export const PART_TIME_JOBS = [
  { title: "Babysitter", hourly: 15, salary: 15600, icon: "fa-baby-carriage" },
  { title: "Amusement Park Crew", hourly: 12, salary: 12480, icon: "fa-ticket-alt" },
  { title: "Movie Theater Crew", hourly: 11, salary: 11440, icon: "fa-film" },
  { title: "Dog Walker", hourly: 10, salary: 10400, icon: "fa-dog" },
  { title: "Fast Food Crew", hourly: 10, salary: 10400, icon: "fa-hamburger" }
];

export const GRAD_SCHOOLS = [
  { name: "Law School", years: 3, icon: "fa-balance-scale" },
  { name: "Medical School", years: 4, icon: "fa-user-md" },
  { name: "Business School", years: 2, icon: "fa-chart-line" },
  { name: "Psychiatry School", years: 4, icon: "fa-brain" }
];

export const INDUSTRIES = {
  tech: { 
      name: "Software Startup", 
      icon: "fa-laptop-code", 
      description: "High tech, high risk, potential for massive scale.",
      baseDemand: 2500, 
      unitPrice: 50, 
      unitCost: 5, 
      baseSalary: 6000, 
      volatility: 0.4,
      startupCost: 150000 
  },
  retail: { 
      name: "Fashion Brand", 
      icon: "fa-tshirt", 
      description: "Steady demand, brand loyalty is key.",
      baseDemand: 5000, 
      unitPrice: 40, 
      unitCost: 15, 
      baseSalary: 2500, 
      volatility: 0.2,
      startupCost: 75000
  },
  auto: { 
      name: "Auto Manufacturer", 
      icon: "fa-car", 
      description: "Capital intensive, low margin, high volume.",
      baseDemand: 800, 
      unitPrice: 25000, 
      unitCost: 18000, 
      baseSalary: 3500, 
      volatility: 0.1,
      startupCost: 1000000
  }
};

export const SUPPLIERS = [
  { id: 'cheap', name: 'Budget', costMod: 0.8, quality: 30, risk: 0.2 },
  { id: 'standard', name: 'Standard', costMod: 1.0, quality: 60, risk: 0.05 },
  { id: 'premium', name: 'Premium', costMod: 1.4, quality: 95, risk: 0.01 }
];

export const VEHICLES_FOR_SALE = [
  { id: 1, name: "Rusty Toyota Camry", type: "sedan", price: 2000, condition: 60 },
  { id: 2, name: "Rusty Honda Civic", type: "sedan", price: 2200, condition: 60 },
  { id: 3, name: "Used Honda Fit", type: "hatchback", price: 6000, condition: 80 },
  { id: 4, name: "Used Ford Fiesta", type: "hatchback", price: 5500, condition: 80 },
  { id: 5, name: "New Subaru Forester", type: "suv", price: 35000, condition: 100 },
  { id: 6, name: "New Toyota Rav4", type: "suv", price: 35000, condition: 100 },
  { id: 7, name: "New Ford F-150 XL", type: "truck", price: 45500, condition: 100 },
  { id: 8, name: "New Chevrolet Silverado 1500", type: "truck", price: 42000, condition: 100 },
  { id: 9, name: "New Chevrolet Corvette Stingray", type: "sports", price: 67000, condition: 100 },
  { id: 10, name: "New BMW M2", type: "sports", price: 65000, condition: 100 },
  { id: 11, name: "New Lamborghini Huracán", type: "supercar", price: 255000, condition: 100 },
  { id: 12, name: "New Ferrari Roma", type: "supercar", price: 260000, condition: 100 }
];
