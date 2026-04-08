import 'package:flutter/material.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile & Preferences'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // App Version for Developer Mode toggle
          GestureDetector(
            onTap: () {
              // 7 tap magic
            },
            child: const Center(
              child: Text('GS FOOD V4 · 0.2.0', style: TextStyle(color: Colors.grey)),
            ),
          ),
          const SizedBox(height: 24),
          
          _SectionTitle('AI Chef Persona'),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Active Persona'),
            subtitle: const Text('Fast Family Cook (30 min max)'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          
          const Divider(height: 32),
          _SectionTitle('Regions & Cuisines'),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Primary Influence'),
            subtitle: const Text('Balkan & Mediterranean'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          
          const Divider(height: 32),
          _SectionTitle('Health Preferences'),
          SwitchListTile(
            value: true,
            onChanged: (v) {},
            title: const Text('High Protein Focus'),
            subtitle: const Text('Adjusts rankings to prioritize protein.'),
          ),
          SwitchListTile(
            value: false,
            onChanged: (v) {},
            title: const Text('Low Sodium Mode'),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              'Note: This is a culinary tool, not medical advice. Consult a doctor for strict dietary needs.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ),
          
          const Divider(height: 32),
          _SectionTitle('Privacy & Data'),
          ListTile(
            leading: const Icon(Icons.delete_outline, color: Colors.red),
            title: const Text('Delete Account & Pantry Data', style: TextStyle(color: Colors.red)),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 16.0),
      child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
    );
  }
}
