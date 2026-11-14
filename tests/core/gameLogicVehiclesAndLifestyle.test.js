import { jest } from '@jest/globals';

jest.unstable_mockModule('../../public/src/features/player/mainScreen.js', () => ({
    addLog: jest.fn(),
    renderLifeDashboard: jest.fn(),
    renderDeathScreen: jest.fn(),
    showFullEulogy: jest.fn(),
    continueAsChild: jest.fn(),
    ageUp: jest.fn()
}));

jest.unstable_mockModule('../../public/src/ui/ui.js', () => ({
    UI: {
        renderScreen: jest.fn(),
        updateHeader: jest.fn(),
        showModal: jest.fn()
    }
}));

const { GameLogic } = await import('../../public/src/core/gameLogic.js');


describe('Blackjack Logic', () => {
    test('calculateBlackjackHand handles aces correctly', () => {
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'K'}])).toBe(21);
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'A'}, {value: '9'}])).toBe(21);
        expect(GameLogic.calculateBlackjackHand([{value: 'A'}, {value: 'A'}, {value: 'K'}])).toBe(12);
        expect(GameLogic.calculateBlackjackHand([{value: '10'}, {value: '5'}, {value: 'A'}])).toBe(16);
    });

    test('calculateBlackjackHand handles numbers and face cards', () => {
        expect(GameLogic.calculateBlackjackHand([{value: '2'}, {value: '3'}])).toBe(5);
        expect(GameLogic.calculateBlackjackHand([{value: 'J'}, {value: 'Q'}, {value: 'K'}])).toBe(30);
    });

    test('determineBlackjackOutcome works correctly', () => {
        // Player bust
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}, {value: '5'}], [{value: '10'}])).toBe('bust');
        // Dealer bust
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '10'}, {value: '5'}])).toBe('win');
        // Push
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '10'}])).toBe('push');
        // Player win
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '10'}], [{value: '10'}, {value: '9'}])).toBe('win');
        // Player lose
        expect(GameLogic.determineBlackjackOutcome([{value: '10'}, {value: '9'}], [{value: '10'}, {value: '10'}])).toBe('lose');
    });
});

describe('calculateTripOutcome', () => {
    test('returns correct base values and modifies based on roll', () => {
        // Roll 0 -> first event (0 health, 0 money)
        const local = GameLogic.calculateTripOutcome(1, 0.0);
        expect(local.cost).toBe(500);
        expect(local.healthChange).toBe(5);
        expect(local.moneyChange).toBe(0);
        
        // Roll to hit the attack event (index 2 -> requires roll around 0.3)
        const attack = GameLogic.calculateTripOutcome(3, 0.3); // 0.3 * 8 = 2.4 => index 2
        expect(attack.cost).toBe(10000);
        expect(attack.healthChange).toBe(15 - 20); // base 15, event -20 => -5
        expect(attack.moneyChange).toBe(0);
    });
});

