import 'dart:collection';

/// Optional TLS pin map: host (lowercase) → allowed SPKI SHA-256 digests (bytes).
/// Wire into a custom [HttpClient] or `HttpOverrides` when you enable pinning (uplift U5).
class CertificatePins {
  CertificatePins._();

  static final Map<String, List<List<int>>> _pins = HashMap();

  static void registerSha256(String host, List<int> sha256DerSpki) {
    final h = host.toLowerCase();
    _pins.putIfAbsent(h, () => []).add(List<int>.unmodifiable(sha256DerSpki));
  }

  static List<List<int>>? pinsForHost(String host) {
    return _pins[host.toLowerCase()];
  }

  static void clear() => _pins.clear();
}
