import 'dart:ui';
import 'package:flutter/material.dart';

class CookPage extends StatelessWidget {
  const CookPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Dark OLED
      appBar: AppBar(
        title: const Text('Cook Now', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.filter_list, color: Colors.blueAccent), onPressed: () {}),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Filters
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _buildFilterChip('Use What I Have', true),
                    _buildFilterChip('Under 30m', false),
                    _buildFilterChip('High Protein', false),
                    _buildFilterChip('Balkan Style', false),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              _buildRankedSection('Save Food / Expiry Rescue', [
                _buildMealCard('Spinach & Feta Omelet', 'Mediterranean • 15m', '98% Match', 'You have Spinach expiring tomorrow.', Colors.redAccent.shade400)
              ]),

              _buildRankedSection('Best Match for You', [
                _buildMealCard('Balkan Chicken Skillet', 'Balkan • 35m', '100% Match', 'Matches your "Balkan Grandma" Chef Style and uses available chicken.', Colors.blueAccent.shade400),
                _buildMealCard('Protein Bowl', 'General • 10m', '80% Match', 'Fast prep, meets High Protein preference.', Colors.greenAccent.shade400)
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, bool active) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: active ? Colors.blueAccent.withOpacity(0.2) : Colors.white.withOpacity(0.05),
        border: Border.all(color: active ? Colors.blueAccent : Colors.white24),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(color: active ? Colors.blueAccent : Colors.white, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildRankedSection(String title, List<Widget> cards) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          ...cards,
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildMealCard(String title, String subtitle, String match, String whyThis, Color accent) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
         color: Colors.white.withOpacity(0.04),
         borderRadius: BorderRadius.circular(20),
         border: Border.all(color: accent.withOpacity(0.3), width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
           Row(
             mainAxisAlignment: MainAxisAlignment.spaceBetween,
             children: [
               Expanded(child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold))),
               Container(
                 padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                 decoration: BoxDecoration(color: accent.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                 child: Text(match, style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.bold)),
               )
             ],
           ),
           const SizedBox(height: 4),
           Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
           const SizedBox(height: 12),
           Container(
             padding: const EdgeInsets.all(10),
             decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(8)),
             child: Row(
               children: [
                 const Icon(Icons.info_outline, color: Colors.white54, size: 16),
                 const SizedBox(width: 8),
                 Expanded(child: Text('Why this? $whyThis', style: const TextStyle(color: Colors.white70, fontSize: 12, fontStyle: FontStyle.italic))),
               ]
             )
           )
        ],
      ),
    );
  }
}
