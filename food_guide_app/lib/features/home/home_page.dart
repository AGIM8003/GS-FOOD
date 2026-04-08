import 'package:flutter/material.dart';
import '../chat/food_chat_sheet.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Good Evening, Sarah'),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Unified Search/Chat
              InkWell(
                onTap: () {
                  FoodChatSheet.show(context);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: Theme.of(context).colorScheme.primary),
                      const SizedBox(width: 12),
                      const Text('What\'s in the fridge? / Ask GS FOOD'),
                      const Spacer(),
                      Icon(Icons.camera_alt, color: Theme.of(context).colorScheme.primary),
                      const SizedBox(width: 8),
                      Icon(Icons.mic, color: Theme.of(context).colorScheme.primary),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Quick Actions
              const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _QuickActionChip(icon: Icons.kitchen, label: 'Cook with what I have', color: Colors.orange.shade100),
                    _QuickActionChip(icon: Icons.timer, label: 'Fast 15-min meal', color: Colors.blue.shade100),
                    _QuickActionChip(icon: Icons.favorite, label: 'Healthy dinner', color: Colors.green.shade100),
                    _QuickActionChip(icon: Icons.public, label: 'Balkan cravings', color: Colors.red.shade100),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              // Urgent Rescue
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Expiring Soon', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  TextButton(onItem: (){}, child: const Text('See All')),
                ],
              ),
              Card(
                color: Colors.red.shade50,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.red.shade200)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 32),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Spinach', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Text('1 day left', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                        onPressed: () {},
                        child: const Text('Rescue'),
                      )
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
              
              // Exploration Carousel
              const Text('Inspired by your Pantry', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              SizedBox(
                height: 200,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _MealCard(title: 'Lemon Chicken', time: '30 min', match: '100% Match'),
                    _MealCard(title: 'Greek Salad', time: '10 min', match: 'Missing: Feta'),
                    _MealCard(title: 'Balkan Stew', time: '45 min', match: 'Save Food (Potato)'),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _QuickActionChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _MealCard extends StatelessWidget {
  final String title;
  final String time;
  final String match;

  const _MealCard({required this.title, required this.time, required this.match});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 100,
            decoration: BoxDecoration(
              color: Colors.orange.shade100,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: const Center(child: Icon(Icons.restaurant, size: 40, color: Colors.orange)),
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(time, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 12)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.green.shade100, borderRadius: BorderRadius.circular(4)),
                  child: Text(match, style: const TextStyle(fontSize: 10, color: Colors.green)),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
