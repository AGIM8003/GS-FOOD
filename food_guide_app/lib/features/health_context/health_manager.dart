import 'dart:io';

/// Hardcoded GS FOOD V4 Health Mode constraints
enum HealthMode { h0_off, h1_wellness }

abstract class HealthStoreAdapter {
  Future<bool> requestPermissions();
  Future<Map<String, dynamic>?> fetchRecentGlucoseTrend();
  Future<Map<String, dynamic>?> fetchEnergyWindow();
}

class HealthConsentManager {
  final HealthStoreAdapter _adapter;
  HealthMode _currentMode = HealthMode.h0_off;
  
  HealthConsentManager(this._adapter);

  HealthMode get currentMode => _currentMode;

  Future<bool> initializeWellnessMode() async {
    // V4 Rule: Explicit Opt-in required
    final granted = await _adapter.requestPermissions();
    if (granted) {
      _currentMode = HealthMode.h1_wellness;
      return true;
    }
    _currentMode = HealthMode.h0_off;
    return false;
  }

  void revokeConsent() {
    _currentMode = HealthMode.h0_off;
  }
}

class HealthStoreAdapterIOS implements HealthStoreAdapter {
  @override
  Future<bool> requestPermissions() async {
    if (!Platform.isIOS) return false;
    // TBD: Actual HealthKit bridging via MethodChannel or health package
    return true; // Stub for V4 OS validation
  }

  @override
  Future<Map<String, dynamic>?> fetchRecentGlucoseTrend() async {
    if (!Platform.isIOS) return null;
    return {
      "glucose_recent_trend_state": "steady",
      "glucose_variability_band": "low",
      "confidence_score": 0.85,
      "data_freshness_seconds": 300,
    };
  }

  @override
  Future<Map<String, dynamic>?> fetchEnergyWindow() async {
    return {"user_energy_window": "nominal"};
  }
}

class HealthStoreAdapterAndroid implements HealthStoreAdapter {
  @override
  Future<bool> requestPermissions() async {
    if (!Platform.isAndroid) return false;
    // V4 Rule: Must be Health Connect, NOT Google Fit
    return true; // Stub for V4 OS validation
  }

  @override
  Future<Map<String, dynamic>?> fetchRecentGlucoseTrend() async {
    if (!Platform.isAndroid) return null;
    return {
      "glucose_recent_trend_state": "rising",
      "glucose_variability_band": "moderate",
      "confidence_score": 0.72,
      "data_freshness_seconds": 600,
    };
  }

  @override
  Future<Map<String, dynamic>?> fetchEnergyWindow() async {
    return {"user_energy_window": "post_workout"}; 
  }

}

class HealthEnvelopeBuilder {
  static Future<Map<String, dynamic>?> buildEnvelope(HealthConsentManager manager, HealthStoreAdapter adapter) async {
    if (manager.currentMode == HealthMode.h0_off) return null;

    final trend = await adapter.fetchRecentGlucoseTrend();
    final energy = await adapter.fetchEnergyWindow();

    if (trend == null) return null;

    return {
      "mode": "H1",
      "snapshot": {
        "snapshot_id": "snap_${DateTime.now().millisecondsSinceEpoch}",
        "user_id": "local_household_1",
        "source_type": Platform.isIOS ? "HealthKit" : "HealthConnect",
        "glucose_recent_trend_state": trend["glucose_recent_trend_state"],
        "glucose_variability_band": trend["glucose_variability_band"],
        "confidence_score": trend["confidence_score"],
        "data_freshness_seconds": trend["data_freshness_seconds"],
      },
      "user_energy_window": energy?["user_energy_window"]
    };
  }
}