describe('Vehicle System Revamp', () => {
    test('calculateAutoLoan returns down payment, principal, and monthly payment', () => {
        const loan = GameLogic.calculateAutoLoan(30000, 0.15, 4);
        expect(loan.price).toBe(30000);
        expect(loan.downPayment).toBe(4500); // 15% of 30k
        expect(loan.principal).toBe(25500);
        expect(loan.monthlyPayment).toBeGreaterThan(500);
    });

    test('calculateAutoLoan sanitizes 0 or negative termYears to prevent division by zero', () => {
        const loanZeroYears = GameLogic.calculateAutoLoan(30000, 0.15, 0);
        expect(Number.isFinite(loanZeroYears.monthlyPayment)).toBe(true);
        expect(loanZeroYears.monthlyPayment).not.toBe(Infinity);
        expect(loanZeroYears.termYears).toBe(1);

        const loanNegYears = GameLogic.calculateAutoLoan(30000, 0.15, -2);
        expect(Number.isFinite(loanNegYears.monthlyPayment)).toBe(true);
        expect(loanNegYears.termYears).toBe(1);
    });

    test('updateOwnedVehicles enforces value floor on standard cars', () => {
        const user = {
            age: 28,
            assets: [
                {
                    id: 1,
                    category: 'vehicle',
                    name: 'Commuter Car',
                    purchasePrice: 20000,
                    value: 4000,
                    acquiredAge: 20,
                    condition: 80,
                    reliability: 5,
                    valuationType: 'standard'
                }
            ]
        };

        GameLogic.updateOwnedVehicles(user, 0);
        expect(user.assets[0].value).toBeGreaterThanOrEqual(3000);
    });

    test('updateOwnedVehicles causes exotic hypercars to appreciate after 7 years', () => {
        const user = {
            age: 30,
            assets: [
                {
                    id: 2,
                    category: 'vehicle',
                    name: 'Ferrari Roma',
                    purchasePrice: 260000,
                    value: 260000,
                    acquiredAge: 20,
                    condition: 100,
                    reliability: 5,
                    valuationType: 'exotic'
                }
            ]
        };

        GameLogic.updateOwnedVehicles(user, 0);
        expect(user.assets[0].value).toBeGreaterThan(260000);
    });

    test('VEHICLES_FOR_SALE does not contain hardcoded "New " prefixes in base names', () => {
        const vehicles = GameLogic.VEHICLES_FOR_SALE;
        expect(vehicles.length).toBeGreaterThanOrEqual(40);
        vehicles.forEach(car => {
            expect(car.name.startsWith('New ')).toBe(false);
        });
    });

    test('VEHICLES_FOR_SALE includes expanded catalog across all showroom lots', () => {
        const used = GameLogic.VEHICLES_FOR_SALE.filter(v => v.showroom === 'used');
        const mall = GameLogic.VEHICLES_FOR_SALE.filter(v => v.showroom === 'mall');
        const exotic = GameLogic.VEHICLES_FOR_SALE.filter(v => v.showroom === 'exotic');

        expect(used.length).toBeGreaterThanOrEqual(13);
        expect(mall.length).toBeGreaterThanOrEqual(17);
        expect(exotic.length).toBeGreaterThanOrEqual(14);

        // Verify specific new vehicle additions exist
        expect(used.some(v => v.name === 'Classic VW Beetle')).toBe(true);
        expect(used.some(v => v.name === 'Old Ford Ranger')).toBe(true);
        expect(mall.some(v => v.name === 'Hyundai Elantra N')).toBe(true);
        expect(mall.some(v => v.name === 'BMW M4 Competition')).toBe(true);
        expect(exotic.some(v => v.name === 'Aston Martin DB12')).toBe(true);
        expect(exotic.some(v => v.name === 'Koenigsegg Jesko')).toBe(true);
    });

    test('calculateTradeInValue computes 80% trade-in valuation and handles active loans', () => {
        // Vehicle without loan
        const carNoLoan = { value: 20000, loan: null };
        const trade1 = GameLogic.calculateTradeInValue(carNoLoan);
        expect(trade1.tradeInValue).toBe(16000); // 80% of 20,000
        expect(trade1.loanPayoff).toBe(0);
        expect(trade1.netEquity).toBe(16000);

        // Vehicle with active loan
        const carWithLoan = { value: 30000, loan: { remainingBalance: 8000 } };
        const trade2 = GameLogic.calculateTradeInValue(carWithLoan);
        expect(trade2.tradeInValue).toBe(24000); // 80% of 30,000
        expect(trade2.loanPayoff).toBe(8000);
        expect(trade2.netEquity).toBe(16000); // 24,000 - 8,000

        // Underwater vehicle
        const carUnderwater = { value: 10000, loan: { remainingBalance: 12000 } };
        const trade3 = GameLogic.calculateTradeInValue(carUnderwater);
        expect(trade3.tradeInValue).toBe(8000);
        expect(trade3.loanPayoff).toBe(12000);
        expect(trade3.netEquity).toBe(0); // Clamped to 0

        // Invalid input
        const invalidTrade = GameLogic.calculateTradeInValue(null);
        expect(invalidTrade.tradeInValue).toBe(0);
        expect(invalidTrade.loanPayoff).toBe(0);
        expect(invalidTrade.netEquity).toBe(0);
    });

    test('updateOwnedVehicles automatically sanitizes legacy "New " prefixes from owned assets', () => {
        const user = {
            age: 25,
            assets: [
                {
                    id: 10,
                    category: 'vehicle',
                    name: 'New Honda Civic LX',
                    value: 22000,
                    condition: 90,
                    reliability: 5,
                    acquiredAge: 24
                },
                {
                    id: 11,
                    category: 'vehicle',
                    name: 'New Porsche 911 Carrera',
                    value: 110000,
                    condition: 98,
                    reliability: 5,
                    acquiredAge: 24
                }
            ]
        };

        GameLogic.updateOwnedVehicles(user, 0);
        expect(user.assets[0].name).toBe('Honda Civic LX');
        expect(user.assets[1].name).toBe('Porsche 911 Carrera');
    });
});

