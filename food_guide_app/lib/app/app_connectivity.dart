import 'package:connectivity_plus/connectivity_plus.dart';

/// Thin wrapper over connectivity_plus (Phase 0 offline banner).
class AppConnectivity {
  AppConnectivity._();

  static final AppConnectivity instance = AppConnectivity._();

  final Connectivity _connectivity = Connectivity();

  /// First yield is current connectivity, then subsequent changes.
  Stream<List<ConnectivityResult>> get onResults async* {
    yield await _connectivity.checkConnectivity();
    yield* _connectivity.onConnectivityChanged;
  }

  Future<bool> get isOnline async {
    final r = await _connectivity.checkConnectivity();
    return !r.contains(ConnectivityResult.none);
  }
}
