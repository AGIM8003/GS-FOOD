import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/widgets.dart';
import 'package:workmanager/workmanager.dart';

import '../bootstrap/app_bootstrap.dart';
import '../data/local/app_database.dart';
import '../data/local/settings_store.dart';
import '../data/pack/pack_update_service.dart';
import '../data/pack/trusted_pack_key.dart';

const packSyncTaskName = 'food_guide_pack_sync';
const packSyncUniqueName = 'food_guide_pack_sync_periodic';

/// Call once from [main] before [runApp].
Future<void> registerPackWorkmanager() async {
  await Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: kDebugMode,
  );
}

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    if (task != packSyncTaskName) {
      return Future.value(false);
    }
    WidgetsFlutterBinding.ensureInitialized();
    try {
      await AppBootstrap.ensureInitialized();
      final url = await SettingsStore.instance.packCdnBaseUrl;
      if (url.isEmpty) {
        return Future.value(false);
      }
      final key = await TrustedPackKey.loadFromAssets();
      final svc = PackUpdateService(AppDatabase.instance);
      final r = await svc.downloadAndInstall(url, trustedPublicKeyB64: key);
      svc.close();
      return Future.value(r.ok);
    } on Object {
      return Future.value(false);
    }
  });
}

/// Android-oriented periodic pack check (iOS scheduling varies by OS policy).
Future<void> schedulePackBackgroundSync() async {
  await Workmanager().registerPeriodicTask(
    packSyncUniqueName,
    packSyncTaskName,
    frequency: const Duration(hours: 24),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );
}

Future<void> cancelPackBackgroundSync() async {
  await Workmanager().cancelByUniqueName(packSyncUniqueName);
}
