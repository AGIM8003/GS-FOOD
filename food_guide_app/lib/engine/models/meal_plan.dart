/// Production meal plan models for week/month planning.
class MealPlan {
  MealPlan({
    required this.id,
    required this.weekStartDate,
    this.days = const [],
  });

  final String id;
  final DateTime weekStartDate;
  final List<DayPlan> days;

  DateTime get weekEndDate => weekStartDate.add(const Duration(days: 6));

  DayPlan? dayForDate(DateTime date) {
    for (final d in days) {
      if (d.date.year == date.year && d.date.month == date.month && d.date.day == date.day) {
        return d;
      }
    }
    return null;
  }

  Map<String, dynamic> toMap() => {
    'id': id,
    'week_start': weekStartDate.millisecondsSinceEpoch,
  };

  factory MealPlan.fromMap(Map<String, dynamic> m, List<DayPlan> days) => MealPlan(
    id: m['id'] as String,
    weekStartDate: DateTime.fromMillisecondsSinceEpoch(m['week_start'] as int),
    days: days,
  );
}

class DayPlan {
  DayPlan({
    required this.id,
    required this.planId,
    required this.date,
    this.slots = const [],
  });

  final String id;
  final String planId;
  final DateTime date;
  final List<MealSlot> slots;

  String get dayLabel {
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return names[date.weekday - 1];
  }

  String get fullDayLabel {
    const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return names[date.weekday - 1];
  }

  bool get hasAnyMeal => slots.any((s) => s.recipeTitle.isNotEmpty);

  Map<String, dynamic> toMap() => {
    'id': id,
    'plan_id': planId,
    'date': date.millisecondsSinceEpoch,
  };

  factory DayPlan.fromMap(Map<String, dynamic> m, List<MealSlot> slots) => DayPlan(
    id: m['id'] as String,
    planId: m['plan_id'] as String,
    date: DateTime.fromMillisecondsSinceEpoch(m['date'] as int),
    slots: slots,
  );
}

enum MealSlotType {
  breakfast,
  lunch,
  dinner,
  snack;

  String get displayName {
    switch (this) {
      case MealSlotType.breakfast: return 'Breakfast';
      case MealSlotType.lunch: return 'Lunch';
      case MealSlotType.dinner: return 'Dinner';
      case MealSlotType.snack: return 'Snack';
    }
  }

  static MealSlotType fromString(String s) {
    for (final v in MealSlotType.values) {
      if (v.name == s) return v;
    }
    return MealSlotType.dinner;
  }
}

class MealSlot {
  MealSlot({
    required this.id,
    required this.dayPlanId,
    required this.slotType,
    this.recipeId,
    this.recipeTitle = '',
    this.notes = '',
  });

  final String id;
  final String dayPlanId;
  final MealSlotType slotType;
  final String? recipeId;
  final String recipeTitle;
  final String notes;

  bool get isEmpty => recipeTitle.isEmpty && (recipeId == null || recipeId!.isEmpty);

  Map<String, dynamic> toMap() => {
    'id': id,
    'day_plan_id': dayPlanId,
    'slot_type': slotType.name,
    'recipe_id': recipeId,
    'recipe_title': recipeTitle,
    'notes': notes,
  };

  factory MealSlot.fromMap(Map<String, dynamic> m) => MealSlot(
    id: m['id'] as String,
    dayPlanId: m['day_plan_id'] as String,
    slotType: MealSlotType.fromString((m['slot_type'] as String?) ?? 'dinner'),
    recipeId: m['recipe_id'] as String?,
    recipeTitle: (m['recipe_title'] as String?) ?? '',
    notes: (m['notes'] as String?) ?? '',
  );
}
