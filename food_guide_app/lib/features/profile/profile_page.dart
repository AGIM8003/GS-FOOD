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

  Future<void> _updatePref(UserPreferences Function(UserPreferences current) modifier) async {
    if (_prefs == null) return;
    final newPrefs = modifier(_prefs!);
    
    // Support-Layer: Unified normalized save. Prevents desyncs by writing the whole governed object.
    await AppServices.preferences.save(newPrefs);
    
    if (mounted) {
      setState(() {
        _prefs = newPrefs;
      });
    }
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

          _buildSettingsSection('Household Structure', [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Text(
                'Calculated Servings multiplier: ${_prefs?.calculatedHouseholdServings.toStringAsFixed(1)}x',
                style: const TextStyle(color: Color(0xFF00BFFF), fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
            ...(_prefs?.householdMembers ?? []).map((m) => ListTile(
              leading: Icon(
                m.role == HouseholdRole.child ? Icons.child_care :
                m.role == HouseholdRole.elder ? Icons.elderly :
                m.role == HouseholdRole.youngster ? Icons.boy : Icons.person,
                color: m.isIncludedInSharedMeals ? const Color(0xFF00FF66) : Colors.white38,
              ),
              title: Text(m.name, style: TextStyle(color: m.isIncludedInSharedMeals ? Colors.white : Colors.white54, fontWeight: FontWeight.bold)),
              subtitle: Text('${m.role.name.toUpperCase()} (x${m.role.portionMultiplier} Serving)', style: const TextStyle(color: Colors.white54, fontSize: 10)),
              trailing: Switch(
                value: m.isIncludedInSharedMeals,
                activeColor: const Color(0xFF00FF66),
                onChanged: (v) {
                  final list = List<HouseholdMember>.from(_prefs?.householdMembers ?? []);
                  final index = list.indexWhere((e) => e.id == m.id);
                  if (index >= 0) {
                    list[index] = HouseholdMember(id: m.id, name: m.name, role: m.role, isIncludedInSharedMeals: v);
                    _updatePref((p) => p.copyWith(householdMembers: list));
                  }
                },
              ),
              onLongPress: () {
                 final list = List<HouseholdMember>.from(_prefs?.householdMembers ?? []);
                 list.removeWhere((e) => e.id == m.id);
                 _updatePref((p) => p.copyWith(householdMembers: list));
              },
            )),
            ListTile(
              leading: const Icon(Icons.add_circle, color: Color(0xFF00BFFF)),
              title: const Text('Add Family Member', style: TextStyle(color: Color(0xFF00BFFF), fontWeight: FontWeight.bold)),
              onTap: () => _showAddMemberSheet(),
            ),
          ]),

          _buildSettingsSection('Hard Safety & Dietary Rules', [
            _buildActionTile(
              'Manage Allergens', 
              Icons.warning_amber_rounded, 
              _prefs?.allergens.isEmpty == true 
                  ? 'No allergens declared' 
                  : 'Active: ${_prefs?.allergens.join(", ")}',
              iconColor: const Color(0xFFFF3333),
              onTap: () {
                // Future dialog to manage array
              }
            ),
            _buildSwitchTile(
              'Family Safe / Allergy Guard', 
              'Strictly block unsafe ingredients across the app.', 
              _prefs?.familySafe ?? true,
              (v) => _updatePref((p) => p.copyWith(familySafe: v))
            ),
          ]),

          _buildCollapsibleSettingsSection(
            'Guardian Protocols (Hard Constraints)', 
            _guardianExpanded,
            () => setState(() => _guardianExpanded = !_guardianExpanded),
            [
              _buildChoiceGroup<String>(
                title: 'Active Ritual Mode',
                values: const ['none', 'kosher', 'halal', 'hindu', 'vegan_strict'],
                labels: const ['None', 'Kosher', 'Halal', 'Hindu', 'Vegan'],
                selectedValue: _prefs?.activeRitualProtocol ?? 'none',
                onSelected: (v) => _updatePref((p) => p.copyWith(activeRitualProtocol: v)),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0),
                child: Divider(color: Colors.white12),
              ),
              _buildMultiSelectGroup(
                title: 'Active Medical Intercepts',
                values: const ['diabetes', 'hypertension', 'celiac'],
                labels: const ['Diabetes', 'Hypertension', 'Celiac'],
                selectedValues: _prefs?.activeMedicalConditions ?? [],
                onSelected: (v) => _updatePref((p) => p.copyWith(activeMedicalConditions: v)),
              ),
          ]),

          _buildSettingsSection('Dietary Optimization (Soft Preferences)', [
            _buildSwitchTile(
              'High Protein Focus', 
              'Suggest meals with greater protein availability.', 
              _prefs?.highProtein ?? false,
              (v) => _updatePref((p) => p.copyWith(highProtein: v))
            ),
            _buildSwitchTile(
              'Low Sodium Mode', 
              'Prioritize recipes leveraging fresh herbs over salt.', 
              _prefs?.lowSodium ?? false,
              (v) => _updatePref((p) => p.copyWith(lowSodium: v))
            ),
          ]),

          // Premium Features moved logic below Language
          _buildSettingsSection('System & Intelligence', [
             _buildActionTile(
              'Active Persona: ${activePersona.name}', 
              Icons.face, 
              'Change Chef style and tone.',
              iconColor: const Color(0xFF00FF66),
              onTap: _showPersonaSelector
            ),
            _buildActionTile(
              'App Language: ${_prefs?.language.toUpperCase() ?? 'EN'}', 
              Icons.language, 
              'Change regional localization.',
              iconColor: const Color(0xFF00FF66),
              onTap: _showLanguageSelector
            ),
            _buildActionTile(
              'Premium Fitness Sync', 
              Icons.monitor_heart, 
              'Sync Apple Health / Connect',
              iconColor: const Color(0xFF00BFFF),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FitnessDashboardPage())),
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

  Widget _buildChoiceGroup<T>({
    required String title,
    required List<T> values,
    required List<String> labels,
    required T selectedValue,
    required ValueChanged<T> onSelected,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(values.length, (index) {
              final isSelected = values[index] == selectedValue;
              return ChoiceChip(
                label: Text(labels[index], style: TextStyle(color: isSelected ? Colors.black : Colors.white70, fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                selected: isSelected,
                selectedColor: const Color(0xFF00FF66),
                backgroundColor: Colors.white12,
                onSelected: (bool selected) {
                  if (selected) onSelected(values[index]);
                },
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildMultiSelectGroup<T>({
    required String title,
    required List<T> values,
    required List<String> labels,
    required List<T> selectedValues,
    required ValueChanged<List<T>> onSelected,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 4.0),
            child: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const Padding(
            padding: EdgeInsets.only(bottom: 8.0),
            child: Text('Changes force AI to mutate recipes for safety.', style: TextStyle(color: Color(0xFFFF3333), fontSize: 10, fontStyle: FontStyle.italic)),
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(values.length, (index) {
              final isSelected = selectedValues.contains(values[index]);
              return FilterChip(
                label: Text(labels[index], style: TextStyle(color: isSelected ? Colors.white : Colors.white70, fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                selected: isSelected,
                selectedColor: const Color(0xFFFF3333).withOpacity(0.8),
                backgroundColor: Colors.white12,
                checkmarkColor: Colors.white,
                onSelected: (bool selected) {
                  final newList = List<T>.from(selectedValues);
                  if (selected) {
                    newList.add(values[index]);
                  } else {
                    newList.remove(values[index]);
                  }
                  onSelected(newList);
                },
              );
            }),
          ),
        ],
      ),
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
                        _updatePref((pref) => pref.copyWith(chefPersonaId: p.id));
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

  void _showAddMemberSheet() {
    String tempName = '';
    HouseholdRole tempRole = HouseholdRole.adult;

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF151515),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (stCtx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 16, right: 16, top: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('New Household Member', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  TextField(
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Name (e.g. "Sophia")',
                      hintStyle: const TextStyle(color: Colors.white24),
                      filled: true,
                      fillColor: const Color(0xFF080808),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    onChanged: (v) => tempName = v,
                  ),
                  const SizedBox(height: 16),
                  const Text('Appetite & Size Profile', style: TextStyle(color: Colors.white54, fontSize: 12)),
                  Wrap(
                    spacing: 8,
                    children: HouseholdRole.values.map((r) {
                      final selected = r == tempRole;
                      return ChoiceChip(
                        label: Text(r.name.toUpperCase()),
                        selected: selected,
                        selectedColor: const Color(0xFF00BFFF),
                        backgroundColor: Colors.white12,
                        onSelected: (v) {
                          if (v) setModalState(() => tempRole = r);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00FF66), padding: const EdgeInsets.symmetric(vertical: 16)),
                      onPressed: () {
                        if (tempName.trim().isEmpty) return;
                        final newMem = HouseholdMember(id: DateTime.now().millisecondsSinceEpoch.toString(), name: tempName, role: tempRole, isIncludedInSharedMeals: true);
                        final list = List<HouseholdMember>.from(_prefs?.householdMembers ?? []);
                        list.add(newMem);
                        _updatePref((p) => p.copyWith(householdMembers: list));
                        Navigator.pop(ctx);
                      },
                      child: const Text('Confirm', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          }
        );
      }
    );
  }

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
                        _updatePref((p) => p.copyWith(language: l.code));
                        AppServices.languageEngine.setLanguage(l.code);
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
