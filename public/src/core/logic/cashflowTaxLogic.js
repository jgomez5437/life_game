import { addLivingExpenses } from './playerStatsLogic.js';
import { calculateTotalAutoLoanMonthlyOutflow } from './vehiclesJewelryLogic.js';
import { getDietPlan, calculateActiveHealthCosts, calculateChildMonthlyOutflow } from './healthMortalityLogic.js';
import { calculateTotalRentalIncome, PROPERTY_MANAGER_FEE_RATE, isPropertyManagerHired, calculatePropertyMonthlyOutflow } from './landlordTenantLogic.js';
import { calculateSpousalIncomeContribution } from './npcGeneratorLogic.js';

export function getMinRetireYears(userOrTrack) {
    const trackKey = typeof userOrTrack === 'string' ? userOrTrack : (userOrTrack?.careerTrack || '');
    if (trackKey === 'military') return 20;
    if (trackKey === 'law_enforcement') return 25;
    return 30;
}

export function calculateUserMonthlyIncome(user) {
    if (!user) return 0;
    let monthlyIncome = 0;
    if (user.hasBusiness && user.ceoSalary) monthlyIncome += user.ceoSalary;
    if (user.jobTitle && user.jobSalary) monthlyIncome += Math.floor(user.jobSalary / 12);
    if (user.isRetired && user.retirementPension) monthlyIncome += Math.floor(user.retirementPension / 12);
    monthlyIncome += calculateTotalRentalIncome(user.assets, user);
    return monthlyIncome;
}

export function calculateUserMonthlyOutflow(user) {
    if (!user) return 0;
    let monthlyOutflow = 0;

    // 1. Living Expenses (annual / 12)
    const annualLiving = addLivingExpenses(user.age, user.isStudent, user.city);
    monthlyOutflow += Math.round(annualLiving / 12);

    // 2. Student Loans (monthly)
    if (user.studentLoans > 0 && !user.isStudent && user.age >= 18) {
        const annualCap = Math.min(2400, user.studentLoans);
        monthlyOutflow += Math.round(annualCap / 12);
    }

    // 3. Property Mortgages (monthly)
    monthlyOutflow += calculatePropertyMonthlyOutflow(user.assets);

    // 4. Auto Loans (monthly)
    monthlyOutflow += calculateTotalAutoLoanMonthlyOutflow(user.assets);

    // 5. Children ($500/mo per child under 21)
    monthlyOutflow += calculateChildMonthlyOutflow(user.relationships);

    // 6. Active Health & Diet (monthly)
    const annualHealth = calculateActiveHealthCosts(user);
    monthlyOutflow += Math.round(annualHealth / 12);

    // 7. Vehicle & Jewelry Insurance (monthly)
    if (Array.isArray(user.assets)) {
        user.assets.forEach(asset => {
            if (asset.category === 'vehicle' && asset.insured) {
                const annualFee = Math.max(20, Math.floor(asset.value * 0.008));
                monthlyOutflow += Math.round(annualFee / 12);
            } else if (asset.category === 'jewelry' && asset.insured) {
                const annualFee = Math.max(10, Math.floor(asset.value * 0.005));
                monthlyOutflow += Math.round(annualFee / 12);
            }
        });
    }

    return monthlyOutflow;
}

/**
 * Calculates a complete itemized breakdown of monthly/annual cashflow (income vs. expenses)
 * and net worth (assets vs. liabilities) for the Cashflow & Net Worth Breakdown Modal (1.1).
 * @param {Object} user - The active user state object.
 * @returns {Object} Itemized cashflow and net worth breakdown.
 */
