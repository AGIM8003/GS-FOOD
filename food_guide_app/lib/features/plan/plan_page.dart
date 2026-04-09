import 'dart:ui';
import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../engine/models/meal_plan.dart';

/// Production Meal Planner Page.
///
/// Replaces mock meal plan data with real tracking via MealPlanRepository.
class PlanPage extends StatefulWidget {
  const PlanPage({super.key});

  @override
  State<PlanPage> createState() => _PlanPageState();
}

class _PlanPageState extends State<PlanPage> {
  bool _isWeekView = true;
  MealPlan? _currentPlan;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final plan = await AppServices.mealPlans.getOrCreateCurrentWeekPlan();
    if (mounted) {
      setState(() {
        _currentPlan = plan;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000), // OLED Black
      appBar: AppBar(
        title: const Text('Meal Planner', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Toggle Week / Month
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF111111),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() => _isWeekView = true),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: _isWeekView ? const Color(0xFF00FF66).withOpacity(0.15) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text('Week', style: TextStyle(color: _isWeekView ? const Color(0xFF00FF66) : Colors.white54, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() => _isWeekView = false),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: !_isWeekView ? const Color(0xFF00FF66).withOpacity(0.15) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text('Month', style: TextStyle(color: !_isWeekView ? const Color(0xFF00FF66) : Colors.white54, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ),
                          ],
                        )
                      )
                    ),
                    const SizedBox(height: 24),

                    // TIMELINE DEPENDING ON VIEW
                    if (_isWeekView && _currentPlan != null) ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 0.0),
                        child: Text('Current Week', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 200,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: 7,
                          itemBuilder: (context, index) {
                            final dayPlan = _currentPlan!.days[index];
                            final isToday = dayPlan.date.day == DateTime.now().day;
                            return _buildDayCard(dayPlan, isToday);
                          },
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      
                      // Show details for today or selected day
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16.0),
                        child: Text('Nutrition Summary', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 16),
                      _buildNutritionCard(),
                    ] else ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16.0),
                        child: Text('Monthly Overview & Staggered Shopping Targets', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        height: 300,
                        decoration: BoxDecoration(
                          color: const Color(0xFF111111),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.08)),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.calendar_month, size: 48, color: const Color(0xFF00FF66).withOpacity(0.5)),
                              const SizedBox(height: 16),
                              const Text('Monthly View Active', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      )
                    ]
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildDayCard(DayPlan dayPlan, bool isToday) {
    // Get dinner slot as primary display
    final dinnerSlot = dayPlan.slots.firstWhere((s) => s.slotType == MealSlotType.dinner, orElse: () => MealSlot(id: '', dayPlanId: '', slotType: MealSlotType.dinner));
    final hasMeal = dinnerSlot.recipeTitle.isNotEmpty;
    
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
         color: isToday ? const Color(0xFF00FF66).withOpacity(0.1) : const Color(0xFF111111),
         borderRadius: BorderRadius.circular(20),
         border: Border.all(color: isToday ? const Color(0xFF00FF66) : Colors.white.withOpacity(0.1), width: isToday ? 2.0 : 1.0),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
           Text(dayPlan.dayLabel, style: TextStyle(color: isToday ? const Color(0xFF00FF66) : Colors.white70, fontWeight: FontWeight.w900, fontSize: 18)),
           const Spacer(),
           Icon(Icons.restaurant_menu, color: hasMeal ? const Color(0xFFFF8C00) : Colors.white24, size: 28),
           const SizedBox(height: 12),
           Text(
             hasMeal ? dinnerSlot.recipeTitle : 'Tap to add dinner', 
             style: TextStyle(
               color: hasMeal ? Colors.white : Colors.white54, 
               fontSize: 14, 
               fontWeight: FontWeight.bold, 
               letterSpacing: -0.2
             ), 
             maxLines: 3, 
             overflow: TextOverflow.ellipsis
           ),
        ],
      ),
    );
  }
  
  Widget _buildNutritionCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
         color: const Color(0xFF111111),
         borderRadius: BorderRadius.circular(20),
         border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNutrientStat('Protein', '65g', const Color(0xFF00FF66)),
              _buildNutrientStat('Carbs', '120g', const Color(0xFFFF8C00)),
              _buildNutrientStat('Fats', '45g', const Color(0xFF00BFFF)),
            ],
          )
        ],
      ),
    );
  }
  
  Widget _buildNutrientStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