describe('More Options Revamp: Diets, Lottery & Suggestions', () => {
    test('calculateActiveHealthCosts calculates custom diet monthly cost correctly', () => {
        const user = { gymMembership: true, diet: 'gourmet' };
        const costs = GameLogic.calculateActiveHealthCosts(user);
        // Gym ($600/yr) + Gourmet ($2500/mo * 12 = $30,000/yr) = $30,600
        expect(costs).toBe(30600);
    });

    test('playLotteryTicket enforces max 10 tickets per year limit', () => {
        const user = { money: 1000, lotteryTicketsBoughtThisYear: 10 };
        const result = GameLogic.playLotteryTicket('scratch', user);
        expect(result.success).toBe(false);
        expect(result.message).toContain('annual limit');
    });

    test('playLotteryTicket deducts ticket price and updates bought count when valid', () => {
        const user = { money: 500, lotteryTicketsBoughtThisYear: 2 };
        const result = GameLogic.playLotteryTicket('scratch', user);
        expect(result.success).toBe(true);
        expect(user.lotteryTicketsBoughtThisYear).toBe(3);
    });



    test('rollOverMegaJackpot increases jackpot amount annually until won', () => {
        const user = { megaJackpotAmount: 20000000 };
        const newJackpot = GameLogic.rollOverMegaJackpot(user);
        expect(newJackpot).toBeGreaterThanOrEqual(25000000);
        expect(user.megaJackpotAmount).toBe(newJackpot);
    });
});

