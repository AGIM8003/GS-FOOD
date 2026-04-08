import 'package:flutter/material.dart';

class PantryPage extends StatelessWidget {
  const PantryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Pantry'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Expiry summary
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _Stat(label: 'Total Items', value: '42', color: Colors.grey),
              _Stat(label: 'Urgent', value: '3', color: Colors.red),
              _Stat(label: 'Safe', value: '39', color: Colors.green),
            ],
          ),
          const SizedBox(height: 24),
          
          const Text('Expiring Soon (Urgent)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red)),
          const SizedBox(height: 8),
          _PantryItem(name: 'Spinach', amount: '1 bag', expiry: 'Tomorrow', urgency: Colors.red),
          _PantryItem(name: 'Milk', amount: '0.5 L', expiry: '2 days', urgency: Colors.orange),
          _PantryItem(name: 'Chicken Breast', amount: '400g', expiry: '2 days', urgency: Colors.orange),
          
          const SizedBox(height: 24),
          const Text('Fridge (Safe)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _PantryItem(name: 'Eggs', amount: '10 count', expiry: '12 days', urgency: Colors.green),
          _PantryItem(name: 'Feta Cheese', amount: '200g', expiry: '14 days', urgency: Colors.green),
          
          const SizedBox(height: 24),
          const Text('Freezer', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _PantryItem(name: 'Frozen Peas', amount: '1 bag', expiry: '6 months', urgency: Colors.green),
          _PantryItem(name: 'Beef Mince', amount: '500g', expiry: '3 months', urgency: Colors.green),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Open Scan Context
        },
        icon: const Icon(Icons.document_scanner),
        label: const Text('Add Items'),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _Stat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

class _PantryItem extends StatelessWidget {
  final String name;
  final String amount;
  final String expiry;
  final Color urgency;

  const _PantryItem({required this.name, required this.amount, required this.expiry, required this.urgency});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: urgency.withOpacity(0.2),
        child: Icon(Icons.fastfood, color: urgency),
      ),
      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(amount),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          const Text('Expires in', style: TextStyle(fontSize: 10)),
          Text(expiry, style: TextStyle(color: urgency, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
