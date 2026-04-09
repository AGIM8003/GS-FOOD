import 'dart:convert';
import 'package:flutter/services.dart';
import '../data/local/sqlite_engine.dart';

/// Loads deterministic JSON rules from local assets and injects them 
/// into the encrypted SQLite database for offline execution.
class RulePackBootstrapper {
  
  static Future<void> loadInitialPacks() async {
    try {
      // Load the bundled initial JSON file
      final String jsonString = await rootBundle.loadString('assets/packs/v0/core_rules_en_base.json');
      final Map<String, dynamic> data = json.decode(jsonString);
      
      final manifest = data['manifest'] as Map<String, dynamic>;
      final rules = data['rules'] as List<dynamic>;
      
      // Parse manifest to SQLite friendly Map
      final parsedManifest = {
        'pack_id': manifest['pack_id'],
        'pack_type': manifest['pack_type'],
        'semantic_version': manifest['semantic_version'],
        'region_scope': json.encode(manifest['region_scope']),
        'min_schema_version': manifest['min_schema_version'],
        'is_active': 1
      };
      
      // Parse rules
      List<Map<String, dynamic>> parsedRules = rules.map((r) {
        return {
          'rule_id': r['rule_id'],
          'pack_id': manifest['pack_id'],
          'family': r['family'],
          'severity': r['severity'],
          'predicate_json': json.encode(r['predicate']),
          'outcome_json': json.encode(r['outcome']),
        };
      }).toList();
      
      // Insert into SQLite
      await SQLiteEngine.insertPack(parsedManifest, parsedRules);
      print("Base rule packs bootstrapped successfully into SQLite.");
    } catch (e) {
      print("Error bootstrapping rule packs: $e");
    }
  }
}