describe('Relocation to New Country Pure Functions', () => {
    test('RELOCATION_COST constant is $2,000', () => {
        expect(GameLogic.RELOCATION_COST).toBe(2000);
    });

    test('canMoveCountry rejects null or missing user object', () => {
        const result = GameLogic.canMoveCountry(null, 'United Kingdom');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('No character data');
    });

    test('canMoveCountry rejects players under 18 years old', () => {
        const user = { age: 17, money: 5000, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United Kingdom');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('18 years old');
    });

    test('canMoveCountry rejects target country if it is the user current country', () => {
        const user = { age: 25, money: 5000, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United States');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('already living');
    });

    test('canMoveCountry rejects player with insufficient funds (< $2,000)', () => {
        const user = { age: 25, money: 1500, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United Kingdom');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('$2,000');
    });

    test('canMoveCountry approves relocation when eligible (age >= 18, money >= $2,000, new country)', () => {
        const user = { age: 25, money: 3000, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United Kingdom');
        expect(result.allowed).toBe(true);
    });

    test('moveCountry fails and preserves money if user is ineligible', () => {
        const user = { age: 16, money: 3000, country: 'United States', city: 'New York' };
        const result = GameLogic.moveCountry(user, 'Japan', 'Tokyo');
        expect(result.success).toBe(false);
        expect(user.money).toBe(3000);
        expect(user.country).toBe('United States');
        expect(user.city).toBe('New York');
    });

    test('moveCountry deducts $2,000 and updates country & city when successful', () => {
        const user = { age: 30, money: 5000, country: 'United States', city: 'New York' };
        const result = GameLogic.moveCountry(user, 'Japan', 'Tokyo');

        expect(result.success).toBe(true);
        expect(result.cost).toBe(2000);
        expect(user.money).toBe(3000);
        expect(user.country).toBe('Japan');
        expect(user.city).toBe('Tokyo');
        expect(result.message).toContain('Relocated to Tokyo, Japan for $2,000.');
    });

    test('moveCountry clears job title, salary, and career progress when player has a job', () => {
        const user = {
            age: 28,
            money: 5000,
            country: 'United States',
            city: 'New York',
            jobTitle: 'Software Developer',
            jobSalary: 72000,
            jobPerformance: 80,
            careerTrack: 'software_eng',
            careerLevel: 1,
            yearsInRole: 2
        };

        const result = GameLogic.moveCountry(user, 'United Kingdom', 'London');

        expect(result.success).toBe(true);
        expect(result.hadJob).toBe(true);
        expect(result.oldJobTitle).toBe('Software Developer');
        expect(user.jobTitle).toBeNull();
        expect(user.jobSalary).toBe(0);
        expect(user.careerTrack).toBeNull();
        expect(user.careerLevel).toBe(0);
        expect(user.yearsInRole).toBe(0);
        expect(result.message).toContain('You lost your job as Software Developer');
    });

    test('getPartner correctly identifies romance partners and spouses', () => {
        const partner = { id: 'p1', name: 'Emma', type: 'Girlfriend', category: 'partner' };
        const user = { relationships: [partner] };
        expect(GameLogic.getPartner(user)).toBe(partner);
    });

    test('getPartner returns null if user has no partner', () => {
        const friend = { id: 'f1', name: 'John', type: 'Friend', category: 'friend' };
        const user = { relationships: [friend] };
        expect(GameLogic.getPartner(user)).toBeNull();
    });

    test('calculatePartnerRelocateAcceptance returns true for high relationship status when roll is favorable', () => {
        const partner = { name: 'Emma', status: 90 };
        expect(GameLogic.calculatePartnerRelocateAcceptance(partner, 0.1)).toBe(true);
        expect(GameLogic.calculatePartnerRelocateAcceptance(partner, 0.9)).toBe(false);
    });

    test('breakUpWithPartner sets category to ex and updates relationship type accordingly', () => {
        const partner = { id: 'p1', name: 'Sarah', type: 'Girlfriend', category: 'partner', gender: 'female' };
        const user = { relationships: [partner] };

        GameLogic.breakUpWithPartner(user, partner);

        expect(partner.category).toBe('ex');
        expect(partner.type).toBe('Ex-Girlfriend');
    });

    test('canMoveCountry rejects moving to current city', () => {
        const user = { age: 25, money: 5000, country: 'United States', city: 'New York' };
        const result = GameLogic.canMoveCountry(user, 'United States', 'New York');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('already living in');
    });

    test('calculateUserMonthlyOutflow calculates correct monthly living expense for New York ($2,500/mo)', () => {
        const user = { age: 25, city: 'New York', isStudent: false, assets: [], relationships: [] };
        const outflow = GameLogic.calculateUserMonthlyOutflow(user);
        expect(outflow).toBe(2500); // $30,000 / 12 = $2,500
    });



    describe('Casino Games: playRoulette and spinSlotMachine', () => {
        test('playRoulette correctly handles Red/Black even money bets (1:1 payout)', () => {
            const user = { money: 1000 };
            // Land on 1 (Red)
            const winRes = GameLogic.playRoulette(user, 'color', 'red', 100, 1);
            expect(winRes.isWin).toBe(true);
            expect(winRes.netProfit).toBe(100);
            expect(user.money).toBe(1100);

            // Land on 2 (Black) when betting Red
            const lossRes = GameLogic.playRoulette(user, 'color', 'red', 100, 2);
            expect(lossRes.isWin).toBe(false);
            expect(lossRes.netProfit).toBe(-100);
            expect(user.money).toBe(1000);
        });

        test('playRoulette correctly handles 35:1 straight-up single number bets', () => {
            const user = { money: 1000 };
            // Bet on 17, land on 17
            const res = GameLogic.playRoulette(user, 'number', 17, 100, 17);
            expect(res.isWin).toBe(true);
            expect(res.multiplier).toBe(35);
            expect(res.netProfit).toBe(3500);
            expect(user.money).toBe(4500);
        });

        test('spinSlotMachine correctly calculates payouts for 3-of-a-kind and 50x Mega Jackpot', () => {
            const user = { money: 1000 };
            const diamondSym = GameLogic.SLOT_SYMBOLS.find(s => s.name === 'Diamond');
            const jackpotRes = GameLogic.spinSlotMachine(user, 100, [diamondSym, diamondSym, diamondSym]);

            expect(jackpotRes.isWin).toBe(true);
            expect(jackpotRes.isJackpot).toBe(true);
            expect(jackpotRes.multiplier).toBe(50);
            expect(jackpotRes.totalPayout).toBe(5000);
            expect(user.money).toBe(5900); // 1000 + 4900 net
        });

        test('spinSlotMachine returns loss for non-matching common symbols', () => {
            const user = { money: 1000 };
            const lemonSym = GameLogic.SLOT_SYMBOLS.find(s => s.name === 'Lemon');
            const grapeSym = GameLogic.SLOT_SYMBOLS.find(s => s.name === 'Grape');
            const bellSym = GameLogic.SLOT_SYMBOLS.find(s => s.name === 'Bell');

            const lossRes = GameLogic.spinSlotMachine(user, 100, [lemonSym, grapeSym, bellSym]);
            expect(lossRes.isWin).toBe(false);
            expect(lossRes.totalPayout).toBe(0);
            expect(user.money).toBe(900);
        });
    });
});

describe('C-9: Unverified Property Sale Amount — Arbitrary Sale Price Prevention', () => {
    test('fails to sell property when activeOffer is missing', () => {
        const user = {
            health: 100,
            money: 10000,
            assets: [
                { id: 'p1', category: 'property', name: 'Condo', value: 200000 }
            ]
        };

        const result = GameLogic.completePropertySale(user, 'p1', 999999999);
        expect(result.success).toBe(false);
        expect(result.reason).toMatch(/no valid active offer/i);
        expect(user.money).toBe(10000);
        expect(user.assets.length).toBe(1);
    });

    test('ignores spoofed client offerAmount parameter and strictly uses state activeOffer.offerAmount', () => {
        const user = {
            health: 100,
            money: 10000,
            assets: [
                {
                    id: 'p1',
                    category: 'property',
                    name: 'Condo',
                    value: 200000,
                    mortgage: { remainingBalance: 50000 },
                    activeOffer: {
                        offerAmount: 200000,
                        buyer: { name: 'Bob Buyer' },
                        tierId: 'at_market'
                    }
                }
            ]
        };

        // Malicious client attempts to pass a billion dollars
        const result = GameLogic.completePropertySale(user, 'p1', 1000000000);
        expect(result.success).toBe(true);
        expect(result.offerAmount).toBe(200000);
        expect(result.netProceeds).toBe(150000); // 200k - 50k
        expect(result.buyerName).toBe('Bob Buyer');
        expect(user.money).toBe(160000); // 10k + 150k
        expect(user.assets.length).toBe(0);
    });

    test('rejects corrupted or non-numeric activeOffer.offerAmount', () => {
        const user = {
            health: 100,
            money: 10000,
            assets: [
                {
                    id: 'p1',
                    category: 'property',
                    name: 'Condo',
                    value: 200000,
                    activeOffer: { offerAmount: -100000 }
                }
            ]
        };

        [-1000, 0, NaN, null, undefined, Infinity, -Infinity, '500000'].forEach(invalidOffer => {
            user.assets[0].activeOffer.offerAmount = invalidOffer;
            const result = GameLogic.completePropertySale(user, 'p1');
            expect(result.success).toBe(false);
            expect(result.reason).toMatch(/no valid active offer/i);
            expect(user.money).toBe(10000);
            expect(user.assets.length).toBe(1);
        });
    });

    test('generatePropertyBuyerOffer attaches activeOffer on success and clears it on no-offer roll', () => {
        const prop = { id: 'p1', value: 300000 };

        // Successful roll (chance is 0.70 for at_market)
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.1);
        const resSuccess = GameLogic.generatePropertyBuyerOffer(prop, 'at_market');
        expect(resSuccess.hasOffer).toBe(true);
        expect(prop.activeOffer).toBeDefined();
        expect(prop.activeOffer.offerAmount).toBe(300000);
        expect(prop.activeOffer.buyer).toBeDefined();

        // Failed roll
        randomSpy.mockReturnValue(0.99);
        const resFail = GameLogic.generatePropertyBuyerOffer(prop, 'at_market');
        expect(resFail.hasOffer).toBe(false);
        expect(prop.activeOffer).toBeUndefined();

        randomSpy.mockRestore();
    });

    test('updateOwnedProperties clears unaccepted activeOffer on age-up', () => {
        const user = {
            assets: [
                {
                    id: 'p1',
                    category: 'property',
                    name: 'Villa',
                    value: 500000,
                    condition: 90,
                    maxCondition: 95,
                    activeOffer: { offerAmount: 500000, buyer: { name: 'Eve' } }
                }
            ]
        };

        GameLogic.updateOwnedProperties(user);
        expect(user.assets[0].activeOffer).toBeUndefined();
    });

    test('renovateProperty clears activeOffer after property valuation changes', () => {
        const user = {
            money: 100000,
            health: 100,
            assets: [
                {
                    id: 'p1',
                    category: 'property',
                    name: 'Fixer',
                    value: 200000,
                    condition: 50,
                    maxCondition: 80,
                    activeOffer: { offerAmount: 200000, buyer: { name: 'Frank' } }
                }
            ]
        };

        const result = GameLogic.renovateProperty(user, 'p1', 'minor');
        expect(result.success).toBe(true);
        expect(user.assets[0].activeOffer).toBeUndefined();
    });
});
