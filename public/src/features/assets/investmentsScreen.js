import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { saveGame } from '../../core/main.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';

const get = id => document.getElementById(id);
let activeTab = 'stocks'; // 'stocks' | 'savings' | 'blogs'
let stockFilter = 'all'; // 'all' | 'owned'

export function renderInvestmentsScreen(tabName, filterName) {
    const user = state.gameState.user;
    if (tabName && typeof tabName === 'string') {
        activeTab = tabName;
    }
    if (filterName && typeof filterName === 'string') {
        stockFilter = filterName;
    }

    // Ensure investments state structure
    GameLogic.ensureInvestmentState(user);

    // Calculate Portfolio Values
    const savingsBalance = user.investments.savings || 0;
    
    let totalStockValue = 0;
    let totalStockCost = 0;
    let ownedCompaniesCount = 0;

    user.investments.stockMarket.forEach(stock => {
        const holding = user.investments.stocks[stock.symbol];
        if (holding && holding.shares > 0) {
            totalStockValue += Math.round(holding.shares * stock.price);
            totalStockCost += holding.totalCost || 0;
            ownedCompaniesCount++;
        }
    });

    const netPortfolioValue = savingsBalance + totalStockValue;
    const totalProfitLoss = totalStockValue - totalStockCost;
    const isProfitable = totalProfitLoss >= 0;

    get('game-container').innerHTML = `
        <div class="fade-in flex flex-col h-full max-w-lg mx-auto">
            <!-- Header Nav -->
            <div class="mb-4 flex items-center justify-between">
                <button data-action="renderAssets" class="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition">
                    <i class="fas fa-arrow-left"></i> Back to Assets
                </button>
                <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Financial Markets</span>
            </div>

            <!-- Portfolio Overview Card -->
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700 shadow-xl mb-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Portfolio Value</span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-bold ${isProfitable ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-red-900/60 text-red-300 border border-red-700'}">
                        ${isProfitable ? '+' : ''}${Utils.formatMoney(totalProfitLoss)} P&L
                    </span>
                </div>
                <div class="text-3xl font-extrabold text-white mb-4">${Utils.formatMoney(netPortfolioValue)}</div>

                <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/80 text-center">
                    <div>
                        <div class="text-[10px] text-slate-400 uppercase font-semibold">Cash Liquid</div>
                        <div class="text-emerald-400 font-bold text-xs mt-0.5">${Utils.formatMoney(user.money)}</div>
                    </div>
                    <div class="border-x border-slate-700 px-1">
                        <div class="text-[10px] text-slate-400 uppercase font-semibold">High-Yield Savings</div>
                        <div class="text-cyan-400 font-bold text-xs mt-0.5">${Utils.formatMoney(savingsBalance)}</div>
                    </div>
                    <div data-action="setStockFilter" data-args="'owned'" class="cursor-pointer hover:bg-slate-750/80 rounded p-0.5 transition group" title="Click to view owned companies">
                        <div class="text-[10px] text-slate-400 uppercase font-semibold group-hover:text-purple-300 flex items-center justify-center gap-1">
                            Stock Holdings <i class="fas fa-chevron-right text-[8px]"></i>
                        </div>
                        <div class="text-purple-400 font-bold text-xs mt-0.5">${Utils.formatMoney(totalStockValue)}</div>
                    </div>
                </div>
            </div>

            <!-- Navigation Tabs -->
            <div class="flex bg-slate-900 p-1 rounded-xl mb-4 border border-slate-700 text-xs gap-1">
                <button data-action="switchInvestmentTab" data-args="'stocks'" class="flex-1 py-2 rounded-lg font-bold text-center transition ${activeTab === 'stocks' ? 'bg-slate-800 text-emerald-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-chart-line mr-1"></i> Stock Market
                </button>
                <button data-action="switchInvestmentTab" data-args="'savings'" class="flex-1 py-2 rounded-lg font-bold text-center transition ${activeTab === 'savings' ? 'bg-slate-800 text-cyan-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-piggy-bank mr-1"></i> Savings (3.5%)
                </button>
                <button data-action="switchInvestmentTab" data-args="'blogs'" class="flex-1 py-2 rounded-lg font-bold text-center transition ${activeTab === 'blogs' ? 'bg-slate-800 text-amber-400 border border-slate-600 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-newspaper mr-1"></i> Market Blogs
                </button>
            </div>

            <!-- Tab Content Area -->
            <div class="flex-1 overflow-y-auto pb-6">
                ${activeTab === 'stocks' ? renderStocksTab(user, ownedCompaniesCount, totalStockValue, totalStockCost) : ''}
                ${activeTab === 'savings' ? renderSavingsTab(user) : ''}
                ${activeTab === 'blogs' ? renderBlogsTab(user) : ''}
            </div>
        </div>
    `;
}

