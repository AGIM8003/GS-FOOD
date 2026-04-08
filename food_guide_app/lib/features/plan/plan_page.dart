import 'package:flutter/material.dart';

class PlanPage extends StatefulWidget {
  const PlanPage({super.key});

  @override
  State<PlanPage> createState() => _PlanPageState();
}

class _PlanPageState extends State<PlanPage> {
  bool showList = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meal Plan & Shop'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, label: Text('Meal Plan'), icon: Icon(Icons.calendar_today)),
                ButtonSegment(value: true, label: Text('Shopping List'), icon: Icon(Icons.shopping_cart)),
              ],
              selected: {showList},
              onSelectionChanged: (Set<bool> newSelection) {
                setState(() {
                  showList = newSelection.first;
                });
              },
            ),
          ),
          Expanded(
            child: showList ? const _ShoppingListView() : const _MealPlanView(),
          ),
        ],
      ),
    );
  }
}

class _MealPlanView extends StatelessWidget {
  const _MealPlanView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        const Text('Today', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 8),
        _PlanCard(mealTime: 'Dinner', mealName: 'Lemon Chicken', usesPantry: true),
        
        const SizedBox(height: 24),
        const Text('Tomorrow', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 8),
        _PlanCard(mealTime: 'Lunch', mealName: 'Leftover Chicken Salad', usesPantry: true),
        _PlanCard(mealTime: 'Dinner', mealName: 'Shrimp Tacos', usesPantry: false, needsShopping: true),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String mealTime;
  final String mealName;
  final bool usesPantry;
  final bool needsShopping;

  const _PlanCard({required this.mealTime, required this.mealName, this.usesPantry = false, this.needsShopping = false});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(child: Icon(usesPantry ? Icons.kitchen : Icons.restaurant)),
        title: Text(mealName, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(mealTime),
        trailing: needsShopping 
            ? const Chip(label: Text('Needs Items', style: TextStyle(fontSize: 10)), backgroundColor: Colors.orange)
            : const Chip(label: Text('Ready to Cook', style: TextStyle(fontSize: 10)), backgroundColor: Colors.green),
      ),
    );
  }
}

class _ShoppingListView extends StatelessWidget {
  const _ShoppingListView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        const Text('Produce', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        CheckboxListTile(value: false, onChanged: (v){}, title: const Text('Cilantro')),
        CheckboxListTile(value: false, onChanged: (v){}, title: const Text('Avocado')),
        const SizedBox(height: 16),
        const Text('Seafood', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        CheckboxListTile(value: false, onChanged: (v){}, title: const Text('Shrimp (1 lb)')),
      ],
    );
  }
}
