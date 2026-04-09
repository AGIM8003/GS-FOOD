import 'dart:ui';
import 'package:flutter/material.dart';

class PlanPage extends StatefulWidget {
  const PlanPage({super.key});

  @override
  State<PlanPage> createState() => _PlanPageState();
}

class _PlanPageState extends State<PlanPage> {
  bool _isWeekView = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // OLED Master
      appBar: AppBar(
        title: const Text('Meal Planner', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
               // Toggle Week / Month
               Padding(
                 padding: const EdgeInsets.symmetric(horizontal: 16.0),
                 child: Container(
                   decoration: BoxDecoration(
                     color: Colors.white.withOpacity(0.1),
                     borderRadius: BorderRadius.circular(12),
                   ),
                   child: Row(
                     children: [
                       Expanded(
                         child: GestureDetector(
                           onTap: () => setState(() => _isWeekView = true),
                           child: Container(
                             padding: const EdgeInsets.symmetric(vertical: 12),
                             decoration: BoxDecoration(
                               color: _isWeekView ? Colors.blueAccent : Colors.transparent,
                               borderRadius: BorderRadius.circular(12),
                             ),
                             alignment: Alignment.center,
                             child: const Text('Week', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                           ),
                         ),
                       ),
                       Expanded(
                         child: GestureDetector(
                           onTap: () => setState(() => _isWeekView = false),
                           child: Container(
                             padding: const EdgeInsets.symmetric(vertical: 12),
                             decoration: BoxDecoration(
                               color: !_isWeekView ? Colors.blueAccent : Colors.transparent,
                               borderRadius: BorderRadius.circular(12),
                             ),
                             alignment: Alignment.center,
                             child: const Text('Month', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                           ),
                         ),
                       ),
                     ],
                   )
                 )
               ),
               const SizedBox(height: 24),

               // TIMELINE DEPENDING ON VIEW
               if (_isWeekView) ...[
                 const Padding(
                   padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 0.0),
                   child: Text('Current Week', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
                 ),
                 const SizedBox(height: 16),
                 SizedBox(
                   height: 150,
                   child: ListView.builder(
                     scrollDirection: Axis.horizontal,
                     padding: const EdgeInsets.symmetric(horizontal: 16),
                     itemCount: 7,
                     itemBuilder: (context, index) {
                        final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        final meals = ['Fast Beef Stir-fry', 'Chicken & Rice', 'Spinach Salad', 'Tuna Bowl', 'Omelet Base', 'Roast', 'Leftover Rescue'];
                        return _buildDayCard(days[index], meals[index], index == 0);
                     },
                   ),
                 ),
               ] else ...[
                 // Month Calendar Snapshot Mock
                 const Padding(
                   padding: EdgeInsets.symmetric(horizontal: 16.0),
                   child: Text('Monthly Overview & Staggered Shopping Targets', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
                 ),
                 const SizedBox(height: 16),
                 Container(
                   margin: const EdgeInsets.symmetric(horizontal: 16),
                   height: 300,
                   decoration: BoxDecoration(
                     color: Colors.white.withOpacity(0.05),
                     borderRadius: BorderRadius.circular(20),
                     border: Border.all(color: Colors.white12),
                   ),
                   child: const Center(
                     child: Text('Monthly Calendar UI Logic\nShopping Wave Markers', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
                   ),
                 )
               ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDayCard(String day, String meal, bool isSelected) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
         color: isSelected ? Colors.blueAccent.withOpacity(0.15) : Colors.white.withOpacity(0.04),
         borderRadius: BorderRadius.circular(20),
         border: Border.all(color: isSelected ? Colors.blueAccent.shade400 : Colors.white.withOpacity(0.1), width: isSelected ? 2.0 : 1.0),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
           Text(day, style: TextStyle(color: isSelected ? Colors.blueAccent.shade100 : Colors.white54, fontWeight: FontWeight.w900, fontSize: 16)),
           const Spacer(),
           Icon(Icons.restaurant_menu, color: isSelected ? Colors.blueAccent.shade100 : Colors.white24, size: 24),
           const SizedBox(height: 12),
           Text(meal, style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: -0.2), maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