export function calculateFinancialBreakdown(user) {
    if (!user) {
        return {
            cashflow: {
                incomeItems: [],
                expenseItems: [],
                coreMonthlyIncome: 0,
                monthlyIncome: 0,
                annualIncome: 0,
                monthlyOutflow: 0,
                annualOutflow: 0,
                netMonthly: 0,
                netAnnual: 0
            },
            netWorth: {
                assetItems: [],
                liabilityItems: [],
                cash: 0,
                savingsBalance: 0,
                stockPortfolioVal: 0,
                propGrossVal: 0,
                propDebt: 0,
                propEquity: 0,
                vehGrossVal: 0,
                vehDebt: 0,
                vehEquity: 0,
                jewelryVal: 0,
                businessCash: 0,
                studentLoanBalance: 0,
                totalAssets: 0,
                totalLiabilities: 0,
                netWorth: 0
            }
        };
    }

    const assets = Array.isArray(user.assets) ? user.assets : [];
    const relationships = Array.isArray(user.relationships) ? user.relationships : [];

    // ─── 1. CASHFLOW: INCOME STREAMS ──────────────────────────────────────────
    const incomeItems = [];

    // 1.1 Job Salary
    const jobAnnual = (user.jobTitle && user.jobSalary > 0) ? Math.round(user.jobSalary) : 0;
    const jobMonthly = jobAnnual > 0 ? Math.floor(jobAnnual / 12) : 0;
    incomeItems.push({
        id: 'salary',
        label: user.jobTitle ? `Salary (${user.jobTitle})` : 'Job Salary',
        sublabel: user.jobTitle ? 'Primary Career' : 'Unemployed',
        icon: 'fa-briefcase',
        color: 'text-emerald-400',
        monthly: jobMonthly,
        annual: jobAnnual,
        active: jobAnnual > 0
    });

    // 1.2 CEO / Business Salary
    const ceoMonthly = (user.hasBusiness && user.ceoSalary > 0) ? Math.round(user.ceoSalary) : 0;
    const ceoAnnual = ceoMonthly * 12;
    if (user.hasBusiness || ceoMonthly > 0) {
        incomeItems.push({
            id: 'ceo_salary',
            label: `CEO Salary (${user.companyName || 'Business'})`,
            sublabel: 'Executive Compensation',
            icon: 'fa-building',
            color: 'text-indigo-400',
            monthly: ceoMonthly,
            annual: ceoAnnual,
            active: ceoMonthly > 0
        });
    }

    // 1.3 Retirement Pension
    const pensionAnnual = (user.isRetired && user.retirementPension > 0) ? Math.round(user.retirementPension) : 0;
    const pensionMonthly = pensionAnnual > 0 ? Math.floor(pensionAnnual / 12) : 0;
    if (user.isRetired || pensionAnnual > 0) {
        incomeItems.push({
            id: 'pension',
            label: 'Retirement Pension',
            sublabel: 'Guaranteed Retirement Benefit',
            icon: 'fa-cocktail',
            color: 'text-amber-400',
            monthly: pensionMonthly,
            annual: pensionAnnual,
            active: pensionAnnual > 0
        });
    }

    // 1.4 Rental Income
    const rentedProperties = assets.filter(a =>
        a && a.category === 'property' && a.isRented &&
        ((a.tenant && a.tenant.monthlyRent > 0) || a.monthlyRent > 0)
    );
    const managerFeeFactor = isPropertyManagerHired(user) ? (1 - PROPERTY_MANAGER_FEE_RATE) : 1;
    const rentOf = (p) => {
        const gross = (p.tenant && p.tenant.monthlyRent) ? p.tenant.monthlyRent : (p.monthlyRent || 0);
        return Math.round(gross * managerFeeFactor);
    };
    const rentalMonthly = rentedProperties.reduce((sum, p) => sum + rentOf(p), 0);
    const rentalAnnual = rentalMonthly * 12;
    incomeItems.push({
        id: 'rental_income',
        label: 'Rental Income',
        sublabel: rentedProperties.length > 0
            ? `${rentedProperties.length} Rented ${rentedProperties.length === 1 ? 'Property' : 'Properties'}${managerFeeFactor < 1 ? ' • Managed (after 10% fee)' : ''}`
            : 'No Active Tenants',
        icon: 'fa-house-user',
        color: 'text-teal-400',
        monthly: rentalMonthly,
        annual: rentalAnnual,
        active: rentalMonthly > 0,
        details: rentedProperties.map(p => ({ name: p.name || 'Property', monthly: rentOf(p) }))
    });

    // 1.5 Stock Dividends
    let dividendsAnnual = 0;
    let dividendStockCount = 0;
    if (user.investments && Array.isArray(user.investments.stockMarket) && user.investments.stocks) {
        user.investments.stockMarket.forEach(stock => {
            const holding = user.investments.stocks[stock.symbol];
            if (holding && holding.shares > 0 && stock.dividendYield > 0) {
                const div = Math.floor(holding.shares * stock.price * stock.dividendYield);
                if (div > 0) {
                    dividendsAnnual += div;
                    dividendStockCount++;
                }
            }
        });
    }
    const dividendsMonthly = Math.round(dividendsAnnual / 12);
    incomeItems.push({
        id: 'dividends',
        label: 'Stock Dividends',
        sublabel: dividendStockCount > 0
            ? `${dividendStockCount} Yielding ${dividendStockCount === 1 ? 'Position' : 'Positions'}`
            : 'No Dividend Stocks Owned',
        icon: 'fa-chart-pie',
        color: 'text-purple-400',
        monthly: dividendsMonthly,
        annual: dividendsAnnual,
        active: dividendsAnnual > 0
    });

    // 1.6 High-Yield Savings Interest (3.5% APY)
    const savingsBalance = (user.investments && typeof user.investments.savings === 'number' && user.investments.savings > 0)
        ? user.investments.savings
        : 0;
    const savingsInterestAnnual = savingsBalance > 0 ? Math.floor(savingsBalance * 0.035) : 0;
    const savingsInterestMonthly = Math.round(savingsInterestAnnual / 12);
    if (savingsBalance > 0) {
        incomeItems.push({
            id: 'savings_interest',
            label: 'Savings Interest (3.5% APY)',
            sublabel: 'High-Yield Savings Compounding',
            icon: 'fa-piggy-bank',
            color: 'text-cyan-400',
            monthly: savingsInterestMonthly,
            annual: savingsInterestAnnual,
            active: savingsInterestAnnual > 0
        });
    }

    // 1.7 Spousal Income Contribution
    const spousalInfo = calculateSpousalIncomeContribution(user);
    const spousalAnnual = spousalInfo && spousalInfo.amount > 0 ? spousalInfo.amount : 0;
    const spousalMonthly = Math.round(spousalAnnual / 12);
    if (spousalInfo && spousalInfo.spouseName) {
        incomeItems.push({
            id: 'spousal_income',
            label: `Spouse Contribution (${spousalInfo.spouseName})`,
            sublabel: spousalInfo.spouseJob ? `50% of ${spousalInfo.spouseJob} Income` : 'Household Contribution',
            icon: 'fa-ring',
            color: 'text-pink-400',
            monthly: spousalMonthly,
            annual: spousalAnnual,
            active: spousalAnnual > 0
        });
    }

    // ─── 2. CASHFLOW: EXPENSE / OUTFLOW STREAMS ───────────────────────────────
    const expenseItems = [];

    // 2.1 Taxes (no tax engine exists yet; surfaces user.monthlyTaxes if ever set, else $0)
    const taxesMonthly = (typeof user.monthlyTaxes === 'number' && user.monthlyTaxes > 0) ? Math.round(user.monthlyTaxes) : 0;
    const taxesAnnual = taxesMonthly * 12;
    expenseItems.push({
        id: 'taxes',
        label: 'Taxes',
        sublabel: taxesMonthly > 0 ? 'Income & Property Tax' : 'No Active Tax Liability ($0)',
        icon: 'fa-landmark',
        color: 'text-slate-400',
        monthly: taxesMonthly,
        annual: taxesAnnual,
        active: taxesMonthly > 0
    });

    // 2.2 Living Expenses
    const livingAnnual = addLivingExpenses(user.age, user.isStudent, user.city);
    const livingMonthly = Math.round(livingAnnual / 12);
    expenseItems.push({
        id: 'living_expenses',
        label: `Living Expenses (${user.city || 'Standard'})`,
        sublabel: (user.age < 19 || user.isStudent) ? 'Exempt while dependent / student' : 'Housing, Utilities & Essentials',
        icon: 'fa-basket-shopping',
        color: 'text-rose-400',
        monthly: livingMonthly,
        annual: livingAnnual,
        active: livingMonthly > 0
    });

    // 2.3 Property Mortgages
    const mortgagedProperties = assets.filter(a => a && a.category === 'property' && a.mortgage && a.mortgage.remainingBalance > 0);
    const mortgageMonthly = calculatePropertyMonthlyOutflow(assets);
    const mortgageAnnual = mortgageMonthly * 12;
    expenseItems.push({
        id: 'mortgages',
        label: 'Property Mortgages',
        sublabel: mortgagedProperties.length > 0
            ? `${mortgagedProperties.length} Active ${mortgagedProperties.length === 1 ? 'Mortgage' : 'Mortgages'}`
            : 'No Active Mortgages',
        icon: 'fa-house',
        color: 'text-rose-400',
        monthly: mortgageMonthly,
        annual: mortgageAnnual,
        active: mortgageMonthly > 0,
        details: mortgagedProperties.map(p => ({
            name: p.name || 'Property',
            monthly: Math.max(0, Number(p.mortgage.monthlyPayment) || 0),
            remainingBalance: Math.max(0, Number(p.mortgage.remainingBalance) || 0)
        }))
    });

    // 2.4 Auto Loans
    const financedVehicles = assets.filter(a => a && a.category === 'vehicle' && a.loan && a.loan.remainingBalance > 0);
    const autoLoanMonthly = calculateTotalAutoLoanMonthlyOutflow(assets);
    const autoLoanAnnual = autoLoanMonthly * 12;
    if (financedVehicles.length > 0 || assets.some(a => a && a.category === 'vehicle')) {
        expenseItems.push({
            id: 'auto_loans',
            label: 'Auto Loans',
            sublabel: financedVehicles.length > 0
                ? `${financedVehicles.length} Financed ${financedVehicles.length === 1 ? 'Vehicle' : 'Vehicles'}`
                : 'Paid in Full',
            icon: 'fa-car',
            color: 'text-rose-400',
            monthly: autoLoanMonthly,
            annual: autoLoanAnnual,
            active: autoLoanMonthly > 0
        });
    }

    // 2.5 Student Loans
    const studentLoanBalance = Math.max(0, Number(user.studentLoans) || 0);
    const studentLoanAnnual = (studentLoanBalance > 0 && !user.isStudent && (user.age || 0) >= 18)
        ? Math.min(2400, studentLoanBalance)
        : 0;
    const studentLoanMonthly = Math.round(studentLoanAnnual / 12);
    if (studentLoanBalance > 0) {
        expenseItems.push({
            id: 'student_loans',
            label: 'Student Loan Repayment',
            sublabel: user.isStudent ? 'Deferred while enrolled' : `$${studentLoanBalance.toLocaleString()} remaining`,
            icon: 'fa-graduation-cap',
            color: 'text-rose-400',
            monthly: studentLoanMonthly,
            annual: studentLoanAnnual,
            active: studentLoanMonthly > 0
        });
    }

    // 2.6 Diet & Gym Membership
    const healthAnnual = calculateActiveHealthCosts(user);
    const healthMonthly = Math.round(healthAnnual / 12);
    const dietKey = user.diet || (user.hasBetterDiet ? 'balanced' : 'junk');
    const dietPlan = getDietPlan(dietKey);
    const dietSubparts = [];
    if (dietPlan && dietPlan.monthlyCost > 0) dietSubparts.push(`${dietPlan.name} ($${dietPlan.monthlyCost}/mo)`);
    if (user.gymMembership) dietSubparts.push('Gym ($50/mo)');
    expenseItems.push({
        id: 'diet_gym',
        label: 'Diet & Gym',
        sublabel: dietSubparts.length > 0 ? dietSubparts.join(' • ') : `${dietPlan.name} ($0/mo)`,
        icon: 'fa-dumbbell',
        color: 'text-rose-400',
        monthly: healthMonthly,
        annual: healthAnnual,
        active: healthMonthly > 0
    });

    // 2.7 Child Support / Child Expenses ($500/mo per child under 21)
    const childrenUnder21 = relationships.filter(r =>
        (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') &&
        typeof r.age === 'number' && r.age < 21
    );
    const childMonthly = calculateChildMonthlyOutflow(relationships);
    const childAnnual = childMonthly * 12;
    expenseItems.push({
        id: 'child_support',
        label: 'Child Support & Care',
        sublabel: childrenUnder21.length > 0
            ? `${childrenUnder21.length} ${childrenUnder21.length === 1 ? 'Child' : 'Children'} under 21 ($500/mo each)`
            : 'No Dependent Children under 21',
        icon: 'fa-baby',
        color: 'text-rose-400',
        monthly: childMonthly,
        annual: childAnnual,
        active: childMonthly > 0
    });

    // 2.8 Asset Insurance (Vehicles & Jewelry)
    let insuranceMonthly = 0;
    let insuredCount = 0;
    assets.forEach(asset => {
        if (!asset || !asset.insured) return;
        if (asset.category === 'vehicle') {
            const annualFee = Math.max(20, Math.floor((asset.value || 0) * 0.008));
            insuranceMonthly += Math.round(annualFee / 12);
            insuredCount++;
        } else if (asset.category === 'jewelry') {
            const annualFee = Math.max(10, Math.floor((asset.value || 0) * 0.005));
            insuranceMonthly += Math.round(annualFee / 12);
            insuredCount++;
        }
    });
    const insuranceAnnual = insuranceMonthly * 12;
    if (insuredCount > 0) {
        expenseItems.push({
            id: 'insurance',
            label: 'Asset Insurance Policies',
            sublabel: `${insuredCount} Insured ${insuredCount === 1 ? 'Asset' : 'Assets'}`,
            icon: 'fa-shield-halved',
            color: 'text-rose-400',
            monthly: insuranceMonthly,
            annual: insuranceAnnual,
            active: insuranceMonthly > 0
        });
    }

    // Totals (outflow reuses the canonical engine so ledger never drifts from the header)
    const coreMonthlyIncome = calculateUserMonthlyIncome(user);
    const totalMonthlyIncome = incomeItems.reduce((sum, item) => sum + item.monthly, 0);
    const totalAnnualIncome = incomeItems.reduce((sum, item) => sum + item.annual, 0);

    const totalMonthlyOutflow = calculateUserMonthlyOutflow(user) + taxesMonthly;
    const totalAnnualOutflow = totalMonthlyOutflow * 12;

    const netMonthly = totalMonthlyIncome - totalMonthlyOutflow;
    const netAnnual = totalAnnualIncome - totalAnnualOutflow;

    // ─── 3. NET WORTH: ASSETS & LIABILITIES ───────────────────────────────────
    const cash = Number(user.money) || 0;
    const properties = assets.filter(a => a && a.category === 'property');
    const vehicles = assets.filter(a => a && a.category === 'vehicle');
    const jewelry = assets.filter(a => a && a.category === 'jewelry');

    const propGrossVal = properties.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
    const propDebt = properties.reduce((sum, p) => sum + (Number(p.mortgage?.remainingBalance) || 0), 0);
    const propEquity = propGrossVal - propDebt;

    const vehGrossVal = vehicles.reduce((sum, v) => sum + (Number(v.value) || 0), 0);
    const vehDebt = vehicles.reduce((sum, v) => sum + (Number(v.loan?.remainingBalance) || 0), 0);
    const vehEquity = vehGrossVal - vehDebt;

    const jewelryVal = jewelry.reduce((sum, j) => sum + (Number(j.value) || 0), 0);
    const businessCash = (user.hasBusiness && Number(user.compCash) > 0) ? Number(user.compCash) : 0;

    let stockPortfolioVal = 0;
    if (user.investments && Array.isArray(user.investments.stockMarket) && user.investments.stocks) {
        user.investments.stockMarket.forEach(stock => {
            const holding = user.investments.stocks[stock.symbol];
            if (holding && holding.shares > 0) {
                stockPortfolioVal += Math.round(holding.shares * stock.price);
            }
        });
    }

    const assetItems = [
        { id: 'cash', label: 'Bank Balance (Liquid Cash)', sublabel: 'Checking Account', icon: 'fa-wallet', color: 'text-emerald-400', value: Math.max(0, cash) },
        { id: 'savings', label: 'High-Yield Savings', sublabel: '3.5% APY Account', icon: 'fa-piggy-bank', color: 'text-cyan-400', value: savingsBalance },
        { id: 'stocks', label: 'Stock Market Portfolio', sublabel: 'Equities & Shares', icon: 'fa-chart-line', color: 'text-purple-400', value: stockPortfolioVal },
        {
            id: 'real_estate',
            label: 'Real Estate Value',
            sublabel: `${properties.length} ${properties.length === 1 ? 'Property' : 'Properties'} (Equity: $${propEquity.toLocaleString()})`,
            icon: 'fa-building',
            color: 'text-amber-400',
            value: propGrossVal,
            equity: propEquity
        },
        {
            id: 'vehicles',
            label: 'Vehicles Value',
            sublabel: `${vehicles.length} ${vehicles.length === 1 ? 'Vehicle' : 'Vehicles'} (Equity: $${vehEquity.toLocaleString()})`,
            icon: 'fa-car',
            color: 'text-blue-400',
            value: vehGrossVal,
            equity: vehEquity
        },
        {
            id: 'jewelry',
            label: 'Jewelry & Collectibles',
            sublabel: `${jewelry.length} ${jewelry.length === 1 ? 'Item' : 'Items'}`,
            icon: 'fa-gem',
            color: 'text-pink-400',
            value: jewelryVal
        }
    ];

    if (user.hasBusiness || businessCash > 0) {
        assetItems.push({
            id: 'business_cash',
            label: `Company Treasury (${user.companyName || 'Business'})`,
            sublabel: 'Liquid Corporate Cash',
            icon: 'fa-briefcase',
            color: 'text-indigo-400',
            value: businessCash
        });
    }

    const liabilityItems = [];
    if (cash < 0) {
        liabilityItems.push({
            id: 'bank_overdraft',
            label: 'Bank Overdraft / Negative Balance',
            sublabel: 'Account Deficit',
            icon: 'fa-triangle-exclamation',
            color: 'text-rose-400',
            value: Math.abs(cash)
        });
    }
    if (propDebt > 0) {
        liabilityItems.push({
            id: 'mortgage_debt',
            label: 'Mortgage Balances',
            sublabel: `${mortgagedProperties.length} Active ${mortgagedProperties.length === 1 ? 'Loan' : 'Loans'}`,
            icon: 'fa-file-invoice-dollar',
            color: 'text-rose-400',
            value: propDebt
        });
    }
    if (vehDebt > 0) {
        liabilityItems.push({
            id: 'auto_loan_debt',
            label: 'Auto Loan Balances',
            sublabel: `${financedVehicles.length} Financed ${financedVehicles.length === 1 ? 'Vehicle' : 'Vehicles'}`,
            icon: 'fa-car-burst',
            color: 'text-rose-400',
            value: vehDebt
        });
    }
    if (studentLoanBalance > 0) {
        liabilityItems.push({
            id: 'student_loan_debt',
            label: 'Student Loans',
            sublabel: user.isStudent ? 'In-School Deferment' : 'Active Repayment ($200/mo)',
            icon: 'fa-graduation-cap',
            color: 'text-rose-400',
            value: studentLoanBalance
        });
    }

    const totalAssets = Math.max(0, cash) + savingsBalance + stockPortfolioVal + propGrossVal + vehGrossVal + jewelryVal + businessCash;
    const totalLiabilities = (cash < 0 ? Math.abs(cash) : 0) + propDebt + vehDebt + studentLoanBalance;
    const totalNetWorth = totalAssets - totalLiabilities;

    return {
        cashflow: {
            incomeItems,
            expenseItems,
            coreMonthlyIncome,
            monthlyIncome: totalMonthlyIncome,
            annualIncome: totalAnnualIncome,
            monthlyOutflow: totalMonthlyOutflow,
            annualOutflow: totalAnnualOutflow,
            netMonthly,
            netAnnual
        },
        netWorth: {
            assetItems,
            liabilityItems,
            cash,
            savingsBalance,
            stockPortfolioVal,
            propGrossVal,
            propDebt,
            propEquity,
            vehGrossVal,
            vehDebt,
            vehEquity,
            jewelryVal,
            businessCash,
            studentLoanBalance,
            totalAssets,
            totalLiabilities,
            netWorth: totalNetWorth
        }
    };
}
