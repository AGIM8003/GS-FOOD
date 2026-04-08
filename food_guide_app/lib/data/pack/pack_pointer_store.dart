import 'package:shared_preferences/shared_preferences.dart';

/// Points to the last successfully activated pack directory on disk.
class PackPointerStore {
  PackPointerStore._();

  static final PackPointerStore instance = PackPointerStore._();

  static const _key = 'pack.active_path';

  Future<String?> get activePackPath async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_key);
  }

  Future<void> setActivePackPath(String? path) async {
    final prefs = await SharedPreferences.getInstance();
    if (path == null || path.isEmpty) {
      await prefs.remove(_key);
    } else {
      await prefs.setString(_key, path);
    }
  }
}
