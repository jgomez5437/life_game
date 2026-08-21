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
});
