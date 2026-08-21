import { sanitizeEntitlements, injectVerifiedPurchases, VALID_PACK_IDS, checkPayloadSize, MAX_SAVE_PAYLOAD_BYTES } from '../../api/lib/validation.js';

describe('Save Endpoint Entitlement Validation (C-2 Fix)', () => {

    // --- VALID_PACK_IDS ---

    test('VALID_PACK_IDS contains all expected pack IDs', () => {
        const expected = [
            'god_mode', 'instant_diplomas', 'time_machine', 'vip_supporter',
            'mafia_syndicate', 'mafia_expansion', 'artist_pack', 'athlete_pack', 'politician_pack'
        ];
        for (const id of expected) {
            expect(VALID_PACK_IDS.has(id)).toBe(true);
        }
        expect(VALID_PACK_IDS.size).toBe(expected.length);
    });

    // --- sanitizeEntitlements ---

    test('sanitizeEntitlements strips top-level purchases array', () => {
        const gameData = {
            purchases: ['god_mode', 'time_machine'],
            user: { username: 'Test' },
            lifeLog: []
        };
        sanitizeEntitlements(gameData);
        expect(gameData.purchases).toBeUndefined();
        // Other fields preserved
        expect(gameData.user.username).toBe('Test');
        expect(gameData.lifeLog).toEqual([]);
    });

    test('sanitizeEntitlements strips user.purchases', () => {
        const gameData = {
            user: {
                username: 'Test',
                purchases: ['god_mode', 'vip_supporter', 'instant_diplomas']
            }
        };
        sanitizeEntitlements(gameData);
        expect(gameData.user.purchases).toBeUndefined();
        expect(gameData.user.username).toBe('Test');
    });

    test('sanitizeEntitlements strips purchases inside save slots', () => {
        const gameData = {
            user: { username: 'Test', purchases: ['god_mode'] },
            slots: {
                'slot_1': {
                    id: 'slot_1',
                    data: {
                        user: { username: 'Slot1User', purchases: ['god_mode', 'time_machine'] },
                        lifeLog: []
                    }
                },
                'slot_2': {
                    id: 'slot_2',
                    data: {
                        purchases: ['vip_supporter'],  // top-level data.purchases variant
                        lifeLog: []
                    }
                }
            }
        };
        sanitizeEntitlements(gameData);

        expect(gameData.user.purchases).toBeUndefined();
        expect(gameData.slots['slot_1'].data.user.purchases).toBeUndefined();
        expect(gameData.slots['slot_1'].data.user.username).toBe('Slot1User');
        expect(gameData.slots['slot_2'].data.purchases).toBeUndefined();
        expect(gameData.slots['slot_2'].data.lifeLog).toEqual([]);
    });

    test('sanitizeEntitlements handles missing/null game_data gracefully', () => {
        expect(sanitizeEntitlements(null)).toBe(null);
        expect(sanitizeEntitlements(undefined)).toBe(undefined);
        expect(sanitizeEntitlements(42)).toBe(42);
    });

    test('sanitizeEntitlements handles game_data with no purchases fields', () => {
        const gameData = {
            user: { username: 'Test', health: 100 },
            lifeLog: []
        };
        sanitizeEntitlements(gameData);
        // Should not throw and should preserve existing fields
        expect(gameData.user.username).toBe('Test');
        expect(gameData.user.health).toBe(100);
    });

    test('sanitizeEntitlements handles empty slots object', () => {
        const gameData = { user: { purchases: ['god_mode'] }, slots: {} };
        sanitizeEntitlements(gameData);
        expect(gameData.user.purchases).toBeUndefined();
    });

    test('sanitizeEntitlements handles slots with null/invalid data', () => {
        const gameData = {
            user: { purchases: ['god_mode'] },
            slots: {
                'slot_1': null,
                'slot_2': { id: 'slot_2' },  // no data property
                'slot_3': { id: 'slot_3', data: null }
            }
        };
        // Should not throw
        sanitizeEntitlements(gameData);
        expect(gameData.user.purchases).toBeUndefined();
    });

    // --- injectVerifiedPurchases ---

    test('injectVerifiedPurchases sets purchases on user object', () => {
        const gameData = { user: { username: 'Test' } };
        injectVerifiedPurchases(gameData, ['god_mode']);
        expect(gameData.user.purchases).toEqual(['god_mode']);
    });

    test('injectVerifiedPurchases sets top-level purchases when no user object', () => {
        const gameData = { lifeLog: [] };
        injectVerifiedPurchases(gameData, ['time_machine']);
        expect(gameData.purchases).toEqual(['time_machine']);
    });

    test('injectVerifiedPurchases sets purchases in all save slots', () => {
        const gameData = {
            user: { username: 'Test' },
            slots: {
                'slot_1': { id: 'slot_1', data: { user: { username: 'S1' } } },
                'slot_2': { id: 'slot_2', data: { lifeLog: [] } }  // no user subobject
            }
        };
        injectVerifiedPurchases(gameData, ['god_mode', 'vip_supporter']);

        expect(gameData.user.purchases).toEqual(['god_mode', 'vip_supporter']);
        expect(gameData.slots['slot_1'].data.user.purchases).toEqual(['god_mode', 'vip_supporter']);
        expect(gameData.slots['slot_2'].data.purchases).toEqual(['god_mode', 'vip_supporter']);
    });

    test('injectVerifiedPurchases uses empty array for non-array input', () => {
        const gameData = { user: { username: 'Test' } };
        injectVerifiedPurchases(gameData, null);
        expect(gameData.user.purchases).toEqual([]);

        injectVerifiedPurchases(gameData, undefined);
        expect(gameData.user.purchases).toEqual([]);

        injectVerifiedPurchases(gameData, 'not_an_array');
        expect(gameData.user.purchases).toEqual([]);
    });

    test('injectVerifiedPurchases handles null/invalid game_data gracefully', () => {
        expect(injectVerifiedPurchases(null, ['god_mode'])).toBe(null);
        expect(injectVerifiedPurchases(undefined, ['god_mode'])).toBe(undefined);
    });

    // --- Integration: strip-and-replace flow ---

    test('full strip-and-replace: injected entitlements are replaced with verified ones', () => {
        // Simulate a malicious save payload with self-granted entitlements
        const gameData = {
            user: {
                username: 'Hacker',
                purchases: ['god_mode', 'time_machine', 'vip_supporter', 'fake_pack'],
                money: 999999999,
                health: 100
            },
            purchases: ['god_mode'],  // top-level injection too
            slots: {
                'slot_1': {
                    id: 'slot_1',
                    data: {
                        user: {
                            username: 'Hacker',
                            purchases: ['god_mode', 'time_machine', 'vip_supporter']
                        }
                    }
                }
            }
        };

        // Step 1: Strip all client-sent purchases
        sanitizeEntitlements(gameData);

        // Verify everything is stripped
        expect(gameData.user.purchases).toBeUndefined();
        expect(gameData.purchases).toBeUndefined();
        expect(gameData.slots['slot_1'].data.user.purchases).toBeUndefined();

        // Step 2: Inject only what the DB says the user actually paid for
        const dbPurchases = ['god_mode'];  // user only actually bought god_mode
        injectVerifiedPurchases(gameData, dbPurchases);

        // Verify only legitimate purchases are present
        expect(gameData.user.purchases).toEqual(['god_mode']);
        expect(gameData.slots['slot_1'].data.user.purchases).toEqual(['god_mode']);

        // Verify other fields are untouched
        expect(gameData.user.username).toBe('Hacker');
        expect(gameData.user.money).toBe(999999999);
        expect(gameData.user.health).toBe(100);
    });

    test('sanitizeEntitlements thoroughly strips godMode, purchasedPacks, isVIP, and vipLevel from all levels', () => {
        const maliciousPayload = {
            godMode: true,
            purchasedPacks: ['god_mode', 'time_machine'],
            isVIP: true,
            vipLevel: 10,
            purchases: ['god_mode'],
            user: {
                username: 'Cheater',
                godMode: true,
                purchasedPacks: ['god_mode'],
                isVIP: true,
                vipLevel: 5,
                purchases: ['god_mode']
            },
            slots: {
                'slot_1': {
                    data: {
                        godMode: true,
                        purchasedPacks: ['time_machine'],
                        isVIP: true,
                        vipLevel: 2,
                        user: {
                            godMode: true,
                            purchasedPacks: ['time_machine'],
                            isVIP: true,
                            vipLevel: 2
                        }
                    }
                }
            },
            snapshots: [
                {
                    age: 20,
                    data: {
                        godMode: true,
                        purchasedPacks: ['god_mode'],
                        user: { godMode: true }
                    }
                }
            ]
        };

        sanitizeEntitlements(maliciousPayload);

        // Top level
        expect(maliciousPayload.godMode).toBeUndefined();
        expect(maliciousPayload.purchasedPacks).toBeUndefined();
        expect(maliciousPayload.isVIP).toBeUndefined();
        expect(maliciousPayload.vipLevel).toBeUndefined();
        expect(maliciousPayload.purchases).toBeUndefined();

        // User level
        expect(maliciousPayload.user.godMode).toBeUndefined();
        expect(maliciousPayload.user.purchasedPacks).toBeUndefined();
        expect(maliciousPayload.user.isVIP).toBeUndefined();
        expect(maliciousPayload.user.vipLevel).toBeUndefined();
        expect(maliciousPayload.user.purchases).toBeUndefined();

        // Slot level
        expect(maliciousPayload.slots['slot_1'].data.godMode).toBeUndefined();
        expect(maliciousPayload.slots['slot_1'].data.purchasedPacks).toBeUndefined();
        expect(maliciousPayload.slots['slot_1'].data.user.godMode).toBeUndefined();
        expect(maliciousPayload.slots['slot_1'].data.user.purchasedPacks).toBeUndefined();

        // Snapshot level
        expect(maliciousPayload.snapshots[0].data.godMode).toBeUndefined();
        expect(maliciousPayload.snapshots[0].data.purchasedPacks).toBeUndefined();
        expect(maliciousPayload.snapshots[0].data.user.godMode).toBeUndefined();
    });

    test('full strip-and-replace with zero verified purchases strips all entitlements', () => {
        const gameData = {
            user: {
                username: 'Cheater',
                purchases: ['god_mode', 'time_machine', 'vip_supporter', 'mafia_syndicate'],
                godMode: true,
                purchasedPacks: ['god_mode']
            }
        };

        sanitizeEntitlements(gameData);
        injectVerifiedPurchases(gameData, []);  // no purchases in DB

        expect(gameData.user.purchases).toEqual([]);
        expect(gameData.user.godMode).toBeUndefined();
        expect(gameData.user.purchasedPacks).toBeUndefined();
    });
});

