import 'package:sqflite/sqflite.dart';
import '../../engine/models/premium_models.dart';
import '../local/app_database.dart';

class WineRepository {
  Future<List<WineCellarItem>> getAll() async {
    final db = AppDatabase.instance.db;
    final results = await db.query('wine_inventory', orderBy: 'added_at DESC');
    return results.map((m) => WineCellarItem.fromMap(m)).toList();
  }

  Future<void> save(WineCellarItem item) async {
    final db = AppDatabase.instance.db;
    await db.insert('wine_inventory', item.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> delete(String id) async {
    final db = AppDatabase.instance.db;
    await db.delete('wine_inventory', where: 'id = ?', whereArgs: [id]);
  }
}

class SustainabilityRepository {
  Future<List<SustainabilityLog>> getLogs() async {
    final db = AppDatabase.instance.db;
    final results = await db.query('sustainability_logs', orderBy: 'logged_at DESC');
    return results.map((m) => SustainabilityLog.fromMap(m)).toList();
  }

  Future<void> logAction(SustainabilityLog logObj) async {
    final db = AppDatabase.instance.db;
    await db.insert('sustainability_logs', logObj.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }
  
  Future<Map<String, double>> getAggregates() async {
    final logs = await getLogs();
    double waste = 0;
    double carbon = 0;
    double money = 0;
    for (var l in logs) {
      waste += l.wasteSavedKg;
      carbon += l.carbonNeutralizedKg;
      money += l.moneySaved;
    }
    return {
      'waste': waste,
      'carbon': carbon,
      'money': money,
    };
  }
}

class CommunityRepository {
  Future<List<CommunityPost>> getFeed() async {
    final db = AppDatabase.instance.db;
    final results = await db.query('community_posts', orderBy: 'posted_at DESC');
    if (results.isEmpty) {
      // Return a mocked "rescued" list if DB empty to show feature
      return _getMockCommunityFeed();
    }
    return results.map((m) => CommunityPost.fromMap(m)).toList();
  }

  Future<void> createPost(CommunityPost post) async {
    final db = AppDatabase.instance.db;
    await db.insert('community_posts', post.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }
  
  List<CommunityPost> _getMockCommunityFeed() {
    return [
      CommunityPost(
        chefName: 'Chef Massimo',
        title: 'Zero Waste Lemon Chicken',
        description: 'Used up my lemons right before they went bad. Squeezed every drop of juice and roasted the rinds.',
        likes: 124,
        postedAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      CommunityPost(
        chefName: 'Stellina',
        title: 'Root Veggie Stir Fry',
        description: 'Those sad looking carrots? Turned them into a museum-grade side dish.',
        likes: 89,
        postedAt: DateTime.now().subtract(const Duration(hours: 18)),
      ),
    ];
  }
}
