import 'package:flutter/widgets.dart';
import 'package:openfoodfacts/openfoodfacts.dart';

import '../app/services.dart';
import '../data/local/app_database.dart';
import '../data/local/secure_db_key_store.dart';

/// One-shot init before [MaterialApp] (DB, etc.).
class AppBootstrap {
  AppBootstrap._();

  static bool _done = false;

  static Future<void> ensureInitialized() async {
    if (_done) return;
    WidgetsFlutterBinding.ensureInitialized();
    try {
      await SecureDbKeyStore.instance.getOrCreatePassphrase();
    } on Object {
      // Secure storage can fail on some desktop simulators; SQLCipher hook-up uses this when enabled.
    }
    OpenFoodAPIConfiguration.userAgent = UserAgent(
      name: 'FoodGuide',
      version: '0.2.0+2',
    );
    await AppDatabase.instance.open();
    AppServices.register();
    await AppServices.initializePerception();
    _done = true;
  }
}
