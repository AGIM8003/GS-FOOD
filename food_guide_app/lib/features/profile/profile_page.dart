import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/services.dart';
import '../../engine/models/user_preferences.dart';
import '../../engine/persona/persona_engine.dart';

/// Production Profile Page.
///
/// Replaces non-functional switches with real PreferencesRepository tracking.
/// Implements Obsidian Gourmet design system.
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  UserPreferences? _prefs;
  bool _isLoading = true;
  int _versionTapCount = 0;
  bool _devModeUnlocked = false;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    setState(() => _isLoading = true);
    final prefs = await AppServices.preferences.load();
    if (mounted) {
      setState(() {
        _prefs = prefs;
        _isLoading = false;
      });
    }
  }

  void _handleVersionTap() {
    setState(() {
      _versionTapCount++;
      if (_versionTapCount >= 5 && !_devModeUnlocked) {
        _devModeUnlocked = true;
        HapticFeedback.heavyImpact();
      }
    });
  }

  Future<void> _updatePref(Future<void> Function() updateFn) async {
    await updateFn();
    await _loadPrefs(); // Reload after update
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF000000), 
        body: Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
      );
    }

    final activePersona = AppServices.personaEngine.getPersona(_prefs?.chefPersonaId ?? 'core_assistant');

    return Scaffold(
      backgroundColor: const Color(0xFF000000), // OLED Black
      appBar: AppBar(
        title: const Text('Settings & Profile', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 100),
        children: [
           _buildSettingsSection('Chef Styles / Persona', [
            _buildActionTile(
              'Active Persona: ${activePersona.name}', 
              Icons.face, 
              activePersona.description,
              onTap: _showPersonaSelector
            ),
          ]),

          _buildSettingsSection('Health Preferences', [
            _buildSwitchTile(
              'High Protein Focus', 
              'Rank meals with greater protein availability.', 
              _prefs?.highProtein ?? false,
              (v) => _updatePref(() => AppServices.preferences.setHighProtein(v))
            ),
            _buildSwitchTile(
              'Low Sodium Mode', 
              'Prioritize recipes leveraging fresh herbs.', 
              _prefs?.lowSodium ?? false,
              (v) => _updatePref(() => AppServices.preferences.setLowSodium(v))
            ),
            _buildSwitchTile(
              'Family Safe / Allergy Guard', 
              'Strict blocking of declared allergens.', 
              _prefs?.familySafe ?? true,
              (v) => _updatePref(() => AppServices.preferences.setFamilySafe(v))
            ),
          ]),

          _buildSettingsSection('Allergens & Dietary', [
            _buildActionTile(
              'Manage Allergens', 
              Icons.warning_amber_rounded, 
              _prefs?.allergens.isEmpty == true 
                  ? 'No allergens declared' 
                  : 'Active: ${_prefs?.allergens.join(", ")}',
              onTap: () {
                // Future dialog to manage array
              }
            ),
          ]),

          _buildSettingsSection('System & Language', [
            _buildActionTile('App Language: ${_prefs?.language.toUpperCase() ?? 'EN'}', Icons.language, 'Change regional localization.'),
          ]),

          const SizedBox(height: 32),
          
          if (_devModeUnlocked) ...[
            _buildSettingsSection('Developer Internals (Unlocked)', [
               _buildActionTile('Markov Control Logic', Icons.account_tree, 'View orchestration pipelines.'),
               _buildActionTile('Skills Graph / Logs', Icons.data_object, 'Trace external API calls.'),
               _buildActionTile('Debug: Clear All Data', Icons.delete_forever, 'Wipe SQLite database.', iconColor: Colors.redAccent),
            ]),
          ],

          Center(
            child: GestureDetector(
              onTap: _handleVersionTap,
              child: const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('App Version: v4.0.0 Production', style: TextStyle(color: Colors.white24, fontSize: 12)),
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
          child: Text(title, style: const TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold, letterSpacing: -0.5)),
        ),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF111111),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: Column(children: children),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildActionTile(String title, IconData icon, String subtitle, {VoidCallback? onTap, Color? iconColor}) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? const Color(0xFFFF8C00)),
      title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
      trailing: const Icon(Icons.chevron_right, color: Colors.white24),
      onTap: onTap ?? () {},
    );
  }

  Widget _buildSwitchTile(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      value: value,
      onChanged: onChanged,
      title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
      activeColor: const Color(0xFF00FF66),
      inactiveTrackColor: Colors.white12,
    );
  }

  void _showPersonaSelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF151515),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        final personas = AppServices.personaEngine.allPersonas;
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(20.0),
                child: Text('Select Chef Persona', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: personas.length,
                  itemBuilder: (context, index) {
                    final p = personas[index];
                    final isActive = _prefs?.chefPersonaId == p.id;
                    return ListTile(
                      leading: Icon(Icons.face, color: isActive ? const Color(0xFF00FF66) : Colors.white54),
                      title: Text(p.name, style: TextStyle(color: isActive ? Colors.white : Colors.white70, fontWeight: FontWeight.bold)),
                      subtitle: Text(p.description, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                      trailing: isActive ? const Icon(Icons.check, color: Color(0xFF00FF66)) : null,
                      onTap: () {
                        Navigator.pop(context);
                        _updatePref(() => AppServices.preferences.setChefPersona(p.id));
                      },
                    );
                  },
                ),
              )
            ],
          ),
        );
      }
    );
  }
}
