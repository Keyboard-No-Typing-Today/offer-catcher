# Offer Catcher mobile client

React 19 + Vite 8 + Capacitor 8 Android client.

## Scripts

~~~bash
npm install
npm run dev              # web dev at http://localhost:5173
npm run build            # production web build
npm test                 # Vitest
npm run cap:sync         # copy dist into the Android project
npm run android:debug    # build a debug APK
npm run android:release  # build a signed release APK (requires keystore.properties)
~~~

## Structure

~~~text
src/lib        parsers, match engine, API client, storage, sample data
src/screens    welcome, home, resume, analyze, result, jobs, tracker, assistant, settings
src/components design system + shell
android/       Capacitor Android project (signed release setup)
public/        icon and manifest
assets/        logo source for icon/splash generation
~~~

The app works offline for the core loop; AI is optional and configured in Settings. See the repository README for the native/demo setup.
