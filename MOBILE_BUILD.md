# Shipping the mobile app (iOS App Store + Google Play)

The app is configured for native builds with **EAS Build**. In-app purchases use
**RevenueCat** (required by Apple/Google for digital subscriptions); the web app
keeps using Stripe.

## One-time setup
1. Install the CLI and sign in:
   ```
   npm i -g eas-cli
   eas login
   eas init           # creates the EAS project + fills extra.eas.projectId
   ```
2. Set the env the app reads at build time (EAS secrets or `.env`):
   ```
   EXPO_PUBLIC_API_URL=https://your-backend.example      # your deployed API
   EXPO_PUBLIC_RC_IOS_KEY=appl_xxx                       # RevenueCat iOS public key
   EXPO_PUBLIC_RC_ANDROID_KEY=goog_xxx                   # RevenueCat Android public key
   ```
3. Fill the real values in `eas.json` → `submit.production` (Apple ID, ASC app id,
   Apple team id; Play service-account JSON).

## RevenueCat
- Create products in App Store Connect / Play Console, then an **Offering** in
  RevenueCat whose packages are identified `premium_month`, `premium_year`,
  `coached_month`, `coached_year` (the app maps tier+interval to these).
- Add a webhook → `https://your-backend.example/api/billing/revenuecat` with an
  `Authorization` header equal to `REVENUECAT_WEBHOOK_SECRET` (set the same value
  on the backend). This grants/revokes the entitlement server-side.
- `Purchases.configure` uses our user id as the RC `app_user_id`, so webhook
  events map straight to the account.

## Push notifications
- After `eas init`, `extra.eas.projectId` is set and `getExpoPushTokenAsync()`
  returns real tokens (registered to `/api/me/push-token`). Local reminders work
  without any of this.

## Build & submit
```
eas build --profile preview   --platform ios       # internal test build
eas build --profile production --platform all       # store builds
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

## Health data (native)
`app.json` already declares HealthKit usage strings and Android Health Connect
permissions. To read on-device data, add the native module in a dev build
(`react-native-health` for iOS / `expo-health-connect` for Android) and wire it
into `src/services/health/healthService` — the cloud ingestion path
(`/api/integrations/webhook`) is already live for aggregators (Terra/Rook).
