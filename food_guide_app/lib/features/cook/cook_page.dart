import 'dart:ui';
import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../engine/models/inventory_item.dart';
import '../../engine/models/recipe.dart';
import '../../engine/models/user_preferences.dart';

/// Production Cook Page.
///
/// Replaces mock recipe data with deterministic scoring from MatchEngine,
/// backed by real inventory and safety guards.
class CookPage extends StatefulWidget {
  const CookPage({super.key});

  @override
  State<CookPage> createState() => _CookPageState();
}

class _CookPageState extends State<CookPage> {
  List<RecipeMatch> _rescueMatches = [];
  List<RecipeMatch> _bestMatches = [];
  UserPreferences? _prefs;
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
    
    // Generate recipes and rank them based on real inventory
    final recipes = AppServices.matchEngine.getEmergencyRecipes();
    final ranked = AppServices.matchEngine.rankRecipes(recipes, allItems);

    if (mounted) {
      setState(() {
        // Split into rescue items vs best matches
        _rescueMatches = ranked.where((m) => m.isRescueMatch).toList();
        _bestMatches = ranked.where((m) => !m.isRescueMatch).toList();
        _prefs = prefs;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000), // OLED Black
      appBar: AppBar(
        title: const Text('Cook Now', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.filter_list, color: Color(0xFF00FF66)), onPressed: () {}),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : SingleChildScrollView(
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
                          if (_prefs?.highProtein == true) _buildFilterChip('High Protein', true),
                          if (_prefs?.familySafe == true) _buildFilterChip('Family Safe', true),
                          _buildFilterChip('Chef Style: ${AppServices.personaEngine.getPersona(_prefs?.chefPersonaId ?? 'core_assistant').style}', false),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    if (_rescueMatches.isNotEmpty)
                      _buildRankedSection('Save Food / Expiry Rescue', _rescueMatches, isRescue: true),

                    if (_bestMatches.isNotEmpty)
                      _buildRankedSection('Best Matches for You', _bestMatches, isRescue: false),

                    if (_rescueMatches.isEmpty && _bestMatches.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Center(
                          child: Text(
                            'No matches found. Add items to your pantry or ask the chef for ideas.',
                            style: TextStyle(color: Colors.white54),
                            textAlign: TextAlign.center,
                          )
                        ),
                      )
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
        color: active ? const Color(0xFF00FF66).withOpacity(0.15) : const Color(0xFF111111),
        border: Border.all(color: active ? const Color(0xFF00FF66) : Colors.white24),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(color: active ? const Color(0xFF00FF66) : Colors.white, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildRankedSection(String title, List<RecipeMatch> matches, {required bool isRescue}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
          const SizedBox(height: 12),
          ...matches.map((m) => _buildMealCard(m, isRescue: isRescue)).toList(),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildMealCard(RecipeMatch match, {required bool isRescue}) {
    // Red/Orange for rescue, Neon Green for standard
    final accent = isRescue ? const Color(0xFFFF3333) : const Color(0xFF00FF66);
    
    // Explainability Engine text
    final whyThis = AppServices.explainability.whyRecommended(match);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
         color: const Color(0xFF111111),
         borderRadius: BorderRadius.circular(20),
         border: Border.all(color: accent.withOpacity(0.3), width: 1.5),
         boxShadow: [
           BoxShadow(color: accent.withOpacity(0.05), blurRadius: 10, spreadRadius: 1)
         ]
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
           Row(
             mainAxisAlignment: MainAxisAlignment.spaceBetween,
             children: [
               Expanded(child: Text(match.recipe.title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold))),
               Container(
                 padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                 decoration: BoxDecoration(color: accent.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                 child: Text(match.matchDisplay, style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.bold)),
               )
             ],
           ),
           const SizedBox(height: 4),
           Text('${match.recipe.cuisine} • ${match.recipe.timeDisplay}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
           
           if (!match.isFullMatch && match.missingIngredients.isNotEmpty) ...[
             const SizedBox(height: 8),
             Text('Missing: ${match.missingIngredients.join(', ')}', style: const TextStyle(color: Color(0xFFFF8C00), fontSize: 12, fontWeight: FontWeight.w500)),
           ],

           const SizedBox(height: 12),
           Container(
             padding: const EdgeInsets.all(12),
             decoration: BoxDecoration(
               color: const Color(0xFF080808), 
               borderRadius: BorderRadius.circular(12),
               border: Border.all(color: Colors.white.withOpacity(0.05))
             ),
             child: Row(
               crossAxisAlignment: CrossAxisAlignment.start,
               children: [
                 Icon(isRescue ? Icons.health_and_safety : Icons.lightbulb_outline, color: accent.withOpacity(0.8), size: 16),
                 const SizedBox(width: 8),
                 Expanded(child: Text(whyThis, style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.3))),
               ]
             )
           )
        ],
      ),
    );
  }
}
