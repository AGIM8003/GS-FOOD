import 'package:uuid/uuid.dart';

class WineCellarItem {
  WineCellarItem({
    String? id,
    required this.name,
    this.type = '',
    this.vintage = '',
    this.region = '',
    this.pairingNotes = '',
    this.quantity = 1,
    DateTime? addedAt,
  })  : id = id ?? const Uuid().v4(),
        addedAt = addedAt ?? DateTime.now();

  final String id;
  final String name;
  final String type;
  final String vintage;
  final String region;
  final String pairingNotes;
  final int quantity;
  final DateTime addedAt;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'vintage': vintage,
      'region': region,
      'pairing_notes': pairingNotes,
      'quantity': quantity,
      'added_at': addedAt.millisecondsSinceEpoch,
    };
  }

  factory WineCellarItem.fromMap(Map<String, dynamic> map) {
    return WineCellarItem(
      id: map['id'] as String,
      name: map['name'] as String,
      type: map['type'] as String,
      vintage: map['vintage'] as String,
      region: map['region'] as String,
      pairingNotes: map['pairing_notes'] as String,
      quantity: map['quantity'] as int,
      addedAt: DateTime.fromMillisecondsSinceEpoch(map['added_at'] as int),
    );
  }
}

class SustainabilityLog {
  SustainabilityLog({
    String? id,
    required this.actionType,
    this.wasteSavedKg = 0.0,
    this.carbonNeutralizedKg = 0.0,
    this.moneySaved = 0.0,
    DateTime? loggedAt,
  })  : id = id ?? const Uuid().v4(),
        loggedAt = loggedAt ?? DateTime.now();

  final String id;
  final String actionType;
  final double wasteSavedKg;
  final double carbonNeutralizedKg;
  final double moneySaved;
  final DateTime loggedAt;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'action_type': actionType,
      'waste_saved_kg': wasteSavedKg,
      'carbon_neutralized_kg': carbonNeutralizedKg,
      'money_saved': moneySaved,
      'logged_at': loggedAt.millisecondsSinceEpoch,
    };
  }

  factory SustainabilityLog.fromMap(Map<String, dynamic> map) {
    return SustainabilityLog(
      id: map['id'] as String,
      actionType: map['action_type'] as String,
      wasteSavedKg: (map['waste_saved_kg'] as num).toDouble(),
      carbonNeutralizedKg: (map['carbon_neutralized_kg'] as num).toDouble(),
      moneySaved: (map['money_saved'] as num).toDouble(),
      loggedAt: DateTime.fromMillisecondsSinceEpoch(map['logged_at'] as int),
    );
  }
}

class CommunityPost {
  CommunityPost({
    String? id,
    required this.chefName,
    this.chefAvatarUrl,
    required this.title,
    required this.description,
    this.likes = 0,
    DateTime? postedAt,
  })  : id = id ?? const Uuid().v4(),
        postedAt = postedAt ?? DateTime.now();

  final String id;
  final String chefName;
  final String? chefAvatarUrl;
  final String title;
  final String description;
  final int likes;
  final DateTime postedAt;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'chef_name': chefName,
      'chef_avatar_url': chefAvatarUrl,
      'title': title,
      'description': description,
      'likes': likes,
      'posted_at': postedAt.millisecondsSinceEpoch,
    };
  }

  factory CommunityPost.fromMap(Map<String, dynamic> map) {
    return CommunityPost(
      id: map['id'] as String,
      chefName: map['chef_name'] as String,
      chefAvatarUrl: map['chef_avatar_url'] as String?,
      title: map['title'] as String,
      description: map['description'] as String,
      likes: map['likes'] as int,
      postedAt: DateTime.fromMillisecondsSinceEpoch(map['posted_at'] as int),
    );
  }
}
