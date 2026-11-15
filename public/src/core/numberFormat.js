export const LARGE_SCALE_TIERS = [
    { value: 1e33, suffix: 'Dc' },
    { value: 1e30, suffix: 'No' },
    { value: 1e27, suffix: 'Oc' },
    { value: 1e24, suffix: 'Sp' },
    { value: 1e21, suffix: 'Sx' },
    { value: 1e18, suffix: 'Qi' },
    { value: 1e15, suffix: 'Qa' },
    { value: 1e12, suffix: 'T' },
    { value: 1e9,  suffix: 'B' },
    { value: 1e6,  suffix: 'M' },
    { value: 1e3,  suffix: 'K' }
];

/**
 * Formats a non-negative number using short-scale suffixes (B, T, Qa, Qi, ...).
 * Returns null if absVal is below minThreshold so the caller can format normally.
 * @param {number} absVal
 * @param {{ minThreshold?: number, maxDecimals?: number, tiers?: Array<{value: number, suffix: string}> }} [options]
 * @returns {string|null}
 */
export function formatShortScaleValue(absVal, options = {}) {
    const minThreshold = options.minThreshold ?? 1e9;
    const maxDecimals = options.maxDecimals ?? 2;
    const tiers = options.tiers || LARGE_SCALE_TIERS;

    if (!Number.isFinite(absVal)) {
        return absVal === Infinity ? '∞' : '0';
    }
    if (absVal < minThreshold) {
        return null;
    }
    if (absVal >= 1e36) {
        return absVal.toExponential(maxDecimals).replace('+', '');
    }

    for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        if (tier.value < minThreshold) break;
        if (absVal >= tier.value) {
            const rounded = parseFloat((absVal / tier.value).toFixed(maxDecimals));
            if (rounded >= 1000) {
                if (i > 0) {
                    return `1${tiers[i - 1].suffix}`;
                }
                return absVal.toExponential(maxDecimals).replace('+', '');
            }
            return `${rounded}${tier.suffix}`;
        }
    }

    return null;
}

/**
 * Pure USD formatter that shortens values >= 1 Billion (B, T, Qa, Qi, ...)
 * for core logic messages/sublabels without importing UI modules.
 * @param {number} num
 * @returns {string}
 */
export function formatUsdBillionsPlus(num) {
    const amount = Math.round(Number(num) || 0);
    const absVal = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    const short = formatShortScaleValue(absVal, { minThreshold: 1e9, maxDecimals: 2 });
    if (short !== null) {
        return `${sign}$${short}`;
    }
    return `${sign}$${absVal.toLocaleString('en-US')}`;
}
