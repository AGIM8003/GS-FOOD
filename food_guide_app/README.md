# Food Guide App

Cross-platform (**Android** + **iOS**) client for the **Food Guide App** product, implemented per **`../GS-FOOD3.md`** (Flutter shell §11, primary tabs §17.3).

## What works (v0.2+)

- **Scan:** barcode via `mobile_scanner`; **Scan label (OCR)** via `google_mlkit_text_recognition` + `image_picker`; Open Food Facts lookup + SQLite cache on barcode sheet; bundled pack JSON preview.
- **Ask:** draft text saved locally (rules engine later).
- **Cook:** local template suggestions; optional **POST /v1/cook/suggest** when **Cook cloud API** + **API base URL** are set (see `../server`).
- **Saved:** list, pull-to-refresh, swipe-to-delete, quick “Add note”.
- **Use first:** demo rows + add/delete (local DB).
- **Settings:** cloud assist, **Cook cloud API**, analytics, **API base URL**, region/locale, **Ping health** (`GET /health`), SLM bundle opt-in + path; trusted pack key status.
- **Offline banner:** `connectivity_plus` strip on primary shell.
- **Packs:** signed install pipeline (`SignedPackInstaller` + `pack_installations` table); trusted Ed25519 key at `assets/config/pack_trusted_public_key.b64` (empty = hash-only integrity).
- **Optional TFLite:** `FoodClassifierTflite` loads `assets/models/food_coarse.tflite` when you add the file.
- **Bootstrap:** SQLite migrations (v4); Open Food Facts `UserAgent`; tests use `sqflite_common_ffi` (`test/flutter_test_config.dart`).

## Prerequisites

- [Flutter](https://docs.flutter.dev/get-started/install) (stable), 3.24+ recommended
- **Android:** Android Studio, SDK, device or emulator  
- **iOS (macOS only):** Xcode, CocoaPods, simulator or device

## One-time: generate `android/` and `ios/`

From **`food_guide_app`**:

```bash
flutter create . --org com.foodguide --project-name food_guide_app --platforms=android,ios
```

Then ensure **camera permission** is declared:

**Android** — in `android/app/src/main/AndroidManifest.xml`, inside `<manifest>` (before `<application>`):

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

**iOS** — in `ios/Runner/Info.plist`, add:

```xml
<key>NSCameraUsageDescription</key>
<string>Camera is used to scan barcodes for food storage and product hints.</string>
```

`android/local.properties` (or Android Studio):

```properties
flutter.sdk=C:\\path\\to\\flutter
sdk.dir=C:\\Users\\YOU\\AppData\\Local\\Android\\sdk
```

## Run

```bash
cd food_guide_app
flutter pub get
flutter analyze
flutter test
flutter run
```

- Android: `flutter run -d android`  
- iOS: `flutter run -d ios` (on Mac)

## Publish

- **Android:** configure signing, then `flutter build appbundle` → Play Console.  
- **iOS:** set bundle id in Xcode, signing team, then `flutter build ipa` → App Store Connect.

## Project layout

| Path | Role |
|------|------|
| `lib/app/` | `MaterialApp`, theme, shell, `AppServices` |
| `lib/bootstrap/` | DB + service init |
| `lib/data/` | SQLite, settings store, repositories |
| `lib/features/*` | Scan, Ask, Cook, Use first, Audits, Saved, Settings |

**Backend stub:** `../server/app/main.py` — `uvicorn app.main:app --reload` from `../server` after `pip install -r requirements.txt`. Use `http://10.0.2.2:8000` as API base URL on Android emulator.

**CI:** `../.github/workflows/flutter.yml` runs `flutter analyze` + `flutter test`.

**Publication / eval:** `docs/PUBLICATION_CHECKLIST.md`, golden fixtures under `test/fixtures/`.

**Next slices:** rules engine (§6), shelf vision / MediaPipe detector, SQLCipher (§29.1).
