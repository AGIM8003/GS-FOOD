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
                  HapticFeedback.lightImpact(); // Compound gesture
                  _showLanguageSheet(context);
                },
              ),
              
              const Divider(height: 32, color: Colors.white24),
              _SectionTitle('AI Chef Persona'),
              ListTile(
                leading: const Icon(Icons.person_outline, color: Colors.orange),
                title: const Text('Active Persona', style: TextStyle(color: Colors.white)),
                subtitle: const Text('Fast Family Cook (30 min max)', style: TextStyle(color: Colors.white70)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white54),
                onTap: () => HapticFeedback.selectionClick(),
              ),
              
              const Divider(height: 32, color: Colors.white24),
              _SectionTitle('Regions & Cuisines'),
              ListTile(
                leading: const Icon(Icons.public, color: Colors.orange),
                title: const Text('Primary Influence', style: TextStyle(color: Colors.white)),
                subtitle: const Text('Balkan & Mediterranean', style: TextStyle(color: Colors.white70)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white54),
                onTap: () => HapticFeedback.selectionClick(),
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
      backgroundColor: Colors.transparent, // Required for ClipRRect backdrop
      builder: (context) {
        return ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
            child: Container(
              color: Colors.black.withOpacity(0.7),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 12, bottom: 16),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
                    ),
                    const Text('Select Language', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 16),
                    _LangTile('English', 'en', context),
                    _LangTile('Urdu / اردو', 'ur', context),
                    _LangTile('Indonesian / Bahasa', 'id', context),
                    _LangTile('Bengali / বাংলা', 'bn', context),
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
        
        // Show Spatial Glassmorphic Toast
        ScaffoldMessenger.of(parentContext).showSnackBar(
          SnackBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            content: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.grey.shade900.withOpacity(0.8),
                  child: Text(I18n.get('settings.restartMessage'), style: const TextStyle(color: Colors.white)),
                ),
              ),
            ),
          )
        );
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