export function switchInvestmentTab(tab) {
    activeTab = tab;
    renderInvestmentsScreen();
}

export function setStockFilter(filter) {
    activeTab = 'stocks';
    stockFilter = filter;
    renderInvestmentsScreen();
}

// --- TAB 1: STOCK MARKET ---
const SECTORS_ORDER = [
    { name: 'Technology', icon: 'fa-microchip', color: 'text-cyan-400' },
    { name: 'Cybersecurity', icon: 'fa-shield-halved', color: 'text-indigo-400' },
    { name: 'Healthcare & Biotech', icon: 'fa-dna', color: 'text-emerald-400' },
    { name: 'Financials', icon: 'fa-building-columns', color: 'text-amber-400' },
    { name: 'Renewable Energy', icon: 'fa-sun', color: 'text-yellow-400' },
    { name: 'Energy', icon: 'fa-oil-well', color: 'text-orange-400' },
    { name: 'Consumer Goods', icon: 'fa-cart-shopping', color: 'text-blue-400' },
    { name: 'Aerospace & Defense', icon: 'fa-rocket', color: 'text-purple-400' },
    { name: 'Entertainment', icon: 'fa-gamepad', color: 'text-pink-400' }
];

function renderStocksTab(user, ownedCompaniesCount, totalStockValue, totalStockCost) {
    const market = user.investments.stockMarket || [];

    const filterToolbar = `
        <div class="flex items-center justify-between mb-4 px-1">
            <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs w-full">
                <button data-action="setStockFilter" data-args="'all'" class="flex-1 py-1.5 rounded-lg font-bold text-center transition ${stockFilter === 'all' ? 'bg-slate-800 text-white shadow border border-slate-600' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-globe mr-1 text-cyan-400"></i> All Companies (${market.length})
                </button>
                <button data-action="setStockFilter" data-args="'owned'" class="flex-1 py-1.5 rounded-lg font-bold text-center transition flex items-center justify-center gap-1.5 ${stockFilter === 'owned' ? 'bg-purple-900/80 text-purple-200 border border-purple-700 shadow' : 'text-slate-400 hover:text-white'}">
                    <i class="fas fa-briefcase text-purple-400"></i> My Portfolio (${ownedCompaniesCount})
                </button>
            </div>
        </div>
    `;

    if (stockFilter === 'owned' && ownedCompaniesCount === 0) {
        return filterToolbar + `
            <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center text-slate-400 my-4 shadow-lg">
                <div class="w-14 h-14 rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center text-purple-400 text-2xl mx-auto mb-3">
                    <i class="fas fa-briefcase"></i>
                </div>
                <h4 class="font-bold text-white text-base mb-1">No Active Stock Holdings</h4>
                <p class="text-xs text-slate-400 mb-4 max-w-xs mx-auto">You haven't invested in any companies yet. Explore the market sectors below to build your stock portfolio!</p>
                <button data-action="setStockFilter" data-args="'all'" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow">
                    Browse All Market Companies
                </button>
            </div>
        `;
    }

    const portfolioHeader = (stockFilter === 'owned' && ownedCompaniesCount > 0) ? `
        <div class="bg-gradient-to-r from-purple-950/60 to-slate-900 p-3.5 rounded-xl border border-purple-800/60 mb-4 flex items-center justify-between text-xs shadow-md">
            <div>
                <div class="text-purple-300 font-extrabold uppercase tracking-wider text-[10px]">Active Portfolio Breakdown</div>
                <div class="text-slate-300 text-xs mt-0.5">Holding <strong class="text-white">${ownedCompaniesCount} Companies</strong> • Cost Basis: <strong>${Utils.formatMoney(totalStockCost)}</strong></div>
            </div>
            <div class="text-right font-extrabold">
                <div class="text-purple-200">Value: ${Utils.formatMoney(totalStockValue)}</div>
                <div class="${totalStockValue >= totalStockCost ? 'text-emerald-400' : 'text-red-400'} text-[11px]">
                    ${totalStockValue >= totalStockCost ? '+' : ''}${Utils.formatMoney(totalStockValue - totalStockCost)} Return
                </div>
            </div>
        </div>
    ` : '';

    const sectorsHtml = SECTORS_ORDER.map(sectorInfo => {
        let sectorStocks = market.filter(s => s.sector === sectorInfo.name);
        if (stockFilter === 'owned') {
            sectorStocks = sectorStocks.filter(s => (user.investments.stocks[s.symbol]?.shares || 0) > 0);
        }
        if (sectorStocks.length === 0) return '';

        const stocksHtml = sectorStocks.map(stock => {
            const holding = user.investments.stocks[stock.symbol] || { shares: 0, totalCost: 0 };
            const ownedShares = holding.shares;
            const ownedValue = Math.round(ownedShares * stock.price);
            
            const prev = stock.prevPrice || stock.basePrice || stock.price;
            const changeAmt = stock.price - prev;
            const changePct = prev > 0 ? ((changeAmt / prev) * 100).toFixed(1) : '0.0';
            const isUp = changeAmt >= 0;

            return `
                <div class="bg-slate-800 hover:bg-slate-750 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-2 mb-2 transition shadow-sm">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <div class="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-sm border border-slate-700 shrink-0">
                            <i class="fas ${stock.icon} ${stock.color}"></i>
                        </div>
                        <div class="truncate">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="font-bold text-white text-xs truncate">${stock.name}</span>
                                <span class="bg-slate-900 text-slate-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 font-bold">${stock.symbol}</span>
                                ${ownedShares > 0 ? `<span class="bg-purple-900/80 text-purple-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-700">${ownedShares} owned</span>` : ''}
                            </div>
                            <div class="text-[10px] text-slate-400 truncate mt-0.5">
                                ${stock.dividendYield > 0 ? (stock.dividendYield * 100).toFixed(1) + '% Yield' : 'No Dividend'}
                                ${ownedShares > 0 ? ` • <span class="text-purple-300 font-semibold">Valued ${Utils.formatMoney(ownedValue)}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="text-right shrink-0 px-1">
                        <div class="text-white font-extrabold text-xs">${Utils.formatMoney(stock.price)}</div>
                        <div class="text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'} flex items-center justify-end gap-0.5">
                            <i class="fas ${isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-[9px]"></i>
                            ${isUp ? '+' : ''}${changePct}%
                        </div>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                        <button data-action="openStockDetailsModal" data-args="'${stock.symbol}'" title="Chart & Info" class="bg-slate-900 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded-lg flex items-center justify-center text-xs border border-slate-700 transition">
                            <i class="fas fa-chart-line text-blue-400"></i>
                        </button>
                        <button data-action="openBuyStockModal" data-args="'${stock.symbol}'" class="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2 py-1 rounded-lg transition">
                            Buy
                        </button>
                        <button data-action="openSellStockModal" data-args="'${stock.symbol}'" ${ownedShares > 0 ? '' : 'disabled'} class="${ownedShares > 0 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} text-[11px] font-bold px-2 py-1 rounded-lg transition">
                            Sell
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="mb-4">
                <div class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <i class="fas ${sectorInfo.icon} ${sectorInfo.color}"></i> ${sectorInfo.name}
                </div>
                <div>
                    ${stocksHtml}
                </div>
            </div>
        `;
    }).join('');

    return filterToolbar + portfolioHeader + sectorsHtml;
}

// --- TAB 2: HIGH-YIELD SAVINGS ACCOUNT ---
function renderSavingsTab(user) {
    const savings = user.investments.savings || 0;
    const estAnnualInterest = Math.floor(savings * 0.035);

    return `
        <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center mb-6">
            <div class="w-16 h-16 rounded-full bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 text-2xl shadow-lg">
                <i class="fas fa-piggy-bank"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-1">Standard High-Yield Savings</h3>
            <p class="text-slate-400 text-xs max-w-xs mx-auto mb-4">Risk-free guaranteed compound return backed by global banking reserve regulations.</p>

            <div class="inline-block bg-cyan-900/40 border border-cyan-500/40 rounded-full px-4 py-1 text-cyan-300 font-extrabold text-sm mb-6">
                ⚡ 3.5% APY Annual Interest
            </div>

            <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 max-w-sm mx-auto mb-6 text-left space-y-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-400 font-medium">Current Balance</span>
                    <span class="text-white font-extrabold text-lg">${Utils.formatMoney(savings)}</span>
                </div>
                <div class="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                    <span class="text-slate-400">Est. Next Year Payout (3.5%)</span>
                    <span class="text-emerald-400 font-bold">+${Utils.formatMoney(estAnnualInterest)}</span>
                </div>
            </div>

            <div class="flex items-center justify-center gap-3 max-w-sm mx-auto">
                <button data-action="openDepositSavingsModal" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow">
                    <i class="fas fa-plus-circle"></i> Deposit Funds
                </button>
                <button data-action="openWithdrawSavingsModal" ${savings > 0 ? '' : 'disabled'} class="flex-1 ${savings > 0 ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow">
                    <i class="fas fa-minus-circle"></i> Withdraw Funds
                </button>
            </div>
        </div>
    `;
}

// --- TAB 3: INVESTMENT BLOGS & NEWS ---
function renderBlogsTab(user) {
    const blogs = user.investments.blogPosts || [];

    if (blogs.length === 0) {
        return `
            <div class="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center text-slate-400">
                <i class="fas fa-newspaper text-3xl text-slate-600 mb-2"></i>
                <p class="text-sm">No investment blog posts available right now. Check back next year!</p>
            </div>
        `;
    }

    return `
        <div class="mb-3 flex items-center justify-between px-1">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Market Insider Blogs</span>
            <span class="text-[11px] text-amber-400 font-semibold"><i class="fas fa-lightbulb mr-1"></i> Read for future market hints</span>
        </div>

        <div class="space-y-4">
            ${blogs.map(post => {
                return `
                    <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-purple-400">${post.author}</span>
                                <span class="text-slate-500 text-[10px]">• ${post.sector}</span>
                            </div>
                        </div>

                        <h4 class="font-bold text-white text-base mb-1.5 leading-snug">${post.title}</h4>
                        <p class="text-slate-300 text-xs leading-relaxed mb-3">${post.excerpt}</p>

                        <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-750 flex items-center justify-between text-xs">
                            <div class="text-slate-400">
                                Hinted Target: <strong class="text-amber-300 font-bold">${post.stockName} (${post.symbol})</strong>
                            </div>
                            <button data-action="openBuyStockModal" data-args="'${post.symbol}'" class="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-600 px-2.5 py-1 rounded font-bold transition">
                                Trade ${post.symbol}
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// --- MODALS FOR STOCK TRADING & SAVINGS ---

export function openStockDetailsModal(symbol) {
    const user = state.gameState.user;
    const stock = (user.investments.stockMarket || []).find(s => s.symbol === symbol);
    if (!stock) return;

    const history = stock.priceHistory || [stock.price];
    const minPrice = Math.min(...history);
    const maxPrice = Math.max(...history);
    const holding = (user.investments.stocks || {})[symbol] || { shares: 0, totalCost: 0 };

    const modalHTML = `
        <div class="space-y-4 text-left">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 text-xl shrink-0">
                    <i class="fas ${stock.icon} ${stock.color}"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white text-lg">${stock.name} (${stock.symbol})</h3>
                    <div class="text-xs text-slate-400">${stock.sector} • ${stock.dividendYield > 0 ? (stock.dividendYield * 100).toFixed(1) + '% Dividend' : 'No Dividend'}</div>
                </div>
            </div>

            <p class="text-slate-300 text-xs leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-700">${stock.desc}</p>

            <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Recent Price History Trend</div>
                <div class="flex items-end justify-between gap-1 h-20 pt-2 border-b border-slate-800 pb-1">
                    ${history.map(p => {
                        const heightPct = Math.max(15, Math.min(100, ((p - minPrice * 0.8) / (maxPrice * 1.1 - minPrice * 0.8)) * 100));
                        return `
                            <div class="flex-1 flex flex-col items-center gap-1 group">
                                <div class="w-full bg-purple-500/60 group-hover:bg-purple-400 rounded-t transition-all" style="height: ${heightPct}%"></div>
                                <span class="text-[9px] text-slate-500 font-mono">${Utils.formatMoney(p)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>Low: <strong class="text-red-400">${Utils.formatMoney(minPrice)}</strong></span>
                    <span>High: <strong class="text-emerald-400">${Utils.formatMoney(maxPrice)}</strong></span>
                </div>
            </div>

            ${holding.shares > 0 ? `
                <div class="bg-purple-900/30 p-3 rounded-xl border border-purple-700/50 flex justify-between items-center text-xs">
                    <div>
                        <div class="text-purple-300 font-bold">Your Position</div>
                        <div class="text-slate-300">${holding.shares} shares @ avg ${Utils.formatMoney(holding.totalCost / holding.shares)}</div>
                    </div>
                    <div class="text-right font-extrabold text-white">
                        Value: ${Utils.formatMoney(holding.shares * stock.price)}
                    </div>
                </div>
            ` : ''}

            <div class="flex gap-2 pt-2">
                <button data-action="openBuyStockModal" data-args="'${stock.symbol}'" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition text-sm">
                    Buy ${stock.symbol}
                </button>
                ${holding.shares > 0 ? `
                    <button data-action="openSellStockModal" data-args="'${stock.symbol}'" class="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition text-sm">
                        Sell ${stock.symbol}
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    UI.showModal(`${stock.name} Stock Overview`, modalHTML);
}

export function openBuyStockModal(symbol) {
    const user = state.gameState.user;
    const stock = (user.investments.stockMarket || []).find(s => s.symbol === symbol);
    if (!stock) return;

    const maxAffordable = Math.floor(user.money / stock.price);

    const modalHTML = `
        <div class="space-y-4 text-left">
            <div class="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                <div>
                    <h4 class="font-bold text-white text-base">${stock.name} (${stock.symbol})</h4>
                    <div class="text-xs text-slate-400">Current Share Price</div>
                </div>
                <div class="text-right font-extrabold text-emerald-400 text-lg">${Utils.formatMoney(stock.price)}</div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Number of Shares</label>
                <input type="number" id="inp-buy-shares" value="1" min="1" max="${Math.max(1, maxAffordable)}" class="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-center font-bold text-lg outline-none focus:border-emerald-500">
            </div>

            <div class="flex gap-2">
                <button onclick="document.getElementById('inp-buy-shares').value = 1" class="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">1 Share</button>
                <button onclick="document.getElementById('inp-buy-shares').value = 10" class="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">10 Shares</button>
                <button onclick="document.getElementById('inp-buy-shares').value = ${Math.max(1, maxAffordable)}" class="flex-1 bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs py-1.5 rounded-lg font-bold border border-slate-700">Max (${maxAffordable})</button>
            </div>

            <div class="text-xs text-slate-400 flex justify-between px-1">
                <span>Liquid Cash Available:</span>
                <strong class="text-white">${Utils.formatMoney(user.money)}</strong>
            </div>

            <button data-action="confirmBuyStock" data-args="'${stock.symbol}'" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-base shadow transition">
                Confirm Purchase
            </button>
        </div>
    `;

    UI.showModal(`Buy ${stock.symbol} Shares`, modalHTML);
}

export function confirmBuyStock(symbol) {
    const user = state.gameState.user;
    const inp = get('inp-buy-shares');
    if (!inp) return;

    const shares = parseInt(inp.value, 10);
    const result = GameLogic.buyStock(user, symbol, shares);

    UI.hideModal();
    if (result.success) {
        saveGame();
        UI.showModal('Trade Executed', `<p class="text-emerald-400 font-bold">${result.msg}</p>`);
    } else {
        UI.showModal('Trade Failed', `<p class="text-red-400 font-bold">${result.msg}</p>`);
    }

    renderInvestmentsScreen();
}

export function openSellStockModal(symbol) {
    const user = state.gameState.user;
    const holding = (user.investments.stocks || {})[symbol];
    const stock = (user.investments.stockMarket || []).find(s => s.symbol === symbol);
    if (!holding || !stock) return;

    const ownedShares = holding.shares;

    const modalHTML = `
        <div class="space-y-4 text-left">
            <div class="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                <div>
                    <h4 class="font-bold text-white text-base">${stock.name} (${stock.symbol})</h4>
                    <div class="text-xs text-slate-400">Current Selling Price</div>
                </div>
                <div class="text-right font-extrabold text-purple-300 text-lg">${Utils.formatMoney(stock.price)}</div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Shares to Sell (Owned: ${ownedShares})</label>
                <input type="number" id="inp-sell-shares" value="1" min="1" max="${ownedShares}" class="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-center font-bold text-lg outline-none focus:border-purple-500">
            </div>

            <div class="flex gap-2">
                <button onclick="document.getElementById('inp-sell-shares').value = 1" class="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">1 Share</button>
                <button onclick="document.getElementById('inp-sell-shares').value = Math.max(1, Math.floor(${ownedShares} / 2))" class="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">50%</button>
                <button onclick="document.getElementById('inp-sell-shares').value = ${ownedShares}" class="flex-1 bg-slate-800 hover:bg-slate-750 text-purple-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">Sell All (${ownedShares})</button>
            </div>

            <button data-action="confirmSellStock" data-args="'${stock.symbol}'" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl text-base shadow transition">
                Confirm Sale
            </button>
        </div>
    `;

    UI.showModal(`Sell ${stock.symbol} Shares`, modalHTML);
}

export function confirmSellStock(symbol) {
    const user = state.gameState.user;
    const inp = get('inp-sell-shares');
    if (!inp) return;

    const shares = parseInt(inp.value, 10);
    const result = GameLogic.sellStock(user, symbol, shares);

    UI.hideModal();
    if (result.success) {
        saveGame();
        UI.showModal('Trade Executed', `<p class="text-purple-300 font-bold">${result.msg}</p>`);
    } else {
        UI.showModal('Trade Failed', `<p class="text-red-400 font-bold">${result.msg}</p>`);
    }

    renderInvestmentsScreen();
}

export function openDepositSavingsModal() {
    const user = state.gameState.user;

    const modalHTML = `
        <div class="space-y-4 text-left">
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Deposit Amount ($)</label>
                <input type="number" id="inp-deposit-amt" value="1000" min="100" max="${user.money}" class="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-center font-bold text-lg outline-none focus:border-emerald-500">
            </div>

            <div class="grid grid-cols-4 gap-1.5">
                <button onclick="document.getElementById('inp-deposit-amt').value = 500" class="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">$500</button>
                <button onclick="document.getElementById('inp-deposit-amt').value = 2500" class="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">$2.5k</button>
                <button onclick="document.getElementById('inp-deposit-amt').value = 10000" class="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">$10k</button>
                <button onclick="document.getElementById('inp-deposit-amt').value = ${user.money}" class="bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs py-1.5 rounded-lg font-bold border border-slate-700">Max</button>
            </div>

            <div class="text-xs text-slate-400 flex justify-between px-1">
                <span>Available Cash:</span>
                <strong class="text-white">${Utils.formatMoney(user.money)}</strong>
            </div>

            <button data-action="confirmDepositSavings" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-base shadow transition">
                Confirm Deposit
            </button>
        </div>
    `;

    UI.showModal('Deposit into High-Yield Savings', modalHTML);
}

export function confirmDepositSavings() {
    const user = state.gameState.user;
    const inp = get('inp-deposit-amt');
    if (!inp) return;

    const amt = parseInt(inp.value, 10);
    const result = GameLogic.depositSavings(user, amt);

    UI.hideModal();
    if (result.success) {
        saveGame();
        UI.showModal('Deposit Complete', `<p class="text-emerald-400 font-bold">${result.msg}</p>`);
    } else {
        UI.showModal('Deposit Failed', `<p class="text-red-400 font-bold">${result.msg}</p>`);
    }

    renderInvestmentsScreen('savings');
}

export function openWithdrawSavingsModal() {
    const user = state.gameState.user;
    const savings = user.investments?.savings || 0;

    const modalHTML = `
        <div class="space-y-4 text-left">
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Withdraw Amount ($)</label>
                <input type="number" id="inp-withdraw-amt" value="${Math.min(1000, savings)}" min="100" max="${savings}" class="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-center font-bold text-lg outline-none focus:border-cyan-500">
            </div>

            <div class="grid grid-cols-4 gap-1.5">
                <button onclick="document.getElementById('inp-withdraw-amt').value = 500" class="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">$500</button>
                <button onclick="document.getElementById('inp-withdraw-amt').value = 2500" class="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">$2.5k</button>
                <button onclick="document.getElementById('inp-withdraw-amt').value = 10000" class="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded-lg font-bold border border-slate-700">$10k</button>
                <button onclick="document.getElementById('inp-withdraw-amt').value = ${savings}" class="bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs py-1.5 rounded-lg font-bold border border-slate-700">Withdraw All</button>
            </div>

            <div class="text-xs text-slate-400 flex justify-between px-1">
                <span>Savings Balance:</span>
                <strong class="text-cyan-400">${Utils.formatMoney(savings)}</strong>
            </div>

            <button data-action="confirmWithdrawSavings" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl text-base shadow transition">
                Confirm Withdrawal
            </button>
        </div>
    `;

    UI.showModal('Withdraw from Savings', modalHTML);
}

export function confirmWithdrawSavings() {
    const user = state.gameState.user;
    const inp = get('inp-withdraw-amt');
    if (!inp) return;

    const amt = parseInt(inp.value, 10);
    const result = GameLogic.withdrawSavings(user, amt);

    UI.hideModal();
    if (result.success) {
        saveGame();
        UI.showModal('Withdrawal Complete', `<p class="text-cyan-300 font-bold">${result.msg}</p>`);
    } else {
        UI.showModal('Withdrawal Failed', `<p class="text-red-400 font-bold">${result.msg}</p>`);
    }

    renderInvestmentsScreen('savings');
}
