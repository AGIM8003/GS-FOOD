import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/i18n.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  int _versionTapCount = 0;
  bool _devModeUnlocked = false;

  void _handleVersionTap() {
    setState(() {
      _versionTapCount++;
      if (_versionTapCount >= 5) {
        _devModeUnlocked = true;
        HapticFeedback.heavyImpact();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Settings & Profile', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 100),
        children: [
          _buildSettingsSection('Chef Styles / Persona', [
            _buildActionTile('Active Persona: Balkan Grandma', Icons.face, 'Guides your recipe suggestions based on a hearty, zero-waste philosophy.'),
            _buildActionTile('Change Style', Icons.swap_horiz, 'Choose Mediterranean, Fast Family, Budget Saver...'),
          ]),

          _buildSettingsSection('Health Preferences', [
            _buildSwitchTile('High Protein Focus', 'Rank meals with greater protein availability.', true),
            _buildSwitchTile('Low Sodium Mode', 'Prioritize recipes leveraging fresh herbs.', false),
            _buildSwitchTile('Family Safe / Allergy Guard', 'Strict blocking of declared allergens.', true),
          ]),

          _buildSettingsSection('System & Language', [
            _buildActionTile('App Language: En', Icons.language, 'Change regional localization.'),
          ]),

          const SizedBox(height: 32),
          
          if (_devModeUnlocked) ...[
            _buildSettingsSection('Developer Internals (Unlocked)', [
               _buildActionTile('Markov Control Logic', Icons.account_tree, 'View orchestration pipelines.'),
               _buildActionTile('Skills Graph / Logs', Icons.data_object, 'Trace external API calls.'),
            ]),
          ],

          Center(
            child: GestureDetector(
              onTap: _handleVersionTap,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text('App Version: v4.0.0 Cybernetic', style: TextStyle(color: Colors.white24, fontSize: 12)),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildSettingsSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Text(title, style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold)),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(children: children),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildActionTile(String title, IconData icon, String subtitle) {
    return ListTile(
      leading: Icon(icon, color: Colors.white70),
      title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
      trailing: const Icon(Icons.chevron_right, color: Colors.white24),
      onTap: () {},
    );
  }

  Widget _buildSwitchTile(String title, String subtitle, bool value) {
    return SwitchListTile(
      value: value,
      onChanged: (v) {},
      title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
      activeColor: Colors.blueAccent,
    );
  }
}
