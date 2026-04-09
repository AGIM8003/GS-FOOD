import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/i18n.dart';
import '../../ui/golden_gourmet_scaffold.dart';
import '../../ui/sanctity_header.dart';

import '../../app/services.dart';
import '../../engine/models/inventory_item.dart';
import '../../engine/models/recipe.dart';
import '../../engine/models/user_preferences.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<InventoryItem> _items = [];
  UserPreferences? _prefs;
  RecipeMatch? _perfectMatch;
  int _buyNowCount = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final allItems = await AppServices.inventory.getAll();
    final prefs = await AppServices.preferences.load();
    final recipes = AppServices.matchEngine.getEmergencyRecipes();
    final ranked = AppServices.matchEngine.rankRecipes(recipes, allItems);
    
    final shopping = await AppServices.shopping.getGroupedByWave();
    
    if (mounted) {
      setState(() {
        _items = allItems;
        _prefs = prefs;
        if (ranked.isNotEmpty) {
          _perfectMatch = ranked.first; 
        }
        // SUPPORT-LAYER: Cached length check avoids parsing full models continuously in UI.
        _buyNowCount = shopping[ShoppingWave.buyNow]?.length ?? 0;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const GoldenGourmetScaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Color(0xFF00FF66))),
      );
    }

    final int urgentCount = _items.where((i) => i.isUrgent).length;
    final int requiredProtein = _prefs?.highProtein == true ? 120 : 60; // Example stat

      backgroundColor: const Color(0xFF0A0A0A), // Calm Dark Mode
      appBar: AppBar(
        title: const Text('Home', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_prefs != null && _prefs!.householdMembers.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Row(
                    children: [
                      const Icon(Icons.family_restroom, color: Colors.white54, size: 16),
                      const SizedBox(width: 8),
                      Text('Cooking for ${_prefs!.householdMembers.where((m) => m.isIncludedInSharedMeals).length} people today', style: const TextStyle(color: Colors.white54, fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),

              // Action 1: What to cook tonight (The Perfect Match)
              if (_perfectMatch != null) ...[
                const Text('Top Suggestion', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _buildEditorialHeroCard(_perfectMatch!),
                const SizedBox(height: 32),
              ],

              // Action 2: What must be used (Rescue Now)
              if (urgentCount > 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Rescue Now', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('$urgentCount Expiring', style: const TextStyle(color: Color(0xFFFF3333), fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                ..._items.where((i) => i.isUrgent).take(3).map((item) => 
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF3333).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFF3333).withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.warning_amber, color: Color(0xFFFF3333), size: 16),
                        const SizedBox(width: 12),
                        Expanded(child: Text(item.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                        Text('${item.daysRemaining} days left', style: const TextStyle(color: Color(0xFFFF3333), fontSize: 12)),
                      ],
                    ),
                  )
                ).toList(),
                const SizedBox(height: 32),
              ],

              // Action 3: What to buy now
              if (_buyNowCount > 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Shopping Deficits', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('$_buyNowCount Urgent', style: const TextStyle(color: Color(0xFFFF8C00), fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF151515),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shopping_cart, color: Color(0xFFFF8C00)),
                      const SizedBox(width: 16),
                      const Expanded(child: Text('You have immediate missing ingredients for your planned meals or predictive staples.', style: TextStyle(color: Colors.white70, fontSize: 13))),
                      const Icon(Icons.chevron_right, color: Colors.white24),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],

              // Focus Block: Safety Rules (If active)
              if (_prefs != null && (_prefs!.allergens.isNotEmpty || _prefs!.activeMedicalConditions.isNotEmpty || _prefs!.activeRitualProtocol != 'none')) ...[
                const Text('Active Guardians', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: [
                    if (_prefs!.activeRitualProtocol != 'none')
                      Chip(label: Text(_prefs!.activeRitualProtocol.toUpperCase()), backgroundColor: const Color(0xFF00FF66).withOpacity(0.1), labelStyle: const TextStyle(color: Color(0xFF00FF66), fontSize: 10, fontWeight: FontWeight.bold)),
                    ..._prefs!.allergens.map((a) => Chip(label: Text('NO ${a.toUpperCase()}'), backgroundColor: const Color(0xFFFF3333).withOpacity(0.1), labelStyle: const TextStyle(color: Color(0xFFFF3333), fontSize: 10, fontWeight: FontWeight.bold))),
                    ..._prefs!.activeMedicalConditions.map((m) => Chip(label: Text(m.toUpperCase()), backgroundColor: Colors.white12, labelStyle: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold))),
                  ],
                ),
              ],

            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBriefingStat(IconData icon, String label, String value, Color accent, double progress) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: accent),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: -0.5)),
          ],
        ),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: Colors.white12,
          valueColor: AlwaysStoppedAnimation<Color>(accent),
          minHeight: 4,
          borderRadius: BorderRadius.circular(2),
        )
      ],
    );
  }

  Widget _buildEditorialHeroCard(RecipeMatch match) {
    final bool isRescue = match.isRescueMatch;
    
    return Container(
      height: 340,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        boxShadow: const [
          BoxShadow(color: Color(0x33FF6B00), blurRadius: 20, spreadRadius: 2)
        ],
        image: const DecorationImage(
          image: NetworkImage('https://images.unsplash.com/photo-1544025162-8315147817eb?q=80&w=1400&fit=crop'), // Placeholder, would be AI generated image in prod
          fit: BoxFit.cover,
        )
      ),
      child: Stack(
        children: [
          // Gradient Overlay
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.2),
                  Colors.black.withOpacity(0.4),
                  Colors.black.withOpacity(0.9),
                ],
                stops: const [0.0, 0.4, 1.0],
              )
            ),
          ),
          
          // Optional Header Chip
          if (isRescue)
            Positioned(
              top: 16, left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF8C00), // Orange
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.priority_high, color: Colors.black, size: 12),
                    const SizedBox(width: 4),
                    Text('Uses ${match.urgentIngredientsUsed} Expiring Items', style: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: -0.2)),
                  ],
                ),
              ),
            ),
            
          // Bottom Content
          Positioned(
            bottom: 24, left: 24, right: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(match.recipe.title, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -0.5, height: 1.1)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.schedule, color: Colors.white.withOpacity(0.6), size: 14),
                    const SizedBox(width: 4),
                    Text(match.recipe.timeDisplay.toUpperCase(), style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                    const SizedBox(width: 16),
                    Icon(Icons.restaurant, color: Colors.white.withOpacity(0.6), size: 14),
                    const SizedBox(width: 4),
                    Text('420 KCAL', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                    const SizedBox(width: 16),
                    const Icon(Icons.biotech, color: Color(0xFF00FF66), size: 14),
                    const SizedBox(width: 4),
                    Text(match.matchDisplay.toUpperCase(), style: const TextStyle(color: Color(0xFF00FF66), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
