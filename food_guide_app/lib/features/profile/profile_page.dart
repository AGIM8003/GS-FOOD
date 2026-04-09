import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/services.dart';
import '../../engine/models/user_preferences.dart';
import '../../engine/persona/persona_engine.dart';
import '../../engine/i18n/language_engine.dart';
import '../../ui/golden_gourmet_scaffold.dart';

import '../premium/active_cooking_page.dart';
import '../premium/sustainability_page.dart';
import '../premium/fitness_dashboard_page.dart';
import '../premium/wine_cellar_page.dart';
import '../premium/chef_table_page.dart';
import '../premium/live_events_page.dart';
import '../premium/camera_scan_page.dart';
import '../premium/appliance_hub_page.dart';

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
  bool _guardianExpanded = true;

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

    return GoldenGourmetScaffold(
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

          _buildSettingsSection('Premium Features (V5)', [
            _buildActionTile('Wine & Beverage Cellar', Icons.wine_bar, 'Pair drinks with your meals.', iconColor: const Color(0xFF00FF66), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WineCellarPage()))),
            _buildActionTile('Sustainability Dashboard', Icons.eco, 'Track your food waste impact.', iconColor: const Color(0xFF00FF66), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SustainabilityPage()))),
            _buildActionTile('Chef\'s Table Community', Icons.public, 'Discover rescued recipes.', iconColor: const Color(0xFF00FF66), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChefTablePage()))),
            _buildActionTile('Live Kitchen Events', Icons.play_circle_fill, 'Join masterclasses.', iconColor: const Color(0xFF00FF66), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LiveEventsPage()))),
            _buildActionTile('Kitchen Sync Hub', Icons.router, 'Hardware telemetry.', iconColor: const Color(0xFF00FF66), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ApplianceHubPage()))),
            _buildActionTile('Computer Vision Scan', Icons.document_scanner, 'Auto-add items via camera.', iconColor: const Color(0xFF00FF66), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CameraScanPage()))),
            _buildActionTile('Active Cooking Mode', Icons.timer, 'Test large stove-side UI.', iconColor: const Color(0xFF00FF66), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ActiveCookingPage(recipeTitle: 'Test Recipe View')))),
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

          _buildCollapsibleSettingsSection(
            'Guardian Protocols', 
            _guardianExpanded,
            () => setState(() => _guardianExpanded = !_guardianExpanded),
            [
              _buildActionTile(
                'Active Ritual Protocol', 
                Icons.add_circle, 
                _prefs?.activeRitualProtocol.toUpperCase() ?? 'NONE',
                iconColor: const Color(0xFF00FF66),
                onTap: _showRitualProtocolSelector,
              ),
              _buildActionTile(
                'Active Medical Conditions', 
                Icons.add_circle, 
                _prefs?.activeMedicalConditions.isNotEmpty == true ? _prefs!.activeMedicalConditions.join(', ').toUpperCase() : 'NONE',
                iconColor: const Color(0xFFFF3333),
                onTap: _showMedicalConditionSelector,
              ),
              _buildActionTile(
                'Premium Fitness Sync', 
                Icons.monitor_heart, 
                'Sync Apple Health / Connect',
                iconColor: const Color(0xFF00BFFF),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FitnessDashboardPage())),
              ),
          ]),

          _buildSettingsSection('System & Language', [
            _buildActionTile(
              'App Language: ${_prefs?.language.toUpperCase() ?? 'EN'}', 
              Icons.language, 
              'Change regional localization.',
              onTap: _showLanguageSelector
            ),
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
                child: Text('App Version: v5.0.0 Production', style: TextStyle(color: Colors.white24, fontSize: 12)),
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

  Widget _buildCollapsibleSettingsSection(String title, bool isExpanded, VoidCallback onToggle, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: onToggle,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              children: [
                Icon(isExpanded ? Icons.remove_circle_outline : Icons.add_circle_outline, color: const Color(0xFF00FF66), size: 18),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold, letterSpacing: -0.5)),
              ],
            ),
          ),
        ),
        if (isExpanded)
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

  void _showRitualProtocolSelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF151515),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        final protocols = ['none', 'kosher', 'halal', 'hindu', 'vegan_strict'];
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(20.0),
                child: Text('Select Guardian Ritual', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: protocols.length,
                  itemBuilder: (context, index) {
                    final p = protocols[index];
                    final isActive = _prefs?.activeRitualProtocol == p;
                    return ListTile(
                      leading: Icon(Icons.balance, color: isActive ? const Color(0xFF00FF66) : Colors.white54),
                      title: Text(p.toUpperCase(), style: TextStyle(color: isActive ? Colors.white : Colors.white70, fontWeight: FontWeight.bold)),
                      trailing: isActive ? const Icon(Icons.check, color: Color(0xFF00FF66)) : null,
                      onTap: () async {
                        Navigator.pop(context);
                        await AppServices.preferences.setRitualProtocol(p);
                        await _loadPrefs(); 
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

  void _showMedicalConditionSelector() {
    // In a real app this would be a multi-select checkbox list. Keeping simple toggle for demonstration.
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF151515),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        final conditions = ['diabetes', 'hypertension', 'celiac'];
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(20.0),
                child: Text('Select Active Medical Intercepts', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.0),
                child: Text('Selecting these will cause the AI to mutate recipes for safety.', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
              ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: conditions.length,
                  itemBuilder: (context, index) {
                    final c = conditions[index];
                    final currentConditions = _prefs?.activeMedicalConditions ?? [];
                    final isActive = currentConditions.contains(c);
                    return ListTile(
                      leading: Icon(Icons.medical_services, color: isActive ? const Color(0xFFFF3333) : Colors.white54),
                      title: Text(c.toUpperCase(), style: TextStyle(color: isActive ? Colors.white : Colors.white70, fontWeight: FontWeight.bold)),
                      trailing: isActive ? const Icon(Icons.check, color: Color(0xFFFF3333)) : null,
                      onTap: () async {
                        Navigator.pop(context);
                        final newList = List<String>.from(currentConditions);
                        if (isActive) {
                          newList.remove(c);
                        } else {
                          newList.add(c);
                        }
                        await AppServices.preferences.setMedicalConditions(newList);
                        await _loadPrefs(); 
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
  void _showLanguageSelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF151515),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        final languages = AppServices.languageEngine.runtimeType.toString() == 'LanguageEngine' 
            ? LanguageEngine.supportedLanguages
            : [];
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(20.0),
                child: Text('Select Language', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: languages.length,
                  itemBuilder: (context, index) {
                    final l = languages[index];
                    final isActive = _prefs?.language == l.code;
                    return ListTile(
                      leading: Icon(Icons.language, color: isActive ? const Color(0xFF00FF66) : Colors.white54),
                      title: Text(l.nativeLabel, style: TextStyle(color: isActive ? Colors.white : Colors.white70, fontWeight: FontWeight.bold)),
                      subtitle: Text(l.label, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                      trailing: isActive ? const Icon(Icons.check, color: Color(0xFF00FF66)) : null,
                      onTap: () async {
                        Navigator.pop(context);
                        await AppServices.preferences.setLanguage(l.code);
                        AppServices.languageEngine.setLanguage(l.code);
                        await _loadPrefs(); // Refresh UI
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
