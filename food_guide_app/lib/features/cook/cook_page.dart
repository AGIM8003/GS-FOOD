import 'package:flutter/material.dart';

class CookPage extends StatefulWidget {
  const CookPage({super.key});

  @override
  State<CookPage> createState() => _CookPageState();
}

class _CookPageState extends State<CookPage> {
  // Mock generation state
  bool _isGenerating = false;

  void _generateCards() {
    setState(() => _isGenerating = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isGenerating = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cook Now'),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: () {}),
        ],
      ),
      body: _isGenerating
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Consulting your Pantry & Chef Style...'),
                ],
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                    icon: const Icon(Icons.auto_awesome),
                    label: const Text('Generate Meal Ideas'),
                    onPressed: _generateCards,
                  ),
                ),
                const SizedBox(height: 24),
                
                // Categories
                const _CategoryTitle('Best Match (100% Pantry)'),
                const _CookCard(
                  title: 'Greek Lemon Chicken',
                  time: '35 min',
                  cuisine: 'Mediterranean',
                  matchType: '100% Match',
                  missing: [],
                  available: ['Chicken Breast', 'Lemon', 'Garlic', 'Olive Oil'],
                  whyThis: 'Uses exactly what you have in the fridge and fits your high-protein preference.',
                ),
                
                const SizedBox(height: 16),
                const _CategoryTitle('Save Food (Expiring Soon)'),
                const _CookCard(
                  title: 'Spinach & Feta Omelette',
                  time: '15 min',
                  cuisine: 'Balkan',
                  matchType: 'Save Food',
                  missing: [],
                  available: ['Spinach', 'Eggs', 'Feta'],
                  whyThis: 'Rescues the spinach expiring tomorrow to prevent food waste.',
                ),

                const SizedBox(height: 16),
                const _CategoryTitle('Fastest (Missing 1 Item)'),
                const _CookCard(
                  title: 'Shrimp Tacos',
                  time: '15 min',
                  cuisine: 'Mexican',
                  matchType: 'Fastest',
                  missing: ['Avocado'],
                  available: ['Frozen Shrimp', 'Tortillas', 'Lime'],
                  whyThis: 'The quickest meal to prepare, but you will need to substitute or buy Avocado.',
                ),
              ],
            ),
    );
  }
}

class _CategoryTitle extends StatelessWidget {
  final String title;
  const _CategoryTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
    );
  }
}

class _CookCard extends StatelessWidget {
  final String title;
  final String time;
  final String cuisine;
  final String matchType;
  final List<String> missing;
  final List<String> available;
  final String whyThis;

  const _CookCard({
    required this.title,
    required this.time,
    required this.cuisine,
    required this.matchType,
    required this.missing,
    required this.available,
    required this.whyThis,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 120,
            color: Colors.orange.shade100,
            child: Stack(
              children: [
                const Center(child: Icon(Icons.restaurant, size: 48, color: Colors.orange)),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Chip(
                    label: Text(
                      matchType,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                    backgroundColor: matchType == 'Save Food'
                        ? Colors.red.shade100
                        : Colors.green.shade100,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Text(time, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                  ],
                ),
                Text(cuisine, style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                const SizedBox(height: 12),
                
                // Ingredients Section
                const Text('Available:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                Wrap(
                  spacing: 4,
                  children: available.map((item) => Text('✓ $item', style: const TextStyle(fontSize: 12, color: Colors.green))).toList(),
                ),
                if (missing.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  const Text('Missing:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  Wrap(
                    spacing: 4,
                    children: missing.map((item) => Text('✗ $item', style: const TextStyle(fontSize: 12, color: Colors.red))).toList(),
                  ),
                ],
                
                const Divider(height: 24),
                // Why This? Section
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.lightbulb_outline, size: 16, color: Colors.orange),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(whyThis, style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
                    )
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {},
                    child: const Text('Start Cooking'),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
