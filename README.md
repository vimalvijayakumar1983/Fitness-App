# Fitness App

A mobile-first health & wellness app for tracking the four pillars of daily
health: **what you eat, how you move, how you feel, and how you sleep.**

Built with **React Native + Expo + TypeScript**.

## Features (current scaffold)

The app ships as a full feature scaffold — every core area is wired end to end
(UI → shared state → local persistence), so each can be deepened independently.

| Tab | What it does today |
| --- | --- |
| **Today** | Dashboard with daily calories in/out, steps, active time, sleep & mood. Pull-to-refresh syncs the smartwatch. |
| **Meals** | Log food by meal type with calories; see today's meals and totals. |
| **Exercise** | Manual workout logging **+** a health-platform sync layer (steps, workouts, heart rate). |
| **Mind** | Mood / stress / energy check-ins with notes. |
| **Sleep** | Log bedtime, wake time and quality; sync sleep from the watch. |

### Smartwatch / health integration

All device-health access goes through one seam: `src/services/health/healthService.ts`.
The rest of the app never calls HealthKit / Health Connect directly. Today it
uses a **mock provider** so everything works in Expo Go and on web. To go live:

- **iOS** → add [`react-native-health`](https://github.com/agencyenterprise/react-native-health) (HealthKit). Requires a dev/EAS build.
- **Android** → add [`react-native-health-connect`](https://github.com/matinzd/react-native-health-connect) (Health Connect / Google Fit).
- Implement the `HealthProvider` interface and call `setHealthProvider(...)` at startup.

## Project structure

```
src/
  components/      Reusable UI (Card, buttons, selectors, stat tiles)
  context/         DataProvider — app-wide state + persistence
  models/          TypeScript domain types (Meal, Exercise, Mood, Sleep)
  navigation/      Bottom-tab navigator
  screens/         One screen per tab
  services/        storage (AsyncStorage) + health integration layer
  theme/           Color palette
  utils/           Date helpers + dashboard selectors
```

## Getting started

```bash
npm install
npm start         # then press i / a / w for iOS, Android, web
```

> First run needs `npx expo install` to align native dependency versions with
> the installed Expo SDK.

## Roadmap

See the issues / project board for the path toward a world-class app
(extensive food database & barcode scanning, AI coaching, water & weight
tracking, plans, social, and live wearable sync). Current code is the
foundation those features build on.

## Data & privacy

All data is stored **locally on device** (AsyncStorage) for now. Health data is
sensitive — any future cloud sync must be opt-in, encrypted in transit and at
rest, and comply with the relevant health-data regulations.
