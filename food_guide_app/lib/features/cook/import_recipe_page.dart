import 'dart:ui';
import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../engine/models/inventory_item.dart';
import '../../engine/models/recipe.dart';
import '../../engine/models/shopping_item.dart';
import '../../engine/models/user_preferences.dart';

class RecipeImportPage extends StatefulWidget {
  const RecipeImportPage({super.key});

  @override
  State<RecipeImportPage> createState() => _RecipeImportPageState();
}

class _RecipeImportPageState extends State<RecipeImportPage> {
  final TextEditingController _urlController = TextEditingController();
  
  bool _isImporting = false;
  String _importError = '';
  Recipe? _importedRecipe;
  
  // Downstream analysis
  List<RecipeIngredient> _scaledIngredients = [];
  List<String> _ownedIngredients = [];
  List<String> _missingIngredients = [];
  
  UserPreferences? _prefs;
  List<InventoryItem> _inventory = [];

  @override
  void initState() {
    super.initState();
    _loadState();
  }

  Future<void> _loadState() async {
    _prefs = await AppServices.preferences.load();
    _inventory = await AppServices.inventory.getAll();
  }

  Future<void> _handleImport() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    setState(() {
      _isImporting = true;
      _importError = '';
      _importedRecipe = null;
    });

    try {
      final recipe = await AppServices.recipeImporter.importFromUrl(url);
      
      // Map to GS FOOD Scaling & Pantry
      _analyzeRecipe(recipe);

      if (mounted) {
        setState(() {
          _importedRecipe = recipe;
          _isImporting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _importError = e.toString().replaceAll('Exception: ', '');
          _isImporting = false;
        });
      }
    }
  }

  void _analyzeRecipe(Recipe recipe) {
    if (_prefs == null) return;
    
    // Scale Recipe to Household
    final int householdServings = _prefs!.calculatedHouseholdServings.round().clamp(1, 10);
    final double scalingFactor = recipe.servings > 0 ? householdServings / recipe.servings : 1.0;

    _scaledIngredients = recipe.ingredients.map((ing) {
       String scaledQty = ing.quantity;
       final qtyVal = double.tryParse(ing.quantity);
       if (qtyVal != null) {
          scaledQty = (qtyVal * scalingFactor).toStringAsFixed(1).replaceAll(RegExp(r'\.0$'), '');
       }
       return RecipeIngredient(name: ing.name, quantity: scaledQty, unit: ing.unit, optional: ing.optional);
    }).toList();

    // Check Pantry for Deficits
    _ownedIngredients = [];
    _missingIngredients = [];
    
    // Quick string-based normalization approach (Support Layer logic)
    for (var ing in _scaledIngredients) {
       final safeName = ing.name.toLowerCase();
       bool owned = false;
       for (var item in _inventory) {
          if (safeName.contains(item.name.toLowerCase()) || item.name.toLowerCase().contains(safeName)) {
             owned = true;
             break;
          }
       }
       
       if (owned) {
         _ownedIngredients.add(ing.name);
       } else {
         _missingIngredients.add(ing.name);
       }
    }
  }

  Future<void> _saveAsShoppingDeficits() async {
    for (final missing in _missingIngredients) {
       final match = _scaledIngredients.firstWhere((i) => i.name == missing);
       final item = ShoppingItem(
         id: DateTime.now().millisecondsSinceEpoch.toString() + missing.hashCode.toString(),
         name: missing,
         quantity: double.tryParse(match.quantity) ?? 1.0,
         unit: match.unit,
         source: ShoppingSource.deficit,
         category: InventoryCategory.other,
       );
       await AppServices.shopping.addItem(item);
    }
    
    if (mounted) {
       ScaffoldMessenger.of(context).showSnackBar(SnackBar(
         content: const Text('Missing items added to Shopping List (Deficits).', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
         backgroundColor: const Color(0xFF00FF66),
       ));
       Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: AppBar(
        title: const Text('Smart Recipe Importer', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Paste a recipe link from any food blog. GS FOOD will extract the structured data, sanitize the ingredients, scale them to your family, and calculate your shopping deficits.', style: TextStyle(color: Colors.white54, fontSize: 13, height: 1.5)),
              const SizedBox(height: 24),
              TextField(
                controller: _urlController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Recipe URL',
                  labelStyle: const TextStyle(color: Colors.white54),
                  hintText: 'https://...',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF111111),
                  prefixIcon: const Icon(Icons.link, color: Colors.white54),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  suffixIcon: _isImporting ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00FF66)),
                  ) : IconButton(
                    icon: const Icon(Icons.cloud_download, color: Color(0xFF00FF66)),
                    onPressed: _handleImport,
                  )
                ),
                onSubmitted: (_) => _handleImport(),
              ),
              
              if (_importError.isNotEmpty) ...[
                 const SizedBox(height: 16),
                 Container(
                   padding: const EdgeInsets.all(12),
                   decoration: BoxDecoration(color: const Color(0xFFFF3333).withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFF3333))),
                   child: Row(
                     children: [
                       const Icon(Icons.error_outline, color: Color(0xFFFF3333)),
                       const SizedBox(width: 8),
                       Expanded(child: Text(_importError, style: const TextStyle(color: Color(0xFFFF3333), fontWeight: FontWeight.bold))),
                     ],
                   )
                 )
              ],

              if (_importedRecipe != null) ...[
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111111),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFF00FF66).withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.check_circle, color: Color(0xFF00FF66)),
                          const SizedBox(width: 8),
                          Expanded(child: Text('Sanitized & Ready', style: const TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold))),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(_importedRecipe!.title, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 8),
                      Text('Scaled for: ${_prefs!.calculatedHouseholdServings.round()} members (Original: ${_importedRecipe!.servings})', style: const TextStyle(color: Colors.white54, fontSize: 13)),
                      
                      const SizedBox(height: 24),
                      const Text('In Your Pantry', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      if (_ownedIngredients.isEmpty) const Text('None.', style: TextStyle(color: Colors.white54))
                      else ..._ownedIngredients.map((i) => Row(children: [
                          const Icon(Icons.inventory, color: Colors.white24, size: 14), 
                          const SizedBox(width: 8), 
                          Expanded(child: Text(i, style: const TextStyle(color: Colors.white54))),
                      ])).toList(),

                      const SizedBox(height: 24),
                      const Text('Missing (Shopping Deficits)', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      if (_missingIngredients.isEmpty) const Text('You have everything!', style: TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold))
                      else ..._missingIngredients.map((i) => Row(children: [
                          const Icon(Icons.add_shopping_cart, color: Color(0xFFFF8C00), size: 14), 
                          const SizedBox(width: 8), 
                          Expanded(child: Text(i, style: const TextStyle(color: Color(0xFFFF8C00), fontWeight: FontWeight.bold))),
                      ])).toList(),

                      const SizedBox(height: 32),
                      if (_missingIngredients.isNotEmpty)
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00FF66), padding: const EdgeInsets.symmetric(vertical: 16)),
                            icon: const Icon(Icons.shopping_cart_checkout, color: Colors.black),
                            label: const Text('Add Missing to Shop', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                            onPressed: _saveAsShoppingDeficits,
                          )
                        )
                    ],
                  )
                )
              ]
            ],
          ),
        ),
      ),
    );
  }
}
