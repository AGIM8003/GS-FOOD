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
    
    if (mounted) {
      setState(() {
        _items = allItems;
        _prefs = prefs;
        if (ranked.isNotEmpty) {
          _perfectMatch = ranked.first; 
        }
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

    return GoldenGourmetScaffold(
      backgroundColor: Colors.black, // OLED Mode
      appBar: SanctityHeader(
        title: 'Command Center',
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting Header
              Text(
                'PREDICTIVE COMMAND CENTER',
                style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2.0),
              ),
              const SizedBox(height: 4),
              const Text(
                'Good Evening, Chef.',
                style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1.0),
              ),
              const SizedBox(height: 24),

              // Daily Culinary Briefing
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'DAILY CULINARY BRIEFING',
                    style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5),
                  ),
                  const Text(
                    'SYSTEM: OPTIMIZED',
                    style: TextStyle(color: Color(0xFF00FF66), fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: _buildBriefingStat(Icons.sync_alt, 'BIO-SYNC', 'Needs ${requiredProtein}g Protein', const Color(0xFF00FF66), 0.6)),
                            const SizedBox(width: 8),
                            Expanded(child: _buildBriefingStat(Icons.timer, 'FRESHNESS', '$urgentCount Items Critical', const Color(0xFFFF3333), urgentCount > 0 ? 0.8 : 0.1)),
                            const SizedBox(width: 8),
                            Expanded(child: _buildBriefingStat(Icons.event_note, 'SCHEDULE', 'Gym @ 19:00', const Color(0xFFFF8C00), 0.3)),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '"Chef, metabolic recovery suggests a high-protein, low-sodium dinner tonight using your expiring ingredients."',
                          style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12, fontStyle: FontStyle.italic),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 32),

              // The Perfect Match Hero Card
              if (_perfectMatch != null) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'THE PERFECT MATCH',
                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5),
                    ),
                    const Text(
                      'FLAVOR DNA OPTIMIZED',
                      style: TextStyle(color: Color(0xFFFF8C00), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                _buildEditorialHeroCard(_perfectMatch!),
              ] else ...[
                // Empty state handled elegantly
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 48, color: Colors.white.withOpacity(0.2)),
                        const SizedBox(height: 16),
                        Text('Pantry is fully optimal. No rescue matches needed.', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                      ],
                    ),
                  ),
                )
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
