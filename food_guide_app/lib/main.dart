import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import 'app/food_guide_app.dart';
import 'workers/pack_sync_worker.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb) {
    await registerPackWorkmanager();
  }
  runApp(const FoodGuideApp());
}
