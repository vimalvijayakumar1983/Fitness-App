# Fitness App

A mobile-first health & wellness app — think HealthifyMe — for tracking the four
pillars of daily health: **what you eat, how you move, how you feel, and how you
sleep**, with an **AI coach** and smartwatch integration.

- **Mobile app:** React Native + Expo + TypeScript (this directory)
- **Backend API:** Node + Express + SQLite + Claude AI coach (`server/`)

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

## Backend

A full API lives in [`server/`](./server) — accounts (JWT auth), cloud storage
for all logs, a searchable **food database** (+ barcode lookup), goals &
analytics endpoints, and an **AI coach** powered by Claude (chat + photo
food-logging). See [`server/README.md`](./server/README.md) to run it.

The app talks to it through [`src/services/api.ts`](./src/services/api.ts).

## Roadmap (toward a world-class, HealthifyMe-grade app)

**Done — Phase 1**
- ✅ Mobile app scaffold: meals, exercise, mood, sleep, dashboard
- ✅ Health-platform integration layer (Apple Health / Health Connect ready)
- ✅ Backend: auth, cloud storage, goals, analytics
- ✅ Food database with search + barcode lookup
- ✅ AI coach (Claude): chat coaching + snap-a-photo food logging

**Next**
- Wire the app screens to the backend (auth flow, sync, food search UI)
- AI coach chat screen + camera-based food logging in-app
- Weight / water / goals screens and streaks + reminders
- Analytics charts (weekly/monthly trends) and personalized nudges
- Live wearable sync (replace the mock health provider with native modules)
- Barcode scanner UI; expand the food dataset
- Social: challenges & community; optional human coaching

## Data & privacy

All data is stored **locally on device** (AsyncStorage) for now. Health data is
sensitive — any future cloud sync must be opt-in, encrypted in transit and at
rest, and comply with the relevant health-data regulations.
