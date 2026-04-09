import 'dart:convert';
import '../models/inventory_item.dart';
import '../../data/repositories/shopping_repository.dart';

/// Simulated algorithmic model for forecasting staple depletion
/// and converting shopping waves into commerce APIs.
class ForecastingEngine {

  /// Generates abstract future demands based on simple heuristics mapping to an Instacart API JSON structure.
  Future<Map<String, dynamic>> generateCheckoutPayload(List<ShoppingItem> cartItems, List<InventoryItem> inventory) async {
    // 1. Identify missing staples that weren't explicitly added but are low.
    final autoRefs = _forecastStaples(inventory);
    
    // 2. Build the exact Cart JSON for an external E-commerce API (e.g., Instacart/Amazon)
    final lineItems = cartItems.map((item) {
      return {
        "name": item.name,
        "quantity": item.quantity.isEmpty ? "1" : item.quantity,
        "source": "manual_wave",
      };
    }).toList();

    for (var a in autoRefs) {
      lineItems.add({
        "name": a,
        "quantity": "1",
        "source": "ai_forecasting",
      });
    }

    final int costCents = lineItems.length * 450; // mock $4.50 per item average

    final payload = {
      "store_id": "ST-90210",
      "delivery_window": "NEXT_AVAILABLE",
      "items": lineItems,
      "estimated_total_cents": costCents,
      "auth_token": "bearer xyz123"
    };

    return payload;
  }

  List<String> _forecastStaples(List<InventoryItem> inventory) {
    final staples = ['Milk', 'Eggs', 'Olive Oil', 'Salt'];
    final present = inventory.map((e) => e.name.toLowerCase()).toSet();
    
    List<String> needed = [];
    for (var staple in staples) {
      if (!present.contains(staple.toLowerCase())) {
        needed.add(staple);
      }
    }
    return needed;
  }
}
