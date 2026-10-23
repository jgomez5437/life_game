import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Theme Persistence Across Pages & Gameplay', () => {
    const rootDir = path.resolve(__dirname, '../../');
    const aboutHtmlPath = path.resolve(rootDir, 'public/about/index.html');
    const howToPlayHtmlPath = path.resolve(rootDir, 'public/how-to-play/index.html');
    const indexHtmlPath = path.resolve(rootDir, 'public/index.html');
    const stylesCssPath = path.resolve(rootDir, 'public/styles.css');
    const mainJsPath = path.resolve(rootDir, 'public/src/core/main.js');

    const aboutHtml = fs.readFileSync(aboutHtmlPath, 'utf8');
    const howToPlayHtml = fs.readFileSync(howToPlayHtmlPath, 'utf8');
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');
    const mainJs = fs.readFileSync(mainJsPath, 'utf8');

    describe('Head Theme Scripts for Zero FOUC & Persistence', () => {
        test('about/index.html contains theme initialization script in head', () => {
            expect(aboutHtml).toContain("localStorage.getItem('life_game_theme')");
            expect(aboutHtml).toContain("document.documentElement.classList.add('light-mode')");
            expect(aboutHtml).toContain("document.documentElement.classList.add('onyx-gold-mode')");
        });

        test('how-to-play/index.html contains theme initialization script in head', () => {
            expect(howToPlayHtml).toContain("localStorage.getItem('life_game_theme')");
            expect(howToPlayHtml).toContain("document.documentElement.classList.add('light-mode')");
            expect(howToPlayHtml).toContain("document.documentElement.classList.add('onyx-gold-mode')");
        });

        test('index.html contains robust theme initialization script checking document.body', () => {
            expect(indexHtml).toContain("localStorage.getItem('life_game_theme')");
            expect(indexHtml).toContain("document.documentElement.classList.add('light-mode')");
            expect(indexHtml).toContain("if (document.body)");
        });
    });

    describe('Static Page Navigation & Relative Links', () => {
        test('about/index.html uses root-relative paths for internal game navigation', () => {
            expect(aboutHtml).toContain('href="/"');
            expect(aboutHtml).toContain('href="/how-to-play"');
            expect(aboutHtml).not.toContain('href="https://startalife.app"');
            expect(aboutHtml).not.toContain('href="https://startalife.app/how-to-play"');
        });

        test('how-to-play/index.html uses root-relative paths for internal game navigation', () => {
            expect(howToPlayHtml).toContain('href="/"');
            expect(howToPlayHtml).toContain('href="/about"');
            expect(howToPlayHtml).not.toContain('href="https://startalife.app"');
            expect(howToPlayHtml).not.toContain('href="https://startalife.app/about"');
        });

        test('neither about nor how-to-play has hardcoded bg-slate-900 on body tag', () => {
            expect(aboutHtml).not.toMatch(/<body[^>]*bg-slate-900/);
            expect(howToPlayHtml).not.toMatch(/<body[^>]*bg-slate-900/);
        });

        test('about/index.html and how-to-play/index.html include static-theme-toggle in header', () => {
            expect(aboutHtml).toContain('id="static-theme-toggle"');
            expect(aboutHtml).toContain('id="static-theme-icon"');
            expect(howToPlayHtml).toContain('id="static-theme-toggle"');
            expect(howToPlayHtml).toContain('id="static-theme-icon"');
        });
    });

    describe('styles.css Specificity & Theme Overrides', () => {
        test('styles.css contains high specificity body.light-mode rules with !important', () => {
            expect(stylesCss).toContain('body.light-mode,');
            expect(stylesCss).toContain('body.light-mode.bg-slate-900');
            expect(stylesCss).toContain('background-color: #f8fafc !important;');
            expect(stylesCss).toContain('color: #0f172a !important;');
        });

        test('styles.css defines header static-theme-toggle styles in light mode', () => {
            expect(stylesCss).toContain('body.light-mode #static-theme-toggle');
        });
    });

    describe('Application Startup Theme Synchronization', () => {
        test('main.js invokes applyTheme in onload', () => {
            expect(mainJs).toContain('applyTheme()');
        });
    });

    describe('DOM Theme Toggle Functional Behavior', () => {
        beforeEach(() => {
            localStorage.clear();
            document.documentElement.className = '';
            document.body.className = '';
        });

        test('toggling theme to light mode updates document classes and localStorage', () => {
            document.documentElement.classList.add('light-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('life_game_theme', 'light');

            expect(localStorage.getItem('life_game_theme')).toBe('light');
            expect(document.documentElement.classList.contains('light-mode')).toBe(true);
            expect(document.body.classList.contains('light-mode')).toBe(true);
        });

        test('toggling theme back to dark mode removes light-mode classes and stores dark in localStorage', () => {
            document.documentElement.classList.remove('light-mode');
            document.body.classList.remove('light-mode');
            localStorage.setItem('life_game_theme', 'dark');

            expect(localStorage.getItem('life_game_theme')).toBe('dark');
            expect(document.documentElement.classList.contains('light-mode')).toBe(false);
            expect(document.body.classList.contains('light-mode')).toBe(false);
        });
    });
});
