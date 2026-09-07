import { AvatarLogic } from '../../public/src/core/avatarLogic.js';

describe('Avatar Logic & Age Stage Progression', () => {
    test('getAgeStage correctly classifies age boundaries', () => {
        expect(AvatarLogic.getAgeStage(0)).toBe('baby');
        expect(AvatarLogic.getAgeStage(1)).toBe('baby');
        expect(AvatarLogic.getAgeStage(2)).toBe('baby');
        expect(AvatarLogic.getAgeStage(3)).toBe('child');
        expect(AvatarLogic.getAgeStage(7)).toBe('child');
        expect(AvatarLogic.getAgeStage(12)).toBe('child');
        expect(AvatarLogic.getAgeStage(13)).toBe('adult');
        expect(AvatarLogic.getAgeStage(25)).toBe('adult');
        expect(AvatarLogic.getAgeStage(70)).toBe('adult');
    });

    test('NOSE_SHAPES has 6 entries', () => {
        expect(AvatarLogic.NOSE_SHAPES).toBeDefined();
        expect(AvatarLogic.NOSE_SHAPES.length).toBe(6);
    });

    test('EYELASH_STYLES has 4 entries', () => {
        expect(AvatarLogic.EYELASH_STYLES).toBeDefined();
        expect(AvatarLogic.EYELASH_STYLES.length).toBe(4);
    });

    test('generateRandomAppearance includes noseShape and eyelashStyle', () => {
        const appearance = AvatarLogic.generateRandomAppearance('female');
        expect(appearance).toHaveProperty('noseShape');
        expect(appearance).toHaveProperty('eyelashStyle');
    });

    test('HAIR_STYLES includes new styles (afro, mohawk, braids, undercut)', () => {
        expect(AvatarLogic.HAIR_STYLES).toContain('afro');
        expect(AvatarLogic.HAIR_STYLES).toContain('mohawk');
        expect(AvatarLogic.HAIR_STYLES).toContain('braids');
        expect(AvatarLogic.HAIR_STYLES).toContain('undercut');
        expect(AvatarLogic.HAIR_STYLES.length).toBe(16);
    });
});
