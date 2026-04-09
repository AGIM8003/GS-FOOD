import 'package:flutter/material.dart';
import '../../app/services.dart';
import '../../engine/models/premium_models.dart';

class ChefTablePage extends StatefulWidget {
  const ChefTablePage({super.key});

  @override
  State<ChefTablePage> createState() => _ChefTablePageState();
}

class _ChefTablePageState extends State<ChefTablePage> {
  List<CommunityPost> _posts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final posts = await AppServices.community.getFeed();
    if (mounted) {
      setState(() {
        _posts = posts;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: AppBar(
        title: const Text("Chef's Table", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _posts.length,
                itemBuilder: (context, index) {
                  final post = _posts[index];
                  return _buildPostCard(post);
                },
              ),
      ),
    );
  }

  Widget _buildPostCard(CommunityPost post) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(backgroundColor: Colors.white12, child: Text(post.chefName[0], style: const TextStyle(color: Colors.white))),
              const SizedBox(width: 12),
              Text(post.chefName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              const Spacer(),
              const Icon(Icons.more_horiz, color: Colors.white54),
            ],
          ),
          const SizedBox(height: 16),
          Text(post.title, style: const TextStyle(color: Color(0xFF00FF66), fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
          const SizedBox(height: 8),
          Text(post.description, style: const TextStyle(color: Colors.white70, height: 1.4)),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(Icons.favorite_border, color: Colors.white54, size: 20),
              const SizedBox(width: 6),
              Text('${post.likes}', style: const TextStyle(color: Colors.white54)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF8C00).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('Cook This', style: TextStyle(color: Color(0xFFFF8C00), fontWeight: FontWeight.bold, fontSize: 12)),
              )
            ],
          )
        ],
      ),
    );
  }
}
