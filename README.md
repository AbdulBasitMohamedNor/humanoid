# Human Meter

Human Meter is a sleek and inspiring single page app that turns your daily good deeds into a futuristic visual journey. At its heart is a glowing silhouette that fills from the bottom up in rich emerald tones as you tick off acts of prayer, charity, kindness and learning. You’ll see your progress rise like life energy flowing through a digital avatar, accompanied by motivating messages that evolve as you improve. A dynamic checklist lets you track up to ten custom deeds per day, while a shimmering progress bar and crisp percentage indicator keep you informed at a glance. The interface adapts beautifully to phones and desktops, blending glassy panels, smooth animations and a dark gradient backdrop for a truly modern feel. With built-in history, colour blind mode, sound effects and multi-language support in English, Arabic and Swedish, Human Meter makes cultivating good habits both fun and rewarding. Experience a new way to grow spiritually and watch your efforts light up.

## Run locally

```pwsh
npm install
npm start
```
Then open the printed Local URL.

## Build

```pwsh
npm run build
```

## Customize

- Edit deeds in `src/app/services/store.service.ts` (initDefault).
- Replace the SVG path in `src/app/humanmeter/humanmeter.component.html` for a different silhouette.
- Translate UI texts in `src/assets/i18n/*.json`.
