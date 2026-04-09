import 'dart:ui';
import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../engine/models/inventory_item.dart';
import '../../engine/models/recipe.dart';

/// Production Home Dashboard.
///
/// Replaces all static mock data with real data from:
/// - InventoryRepository (expiry alerts)
/// - MatchEngine (deterministic recipe matches)
class HomeDashboard extends StatefulWidget {
  const HomeDashboard({super.key});

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  List<InventoryItem> _urgentItems = [];
  List<RecipeMatch> _cookToday = [];
  bool _isLoading = true;
  String _chefName = 'Chef';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    // Load real inventory urgency
    final urgent = await AppServices.inventory.getExpiringSoon(days: 3);
    
    // Load recipe matches
    final allItems = await AppServices.inventory.getAll();
    final emergency = AppServices.matchEngine.getEmergencyRecipes();
    final matches = AppServices.matchEngine.rankRecipes(emergency, allItems);
    
    final prefs = await AppServices.preferences.load();

    if (mounted) {
      setState(() {
        _urgentItems = AppServices.expiryEngine.sortByUrgency(urgent);
        _cookToday = matches;
        _chefName = prefs.chefPersonaId.isNotEmpty ? prefs.chefPersonaId : 'Chef';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Pure OLED-Black theme per Obsidian Gourmet
    return Scaffold(
      backgroundColor: const Color(0xFF000000), 
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : SingleChildScrollView(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 24, bottom: 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // HEADER (Neon Green style)
                    _buildNeonHeader(),
                    
                    const SizedBox(height: 32),

                    // EXPIRY ALERTS
                    if (_urgentItems.isNotEmpty)
                      ..._urgentItems.take(2).map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildAlertCard(item),
                      )),

                    if (_urgentItems.isEmpty)
                      _buildFreshCard(),

                    const SizedBox(height: 24),

                    // COOK TODAY
                    const Text('Cook Today', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
                    const SizedBox(height: 16),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _cookToday.take(3).map((match) => _buildCookCard(match)).toList(),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // QUICK CAPTURE ROW
                    const Text('Quick Capture', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildQuickAction(Icons.camera_alt, 'Photo'),
                        _buildQuickAction(Icons.qr_code_scanner, 'Barcode'),
                        _buildQuickAction(Icons.receipt_long, 'Receipt'),
                        _buildQuickAction(Icons.edit, 'Manual'),
                      ],
                    )
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildNeonHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF00FF66), Color(0xFF00CC55)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Good Morning, ${_chefName[0].toUpperCase()}${_chefName.substring(1)}', 
                style: TextStyle(color: Colors.black.withOpacity(0.7), fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const CircleAvatar(
                radius: 16,
                backgroundColor: Colors.black26,
                child: Icon(Icons.person, color: Colors.black54, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            _getDynamicDayGreeting(), 
            style: const TextStyle(color: Colors.black, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -1.0),
          ),
          const SizedBox(height: 16),
          // Short summary
          if (_urgentItems.isNotEmpty)
            Text(
              '• ${_urgentItems.length} items expiring soon',
              style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w500),
            )
          else
            const Text(
              '• Everything looks fresh',
              style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w500),
            ),
        ],
      ),
    );
  }

  String _getDynamicDayGreeting() {
    final now = DateTime.now();
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    final dayStr = days[now.weekday - 1];
    
    final hour = now.hour;
    String timeStr;
    if (hour < 12) timeStr = 'MORNING';
    else if (hour < 17) timeStr = 'AFTERNOON';
    else if (hour < 21) timeStr = 'EVENING';
    else timeStr = 'NIGHT';
    
    return '$dayStr $timeStr';
  }

  Widget _buildAlertCard(InventoryItem item) {
    final isCritical = item.isCritical;
    final color = isCritical ? const Color(0xFFFF3333) : const Color(0xFFFF8C00); // Red or Orange
    final icon = isCritical ? Icons.warning_rounded : Icons.access_time_rounded;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111111), // Glassmorphism dark base
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 10,
            spreadRadius: 1,
          )
        ]
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                Text(AppServices.expiryEngine.urgencyMessage(item), style: const TextStyle(color: Colors.white70, fontSize: 14)),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: color, 
                      foregroundColor: Colors.black, 
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: () {},
                    child: const Text('RESCUE NOW', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
  
  Widget _buildFreshCard() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        border: Border.all(color: Colors.white.withOpacity(0.1), width: 1.0),
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle_rounded, color: Color(0xFF00FF66), size: 32),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Kitchen is Safe', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                SizedBox(height: 4),
                Text('No items are expiring in the next 3 days. Great job preventing waste!', style: TextStyle(color: Colors.white70, fontSize: 14)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildCookCard(RecipeMatch match) {
    return Container(
      margin: const EdgeInsets.only(right: 16),
      width: 180,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFFF8C00).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.restaurant, color: Color(0xFFFF8C00), size: 24),
          ),
          const SizedBox(height: 16),
          Text(match.recipe.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, height: 1.2), maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 8),
          Text('${match.recipe.timeDisplay} • ${match.matchDisplay}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
          const SizedBox(height: 8),
          Text(
            match.isFullMatch ? 'Ready to cook' : '${match.missingIngredients.length} missing', 
            style: TextStyle(
              color: match.isFullMatch ? const Color(0xFF00FF66) : const Color(0xFFFF3333), 
              fontSize: 12, 
              fontWeight: FontWeight.w700
            )
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF151515),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: Icon(icon, color: const Color(0xFFFF8C00), size: 24),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