describe('Save Endpoint Payload Size Validation (C-3 Fix)', () => {

    test('MAX_SAVE_PAYLOAD_BYTES is 512 KB', () => {
        expect(MAX_SAVE_PAYLOAD_BYTES).toBe(512 * 1024);
    });

    test('checkPayloadSize accepts payload under limit via Content-Length header', () => {
        const request = { headers: { 'content-length': '1024' }, body: {} };
        const result = checkPayloadSize(request);
        expect(result.ok).toBe(true);
        expect(result.size).toBe(1024);
    });

    test('checkPayloadSize rejects payload over limit via Content-Length header', () => {
        const oversize = MAX_SAVE_PAYLOAD_BYTES + 1;
        const request = { headers: { 'content-length': String(oversize) }, body: {} };
        const result = checkPayloadSize(request);
        expect(result.ok).toBe(false);
        expect(result.size).toBe(oversize);
    });

    test('checkPayloadSize accepts payload at exactly the limit', () => {
        const request = { headers: { 'content-length': String(MAX_SAVE_PAYLOAD_BYTES) }, body: {} };
        const result = checkPayloadSize(request);
        expect(result.ok).toBe(true);
        expect(result.size).toBe(MAX_SAVE_PAYLOAD_BYTES);
    });

    test('checkPayloadSize falls back to body estimation when no Content-Length', () => {
        const smallBody = { user: { username: 'Test' } };
        const request = { headers: {}, body: smallBody };
        const result = checkPayloadSize(request);
        expect(result.ok).toBe(true);
        expect(result.size).toBeGreaterThan(0);
    });

    test('checkPayloadSize rejects large body when no Content-Length', () => {
        // Create a body that exceeds 512KB when serialized
        const largeBody = { data: 'x'.repeat(MAX_SAVE_PAYLOAD_BYTES + 1) };
        const request = { headers: {}, body: largeBody };
        const result = checkPayloadSize(request);
        expect(result.ok).toBe(false);
        expect(result.size).toBeGreaterThan(MAX_SAVE_PAYLOAD_BYTES);
    });

    test('checkPayloadSize returns ok for missing body and headers', () => {
        const request = { headers: {} };
        const result = checkPayloadSize(request);
        expect(result.ok).toBe(true);
        expect(result.size).toBe(0);
    });

    test('checkPayloadSize handles null headers gracefully', () => {
        const request = { body: { test: true } };
        const result = checkPayloadSize(request);
        expect(result.ok).toBe(true);
        expect(result.size).toBeGreaterThan(0);
    });
});
