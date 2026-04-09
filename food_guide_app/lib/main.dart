import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import 'app/food_guide_app.dart';
import 'app/services.dart';
import 'data/local/app_database.dart';
import 'workers/pack_sync_worker.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Database and Services
  await AppDatabase.instance.open();
  AppServices.register();

  if (!kIsWeb) {
    await registerPackWorkmanager();
  }
  
  runApp(const FoodGuideApp());
}
