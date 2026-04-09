import 'dart:ui';
import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../engine/models/inventory_item.dart';
import '../../engine/models/recipe.dart';
import '../../engine/models/user_preferences.dart';
import '../../ui/golden_gourmet_scaffold.dart';
import '../../ui/sanctity_header.dart';
import '../premium/molecular_flavor_lab_page.dart';
import 'recipe_detail_sheet.dart';

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
  bool _isSynthesizing = false;

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
    return GoldenGourmetScaffold(
      backgroundColor: const Color(0xFF000000), // OLED Black
      appBar: SanctityHeader(
        title: 'Cook Now',
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
                    
                    if (_rescueMatches.isNotEmpty) ...[
                      _buildRankedSection('Save Food / Expiry Rescue', _rescueMatches, isRescue: true),
                      
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00FF66).withOpacity(0.1),
                              side: const BorderSide(color: Color(0xFF00FF66)),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            icon: _isSynthesizing 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00FF66)))
                                : const Icon(Icons.auto_awesome, color: Color(0xFF00FF66)),
                            label: Text(_isSynthesizing ? 'Synthesizing...' : 'Synthesize Exact Match (Zero Waste)', 
                              style: const TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold)
                            ),
                            onPressed: _isSynthesizing ? null : _synthesizeExactMatch,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFF8C00).withOpacity(0.1),
                              side: const BorderSide(color: Color(0xFFFF8C00)),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            icon: const Icon(Icons.science, color: Color(0xFFFF8C00)),
                            label: const Text('Molecular Flavor Lab (SOTA)', 
                              style: TextStyle(color: Color(0xFFFF8C00), fontWeight: FontWeight.bold)
                            ),
                            onPressed: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const MolecularFlavorLabPage()));
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

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
    final accent = isRescue ? const Color(0xFFFF3333) : const Color(0xFF00FF66);
    final whyThis = AppServices.explainability.whyRecommended(match);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      height: 340, // OLED Editorial High Impact
      decoration: BoxDecoration(
         borderRadius: BorderRadius.circular(24),
         border: Border.all(color: accent.withOpacity(0.3), width: 1.5),
         boxShadow: [
           BoxShadow(color: accent.withOpacity(0.1), blurRadius: 20, spreadRadius: 2)
         ],
         // Placeholder image mimicking full-bleed editorial imagery.
         image: const DecorationImage(
           image: NetworkImage('https://images.unsplash.com/photo-1544025162-8315147817eb?q=80&w=1400&fit=crop'), 
           fit: BoxFit.cover
         )
      ),
      child: Stack(
        children: [
          // Dark gradient overlay to ensure text legibility
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withOpacity(0.5),
                  const Color(0xFF000000).withOpacity(0.9),
                ],
                stops: const [0.0, 0.4, 1.0],
              )
            ),
          ),
          
          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(child: Text(match.recipe.title, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(12)),
                      child: Text(match.matchDisplay, style: const TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.w900)),
                    )
                  ],
                ),
                const SizedBox(height: 8),
                Text('${match.recipe.cuisine.toUpperCase()} • ${match.recipe.timeDisplay}', style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                
                if (!match.isFullMatch && match.missingIngredients.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    children: match.missingIngredients.map((i) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        border: Border.all(color: const Color(0xFFFF8C00)),
                        borderRadius: BorderRadius.circular(8)
                      ),
                      child: Text('Missing: $i', style: const TextStyle(color: Color(0xFFFF8C00), fontSize: 9, fontWeight: FontWeight.bold)),
                    )).toList()
                  ),
                ],

                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(isRescue ? Icons.health_and_safety : Icons.lightbulb_outline, color: accent, size: 18),
                          const SizedBox(width: 12),
                          Expanded(child: Text(whyThis, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4))),
                        ]
                      )
                    ),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Future<void> _synthesizeExactMatch() async {
    setState(() => _isSynthesizing = true);
    try {
      final allItems = await AppServices.inventory.getAll();
      final expiring = allItems.where((i) => i.isUrgent).toList();
      if (expiring.isEmpty) return;

      final persona = AppServices.personaEngine.getPersona(_prefs?.chefPersonaId ?? 'core_assistant');
      final result = await AppServices.generativeRecipeEngine.synthesizeExactMatch(expiring, persona.style);
      
      if (mounted) {
        showDialog(
          context: context, 
          builder: (_) => RecipeDetailSheet(
            result: result,
            onSendToAppliance: () {
              AppServices.hardware.sendInstruction('ov_1', targetTemp: 400);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                content: Text('Syncing Molecular Profile to Oven (400°F).', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                backgroundColor: Color(0xFFFF8C00),
              ));
            },
          )
        );
      }
    } finally {
      if (mounted) setState(() => _isSynthesizing = false);
    }
  }
}
