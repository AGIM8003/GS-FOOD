import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/i18n.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: I18n.currentLanguage,
      builder: (context, lang, child) {
        return Scaffold(
          backgroundColor: Colors.black, // OLED Mode
          appBar: AppBar(
            title: Text(I18n.get('profile.title'), style: const TextStyle(color: Colors.white)),
            backgroundColor: Colors.transparent,
            elevation: 0,
          ),
          body: ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              // Language Subsystem Integration
              _SectionTitle(I18n.get('profile.languages')),
              ListTile(
                leading: const Icon(Icons.language, color: Colors.orange),
                title: const Text('App Language', style: TextStyle(color: Colors.white)),
                subtitle: Text(lang.toUpperCase(), style: const TextStyle(color: Colors.white70)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white54),
                tileColor: Colors.white.withOpacity(0.05),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showLanguageSheet(context);
                },
              ),
              
              const Divider(height: 32, color: Colors.white24),
              // PHASE 5: Kitchens & Selections Expansion
              _SectionTitle(I18n.get('profile.kitchens')),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 12,
                children: [
                  _KitchenSelectionChip('Mediterranean', true),
                  _KitchenSelectionChip('Balkan', true),
                  _KitchenSelectionChip('East Asian', false),
                  _KitchenSelectionChip('South Asian', false),
                  _KitchenSelectionChip('Latin American', false),
                  _KitchenSelectionChip('Eastern European', false),
                  _KitchenSelectionChip('Middle Eastern', false),
                  _KitchenSelectionChip('Nordic/Scandi', false),
                ],
              ),
              
              const Divider(height: 32, color: Colors.white24),
              _SectionTitle('Health Preferences'),
              SwitchListTile(
                value: true,
                onChanged: (v) { HapticFeedback.lightImpact(); },
                activeColor: Colors.orange,
                title: const Text('High Protein Focus', style: TextStyle(color: Colors.white)),
                subtitle: const Text('Adjusts rankings to prioritize protein.', style: TextStyle(color: Colors.white70)),
              ),
              SwitchListTile(
                value: false,
                onChanged: (v) { HapticFeedback.lightImpact(); },
                activeColor: Colors.orange,
                title: const Text('Low Sodium Mode', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
      }
    );
  }

  void _showLanguageSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent, 
      builder: (context) {
        return ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
            child: Container(
              color: Colors.black.withOpacity(0.7),
              child: SafeArea(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 12, bottom: 16),
                      width: 40,
                      height: 4,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16.0),
                      child: Text('Select Language', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                    const SizedBox(height: 16),
                    _LangTile('English', 'en', context),
                    _LangTile('Urdu / اردو', 'ur', context),
                    _LangTile('Indonesian / Bahasa', 'id', context),
                    _LangTile('Bengali / বাংলা', 'bn', context),
                    _LangTile('Persian / فارسی', 'fa', context),
                    _LangTile('Russian / Русский', 'ru', context),
                    _LangTile('Swahili / Kiswahili', 'sw', context),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),
        );
      }
    );
  }
}

class _KitchenSelectionChip extends StatefulWidget {
  final String label;
  final bool initialSelection;

  const _KitchenSelectionChip(this.label, this.initialSelection);

  @override
  State<_KitchenSelectionChip> createState() => _KitchenSelectionChipState();
}

class _KitchenSelectionChipState extends State<_KitchenSelectionChip> {
  late bool selected;

  @override
  void initState() {
    super.initState();
    selected = widget.initialSelection;
  }

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      selected: selected,
      label: Text(widget.label),
      labelStyle: TextStyle(color: selected ? Colors.black : Colors.white),
      selectedColor: Colors.orange.shade400,
      backgroundColor: Colors.white.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: selected ? Colors.transparent : Colors.white24)
      ),
      onSelected: (bool v) {
        HapticFeedback.lightImpact();
        setState(() {
          selected = v;
        });
      },
    );
  }
}

class _LangTile extends StatelessWidget {
  final String label;
  final String code;
  final BuildContext parentContext;

  const _LangTile(this.label, this.code, this.parentContext);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label, style: const TextStyle(color: Colors.white)),
      trailing: I18n.currentLanguage.value == code ? const Icon(Icons.check, color: Colors.orange) : null,
      onTap: () {
        HapticFeedback.mediumImpact();
        I18n.setLanguage(code);
        Navigator.pop(parentContext);
      },
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
      child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.orange.shade300)),
    );
  }
}
