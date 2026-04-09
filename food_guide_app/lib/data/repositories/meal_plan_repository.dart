import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import '../local/app_database.dart';
import '../../engine/models/meal_plan.dart';

/// Real meal plan repository — replaces hardcoded plan data.
class MealPlanRepository {
  MealPlanRepository(this._db);
  final AppDatabase _db;
  static const _uuid = Uuid();

  Database get _d => _db.db;

  // ── Plan CRUD ────────────────────────────────────────────────

  Future<String> createPlan(DateTime weekStart) async {
    final id = _uuid.v4();
    await _d.insert('meal_plans', {'id': id, 'week_start': weekStart.millisecondsSinceEpoch});
    // Create 7 day plans for the week
    for (int i = 0; i < 7; i++) {
      final dayId = _uuid.v4();
      final dayDate = weekStart.add(Duration(days: i));
      await _d.insert('day_plans', {
        'id': dayId,
        'plan_id': id,
        'date': dayDate.millisecondsSinceEpoch,
      });
    }
    return id;
  }

  Future<MealPlan?> getPlanForWeek(DateTime weekStart) async {
    final normalized = _normalizeToMonday(weekStart);
    final rows = await _d.query('meal_plans', where: 'week_start = ?', whereArgs: [normalized.millisecondsSinceEpoch]);
    if (rows.isEmpty) return null;
    return _buildPlan(rows.first);
  }

  Future<MealPlan> getOrCreateCurrentWeekPlan() async {
    final monday = _normalizeToMonday(DateTime.now());
    final existing = await getPlanForWeek(monday);
    if (existing != null) return existing;
    final id = await createPlan(monday);
    return (await getPlanById(id))!;
  }

  Future<MealPlan?> getPlanById(String id) async {
    final rows = await _d.query('meal_plans', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return null;
    return _buildPlan(rows.first);
  }

  // ── Meal Slot CRUD ───────────────────────────────────────────

  Future<void> setMealSlot({
    required String dayPlanId,
    required MealSlotType slotType,
    String? recipeId,
    String recipeTitle = '',
    String notes = '',
  }) async {
    final id = _uuid.v4();
    // Remove existing slot of same type for this day
    await _d.delete('meal_slots', where: 'day_plan_id = ? AND slot_type = ?', whereArgs: [dayPlanId, slotType.name]);
    if (recipeTitle.isNotEmpty || (recipeId != null && recipeId.isNotEmpty)) {
      await _d.insert('meal_slots', MealSlot(
        id: id,
        dayPlanId: dayPlanId,
        slotType: slotType,
        recipeId: recipeId,
        recipeTitle: recipeTitle,
        notes: notes,
      ).toMap());
    }
  }

  Future<void> clearSlot(String slotId) async {
    await _d.delete('meal_slots', where: 'id = ?', whereArgs: [slotId]);
  }

  // ── Internal ────────────────────────────────────────────────

  Future<MealPlan> _buildPlan(Map<String, dynamic> planRow) async {
    final planId = planRow['id'] as String;
    final dayRows = await _d.query('day_plans', where: 'plan_id = ?', whereArgs: [planId], orderBy: 'date ASC');
    final days = <DayPlan>[];
    for (final dayRow in dayRows) {
      final dayId = dayRow['id'] as String;
      final slotRows = await _d.query('meal_slots', where: 'day_plan_id = ?', whereArgs: [dayId]);
      final slots = slotRows.map((s) => MealSlot.fromMap(s)).toList();
      days.add(DayPlan.fromMap(dayRow, slots));
    }
    return MealPlan.fromMap(planRow, days);
  }

  DateTime _normalizeToMonday(DateTime date) {
    final d = DateTime(date.year, date.month, date.day);
    return d.subtract(Duration(days: d.weekday - 1));
  }
}
