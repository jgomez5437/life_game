import { AvatarLogic } from '../../public/src/core/avatarLogic.js';
import { renderAvatar } from '../../public/src/ui/avatarRenderer.js';

describe('Avatar SVG Renderer', () => {
    test('renderAvatar preserves hair color, skin tone, and eye color for Baby stage', () => {
        const character = {
            id: 'test-baby-1',
            age: 1,
            gender: 'female',
            appearance: {
                skinTone: 'tone2',
                faceShape: 'oval',
                eyeShape: 'round',
                eyeColor: 'blue',
                eyebrowStyle: 'thin',
                hairStyle: 'longWavy',
                hairColorBase: 'red',
                facialHairStyle: 'none',
                facialHairColor: 'matchHair',
                glassesStyle: 'none',
                glassesColor: 'black',
                lipstickColor: 'none',
                blushColor: 'none',
                grayStartAge: 40
            }
        };

        const svg = renderAvatar(character);
        expect(svg).toContain('<svg');
        // Check skin tone 2 (#F5CBA0)
        expect(svg.toUpperCase()).toContain(AvatarLogic.SKIN_TONE_HEX.tone2.toUpperCase());
        // Check eye color blue (#4A7AB5)
        expect(svg.toUpperCase()).toContain(AvatarLogic.EYE_COLOR_HEX.blue.toUpperCase());
        // Check hair color red (#A13D24)
        expect(svg.toUpperCase()).toContain(AvatarLogic.HAIR_COLOR_HEX.red.toUpperCase());
    });

    test('renderAvatar preserves traits and includes glasses for Child stage', () => {
        const character = {
            id: 'test-child-1',
            age: 7,
            gender: 'male',
            appearance: {
                skinTone: 'tone5',
                faceShape: 'square',
                eyeShape: 'almond',
                eyeColor: 'green',
                eyebrowStyle: 'thick',
                hairStyle: 'shortCrop',
                hairColorBase: 'blonde',
                facialHairStyle: 'none',
                facialHairColor: 'matchHair',
                glassesStyle: 'square',
                glassesColor: 'black',
                lipstickColor: 'none',
                blushColor: 'none',
                grayStartAge: 45
            }
        };

        const svg = renderAvatar(character);
        expect(svg).toContain('<svg');
        // Check skin tone 5 (#B87F52)
        expect(svg.toUpperCase()).toContain(AvatarLogic.SKIN_TONE_HEX.tone5.toUpperCase());
        // Check eye color green (#4E7A51)
        expect(svg.toUpperCase()).toContain(AvatarLogic.EYE_COLOR_HEX.green.toUpperCase());
        // Check hair color blonde (#D4B483)
        expect(svg.toUpperCase()).toContain(AvatarLogic.HAIR_COLOR_HEX.blonde.toUpperCase());
        // Check glasses
        expect(svg.toUpperCase()).toContain(AvatarLogic.GLASSES_COLOR_HEX.black.toUpperCase());
    });

    test('renderAvatar transitions properly to Adult stage', () => {
        const character = {
            id: 'test-adult-1',
            age: 25,
            gender: 'female',
            appearance: {
                skinTone: 'tone1',
                faceShape: 'oval',
                eyeShape: 'almond',
                eyeColor: 'brown',
                eyebrowStyle: 'medium',
                hairStyle: 'longStraight',
                hairColorBase: 'darkBrown',
                facialHairStyle: 'none',
                facialHairColor: 'matchHair',
                glassesStyle: 'none',
                glassesColor: 'black',
                lipstickColor: 'red',
                blushColor: 'pink',
                grayStartAge: 40
            }
        };

        const svg = renderAvatar(character);
        expect(svg).toContain('<svg');
        expect(svg.toUpperCase()).toContain(AvatarLogic.LIPSTICK_COLOR_HEX.red.toUpperCase());
    });

    test('SVG output contains skinGrad_ and irisGrad_ gradient IDs', () => {
        const character = {
            id: 'test-grad-1',
            age: 20,
            gender: 'male',
            appearance: AvatarLogic.generateRandomAppearance('male')
        };
        const svg = renderAvatar(character);
        expect(svg).toContain('skinGrad_');
        expect(svg).toContain('irisGrad_');
    });

    test('renderAvatar supports legacy appearance objects without new traits', () => {
        const legacyCharacter = {
            id: 'legacy-1',
            age: 30,
            gender: 'female',
            appearance: {
                skinTone: 'tone3',
                faceShape: 'round',
                eyeShape: 'round',
                eyeColor: 'hazel',
                eyebrowStyle: 'thin',
                hairStyle: 'shortStraight',
                hairColorBase: 'black',
                facialHairStyle: 'none',
                facialHairColor: 'matchHair',
                glassesStyle: 'none',
                glassesColor: 'black',
                lipstickColor: 'none',
                blushColor: 'none',
                grayStartAge: 50
                // Missing noseShape and eyelashStyle
            }
        };

        const svg = renderAvatar(legacyCharacter);
        expect(svg).toContain('<svg');
        // Check that fallback nose / lashes are handled without crashing
        expect(svg).toContain('skinGrad_');
    });

    test('renderAvatar renders all 16 hairstyles successfully', () => {
        AvatarLogic.HAIR_STYLES.forEach(style => {
            const char = {
                id: `test-hair-${style}`,
                age: 25,
                gender: 'female',
                appearance: {
                    ...AvatarLogic.generateRandomAppearance('female'),
                    hairStyle: style
                }
            };
            const svg = renderAvatar(char);
            expect(svg).toContain('<svg');
            expect(svg).toContain('</svg>');
        });
    });
});
