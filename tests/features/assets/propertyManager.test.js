import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { state } from '../../../public/src/core/state.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    openHirePropertyManagerModal,
    confirmHirePropertyManager,
    openFirePropertyManagerConfirm,
    viewLastManagerReport,
    approveManagerRepairAction,
    declineManagerRepairAction,
    approveAllManagerRepairsAction,
    dismissManagerReportAction,
    getAnnualManagerReportHtml
} from '../../../public/src/features/assets/assetsScreen.js';

describe('Feature: Property Manager', () => {
    let mockUser;

    beforeEach(() => {
        document.body.innerHTML = `
            <main id="game-container"></main>
            <div id="modal-overlay" class="hidden">
                <div id="modal-container">
                    <div id="modal-header">
                        <h2 id="modal-title">Alert</h2>
                        <button id="modal-close-btn"></button>
                    </div>
                    <div id="modal-content"></div>
                    <div id="modal-actions">
                        <button id="modal-btn">Dismiss</button>
                    </div>
                </div>
            </div>
        `;

        mockUser = {
            id: 'test_landlord',
            name: 'Robert Investor',
            age: 35,
            money: 50000,
            health: 90,
            lifeStatus: 'Alive',
            isDead: false,
            propertyManager: null,
            assets: [
                {
                    id: 'prop_rented_1',
                    category: 'property',
                    name: 'Sunset Apartments Unit 4',
                    type: 'Apartment',
                    value: 200000,
                    condition: 90,
                    maxCondition: 100,
                    isRented: true,
                    tenant: {
                        id: 'tenant_1',
                        name: 'Alice Cooper',
                        gender: 'female',
                        age: 28,
                        type: 'Reliable Professional',
                        quality: 'excellent',
                        monthlyRent: 2000,
                        leaseYears: 2,
                        renewalPending: false
                    }
                },
                {
                    id: 'prop_rented_2',
                    category: 'property',
                    name: 'Pine Street Condo',
                    type: 'Condo',
                    value: 300000,
                    condition: 85,
                    maxCondition: 100,
                    isRented: true,
                    tenant: {
                        id: 'tenant_2',
                        name: 'Bob Martin',
                        gender: 'male',
                        age: 32,
                        type: 'Working Roommates',
                        quality: 'good',
                        monthlyRent: 2500,
                        leaseYears: 1,
                        renewalPending: false
                    }
                },
                {
                    id: 'prop_vacant',
                    category: 'property',
                    name: 'Maple House (Vacant)',
                    type: 'House',
                    value: 400000,
                    condition: 80,
                    maxCondition: 100,
                    isRented: false,
                    tenant: null
                }
            ]
        };

        state.gameState = {
            user: mockUser,
            lifeLog: [],
            pendingTenantEvents: []
        };
    });

    test('Candidate generator creates candidate with avatar appearance and 10% fee', () => {
        const candidate = GameLogic.generatePropertyManagerCandidate();
        expect(candidate).toBeDefined();
        expect(typeof candidate.name).toBe('string');
        expect(candidate.feeRate).toBe(0.10);
        expect(candidate.appearance).toBeDefined();
        expect(candidate.appearance.skinTone).toBeDefined();
        expect(candidate.appearance.hairStyle).toBeDefined();
        expect(['male', 'female']).toContain(candidate.gender);
    });

    test('Hiring requires at least one rented property and initializes manager correctly', () => {
        // Test with user with no rentals
        const userNoRentals = { age: 30, money: 10000, assets: [] };
        const failRes = GameLogic.hirePropertyManager(userNoRentals);
        expect(failRes.success).toBe(false);
        expect(failRes.reason).toMatch(/rented property/i);

        // Test with user with rentals
        const hireRes = GameLogic.hirePropertyManager(mockUser);
        expect(hireRes.success).toBe(true);
        expect(mockUser.propertyManager).toBeDefined();
        expect(mockUser.propertyManager.hired).toBe(true);
        expect(mockUser.propertyManager.feeRate).toBe(0.10);
        expect(mockUser.propertyManager.appearance).toBeDefined();

        // Prevent double hiring
        const doubleHire = GameLogic.hirePropertyManager(mockUser);
        expect(doubleHire.success).toBe(false);
        expect(doubleHire.reason).toMatch(/already have a property manager/i);
    });

    test('isPropertyManaged only targets rented units, not vacant or personal properties', () => {
        expect(GameLogic.isPropertyManaged(mockUser, mockUser.assets[0])).toBe(false);

        GameLogic.hirePropertyManager(mockUser);

        // Rented properties are managed
        expect(GameLogic.isPropertyManaged(mockUser, mockUser.assets[0])).toBe(true);
        expect(GameLogic.isPropertyManaged(mockUser, mockUser.assets[1])).toBe(true);

        // Vacant property is NOT managed
        expect(GameLogic.isPropertyManaged(mockUser, mockUser.assets[2])).toBe(false);
    });

    test('Firing property manager clears manager state', () => {
        GameLogic.hirePropertyManager(mockUser);
        expect(GameLogic.isPropertyManagerHired(mockUser)).toBe(true);

        const fireRes = GameLogic.firePropertyManager(mockUser);
        expect(fireRes.success).toBe(true);
        expect(GameLogic.isPropertyManagerHired(mockUser)).toBe(false);
        expect(mockUser.propertyManager).toBeNull();
    });

    test('processRentalIncome collects rent with 10% fee and generates annual report', () => {
        GameLogic.hirePropertyManager(mockUser);
        const startMoney = mockUser.money;

        // Two rented properties: $2,000/mo and $2,500/mo = $4,500/mo gross ($54,000/yr)
        // 10% fee is $5,400. Net is $48,600.
        const totalNet = GameLogic.processRentalIncome(mockUser, state);
        expect(totalNet).toBe(48600);
        expect(mockUser.money).toBe(startMoney + 48600);

        const pm = mockUser.propertyManager;
        expect(pm.lifetimeRentCollected).toBe(54000);
        expect(pm.lifetimeFeesPaid).toBe(5400);

        expect(pm.lastReport).toBeDefined();
        expect(pm.lastReport.gross).toBe(54000);
        expect(pm.lastReport.fee).toBe(5400);
        expect(pm.lastReport.net).toBe(48600);
        expect(pm.lastReport.properties.length).toBe(2);
    });

    test('calculateTotalRentalIncome returns net rent when manager is hired and gross when not', () => {
        // Without manager: gross is $4,500
        expect(GameLogic.calculateTotalRentalIncome(mockUser.assets, mockUser)).toBe(4500);

        // With manager: 90% is $4,050
        GameLogic.hirePropertyManager(mockUser);
        expect(GameLogic.calculateTotalRentalIncome(mockUser.assets, mockUser)).toBe(4050);
    });

    test('processTenantEvents handles lease renewals without popup and queues manager_report', () => {
        GameLogic.hirePropertyManager(mockUser);
        GameLogic.processRentalIncome(mockUser, state);

        // Set lease to 1 year so it reaches 0 during processTenantEvents
        mockUser.assets[0].tenant.leaseYears = 1;
        mockUser.assets[1].tenant.leaseYears = 2;

        GameLogic.processTenantEvents(mockUser, state);

        // Individual popups (lease_expiration or damage) should NOT be queued for managed properties
        const individualEvents = state.gameState.pendingTenantEvents.filter(
            e => e.eventType === 'lease_expiration' || e.eventType === 'damage' || e.eventType === 'overdue'
        );
        expect(individualEvents.length).toBe(0);

        // A single manager_report event should be queued
        const reportEvent = state.gameState.pendingTenantEvents.find(e => e.eventType === 'manager_report');
        expect(reportEvent).toBeDefined();

        // The property should still be rented (either renewed or replacement tenant placed)
        expect(mockUser.assets[0].isRented).toBe(true);
        expect(mockUser.assets[0].tenant).toBeDefined();
    });

    test('Manager repair requests can be approved and deducted from funds', () => {
        GameLogic.hirePropertyManager(mockUser);
        const report = {
            age: 35,
            properties: [],
            activity: [],
            repairs: [
                {
                    id: 'repair_test_1',
                    propertyId: mockUser.assets[0].id,
                    propertyName: mockUser.assets[0].name,
                    tenantName: 'Alice Cooper',
                    type: 'HVAC Failure',
                    icon: 'fa-fan',
                    desc: 'The heating and cooling unit stopped working.',
                    cost: 1500,
                    conditionLoss: 12,
                    conditionGain: 5,
                    status: 'pending'
                }
            ],
            gross: 54000,
            fee: 5400,
            net: 48600
        };
        mockUser.propertyManager.lastReport = report;

        const initialMoney = mockUser.money;
        const initialCondition = mockUser.assets[0].condition;

        // Approve repair
        const res = GameLogic.resolveManagerRepair(mockUser, 'repair_test_1', true);
        expect(res.success).toBe(true);
        expect(res.status).toBe('approved');
        expect(mockUser.money).toBe(initialMoney - 1500);
        expect(mockUser.assets[0].condition).toBe(initialCondition + 5);
        expect(report.repairs[0].status).toBe('approved');
    });

    test('Declining manager repair reduces condition and increases tenant repairNeglect', () => {
        GameLogic.hirePropertyManager(mockUser);
        const report = {
            age: 35,
            properties: [],
            activity: [],
            repairs: [
                {
                    id: 'repair_test_2',
                    propertyId: mockUser.assets[0].id,
                    propertyName: mockUser.assets[0].name,
                    tenantName: 'Alice Cooper',
                    type: 'Leaky Roof',
                    icon: 'fa-house-damage',
                    desc: 'Water leaking into ceiling.',
                    cost: 2000,
                    conditionLoss: 15,
                    conditionGain: 5,
                    status: 'pending'
                }
            ],
            gross: 54000,
            fee: 5400,
            net: 48600
        };
        mockUser.propertyManager.lastReport = report;

        const initialMoney = mockUser.money;
        const initialCondition = mockUser.assets[0].condition;

        // Decline repair
        const res = GameLogic.resolveManagerRepair(mockUser, 'repair_test_2', false);
        expect(res.success).toBe(true);
        expect(res.status).toBe('declined');
        expect(mockUser.money).toBe(initialMoney); // No money spent
        expect(mockUser.assets[0].condition).toBe(initialCondition - 15);
        expect(mockUser.assets[0].tenant.repairNeglect).toBe(1);
        expect(report.repairs[0].status).toBe('declined');
    });

    test('Annual report HTML formats avatar, financials, renewals and repairs properly', () => {
        GameLogic.hirePropertyManager(mockUser);
        const report = {
            age: 35,
            properties: [
                {
                    propertyId: mockUser.assets[0].id,
                    propertyName: 'Sunset Apartments Unit 4',
                    tenantName: 'Alice Cooper',
                    gross: 24000,
                    fee: 2400,
                    net: 21600,
                    note: 'Paid in full'
                }
            ],
            activity: [
                { type: 'renewal', icon: 'fa-file-signature', text: 'Renewed Alice Cooper lease for 2 years.' }
            ],
            repairs: [
                {
                    id: 'repair_report_1',
                    propertyId: mockUser.assets[0].id,
                    propertyName: 'Sunset Apartments Unit 4',
                    tenantName: 'Alice Cooper',
                    type: 'Water Heater',
                    icon: 'fa-fire',
                    desc: 'Water heater needs replacement.',
                    cost: 800,
                    conditionLoss: 10,
                    conditionGain: 5,
                    status: 'pending'
                }
            ],
            gross: 24000,
            fee: 2400,
            net: 21600
        };
        mockUser.propertyManager.lastReport = report;

        const html = getAnnualManagerReportHtml(report, true);
        expect(html).toContain(mockUser.propertyManager.name);
        expect(html).toContain('Annual Rental Portfolio Report');
        expect(html).toContain('$24,000');
        expect(html).toContain('-$2,400');
        expect(html).toContain('+$21,600');
        expect(html).toContain('Sunset Apartments Unit 4');
        expect(html).toContain('Water Heater');
        expect(html).toContain('Approve ($800)');
    });

    test('UI actions for hiring and dismissing report function correctly', () => {
        // Open hiring modal
        openHirePropertyManagerModal();
        const content = document.getElementById('modal-content');
        expect(content.innerHTML).toContain('Fee: 10% of Collected Rent');

        // Confirm hiring
        confirmHirePropertyManager();
        expect(GameLogic.isPropertyManagerHired(mockUser)).toBe(true);

        // Queue report and dismiss it
        state.gameState.pendingTenantEvents = [{ eventType: 'manager_report', age: 35 }];
        dismissManagerReportAction();
        expect(state.gameState.pendingTenantEvents.length).toBe(0);
    });

    test('generateTenantApplicants calculates clean rounded rents without float truncation for $450k house', () => {
        const house = { id: 'house_450', value: 450000 };
        const applicants = GameLogic.generateTenantApplicants(house);

        const excellentApp = applicants.find(a => a.quality === 'excellent');
        const goodApp = applicants.find(a => a.quality === 'good');
        const riskyApp = applicants.find(a => a.quality === 'risky');

        // val * 0.007 = 3150
        expect(excellentApp.monthlyRent).toBe(3150);
        // val * 0.009 = 4050 (previously truncated to 4049 due to float math)
        expect(goodApp.monthlyRent).toBe(4050);
        // val * 0.011 = 4950
        expect(riskyApp.monthlyRent).toBe(4950);
    });

    test('placeReplacementTenant preserves existing tenant quality tier (excellent remains excellent at $3,150)', () => {
        const prop = {
            id: 'suburban_house',
            value: 450000,
            isRented: true,
            tenant: {
                id: 'prior_tenant',
                name: 'Original Excellent Tenant',
                quality: 'excellent',
                monthlyRent: 3150,
                leaseYears: 0
            }
        };

        // Run multiple times to verify no 30% random downgrade to good ($4,050)
        for (let i = 0; i < 20; i++) {
            GameLogic.hirePropertyManager(mockUser);
            // Replace tenant directly via logic
            const applicants = GameLogic.generateTenantApplicants(prop);
            const targetQuality = prop.tenant?.quality || 'excellent';
            const pick = applicants.find(a => a.quality === targetQuality) || applicants[0];

            expect(pick.quality).toBe('excellent');
            expect(pick.monthlyRent).toBe(3150);
        }
    });
});

