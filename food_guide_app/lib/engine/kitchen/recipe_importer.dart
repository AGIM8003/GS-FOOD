import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import '../models/recipe.dart';

class RecipeImporter {
  // Support layer: Deduplication cache. Blocks immediate redundant network operations.
  final Set<String> _urlCache = {}; 

  Future<Recipe> importFromUrl(String url) async {
    if (_urlCache.contains(url)) {
      throw Exception('URL already imported in this session. Cached protection active.');
    }
    
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.isAbsolute) throw Exception('Malformed URL format.');
    
    final response = await http.get(uri).timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) {
      throw Exception('Failed fetching source. Network responded with HTTP ${response.statusCode}.');
    }

    final html = response.body;

    // Phase 2: Structured Extraction Layer
    Recipe recipe = await _extractStructuredData(html, url);
    
    // Phase 3: Sanitization Layer
    recipe = _sanitizeRecipe(recipe);

    _urlCache.add(url);
    return recipe;
  }

  Future<Recipe> _extractStructuredData(String html, String url) async {
    // Target schema.org standard JSON-LD structures seamlessly across food blogs
    final exp = RegExp(r'<script type="application/ld\+json">(.*?)</script>', dotAll: true);
    final matches = exp.allMatches(html);
    
    for (final match in matches) {
      try {
        final jsonStr = match.group(1);
        if (jsonStr == null) continue;
        
        // Some blogs wrap in HTML entities unnecessarily
        final decodedString = jsonStr.replaceAll('&quot;', '"');
        final dynamic decoded = jsonDecode(decodedString);
        Map<String, dynamic>? recipeData;

        if (decoded is List) {
           for (final item in decoded) {
              if (item['@type'] == 'Recipe' || (item['@type'] is List && (item['@type'] as List).contains('Recipe'))) {
                 recipeData = item as Map<String, dynamic>;
                 break;
              }
           }
        } else if (decoded is Map<String, dynamic>) {
           if (decoded['@type'] == 'Recipe' || _hasRecipeGraph(decoded)) {
               recipeData = _extractRecipeGraph(decoded);
           }
        }
        
        if (recipeData != null) {
          return _mapToRecipe(recipeData, url);
        }
      } catch (e) {
        // Fallthrough mapping loop if malformed.
      }
    }
    
    throw Exception('Failed to locate Schema.org Recipe structured data in source.');
  }

  bool _hasRecipeGraph(Map<String, dynamic> decoded) {
    if (decoded.containsKey('@graph')) {
      return (decoded['@graph'] as List).any((e) => e['@type'] == 'Recipe');
    }
    return decoded['@type'] == 'Recipe';
  }

  Map<String, dynamic> _extractRecipeGraph(Map<String, dynamic> decoded) {
    if (decoded.containsKey('@graph')) {
      return (decoded['@graph'] as List).firstWhere((e) => e['@type'] == 'Recipe') as Map<String, dynamic>;
    }
    return decoded;
  }

  Recipe _mapToRecipe(Map<String, dynamic> data, String url) {
    final title = data['name']?.toString() ?? 'Imported Recipe';
    
    List<RecipeIngredient> ingredients = [];
    if (data['recipeIngredient'] != null) {
       final ingList = data['recipeIngredient'] as List;
       for (final ingStr in ingList) {
          ingredients.add(RecipeIngredient(name: ingStr.toString(), quantity: '1', unit: 'unit'));
       }
    }

    List<String> instructions = [];
    if (data['recipeInstructions'] != null) {
       final instList = data['recipeInstructions'];
       if (instList is List) {
          for (final step in instList) {
              if (step is Map && step['text'] != null) {
                  instructions.add(step['text'].toString());
              } else if (step is String) {
                  instructions.add(step);
              }
          }
       }
    }

    int servings = 2;
    if (data['recipeYield'] != null) {
       final yieldStr = data['recipeYield'].toString();
       final match = RegExp(r'\d+').firstMatch(yieldStr);
       if (match != null) servings = int.parse(match.group(0)!);
    }

    return Recipe(
       id: const Uuid().v4(),
       title: title.replaceAll(RegExp(r'\s+'), ' ').trim(),
       ingredients: ingredients,
       instructions: instructions,
       servings: servings,
       source: url,
       imageUrl: _extractImage(data['image']),
    );
  }
  
  String? _extractImage(dynamic img) {
    if (img == null) return null;
    if (img is String) return img;
    if (img is List && img.isNotEmpty && img.first is String) return img.first.toString();
    if (img is Map && img['url'] != null) return img['url'].toString();
    return null;
  }

  Recipe _sanitizeRecipe(Recipe r) {
     if (r.title.isEmpty || r.ingredients.isEmpty) {
         throw Exception('Safety Intercept: Parsed recipe lacks structural truth (Missing title or empty ingredients). Refused.');
     }
     
     // Normalization string parsing
     return Recipe(
       id: r.id,
       title: r.title,
       servings: r.servings <= 0 ? 2 : r.servings,
       ingredients: r.ingredients.map((ing) {
          String safeName = ing.name.replaceAll(RegExp(r'<[^>]*>', multiLine: true), ''); // Strip invisible HTML injections
          return RecipeIngredient(name: safeName.trim(), quantity: ing.quantity, unit: ing.unit);
       }).where((i) => i.name.isNotEmpty && i.name.length < 150).toList(), // Dedupe noise lengths
       instructions: r.instructions.map((i) => i.replaceAll(RegExp(r'<[^>]*>', multiLine: true), '').trim()).toList(),
       source: r.source,
       imageUrl: r.imageUrl,
     );
  }
}
