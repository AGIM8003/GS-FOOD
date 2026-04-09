import 'package:flutter/material.dart';
import '../../ui/golden_gourmet_scaffold.dart';
import '../../ui/sanctity_header.dart';
import 'dart:math';

class FitnessDashboardPage extends StatelessWidget {
  const FitnessDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return GoldenGourmetScaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: const SanctityHeader(title: 'Premium Fitness Sync'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Metabolic Bio-Sync',
                style: TextStyle(color: Color(0xFF00FF66), fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -0.5),
              ),
              const SizedBox(height: 8),
              const Text(
                'Real-time synthesis of your metabolic load, inflammatory index, and recovery status.',
                style: TextStyle(color: Colors.white54, fontSize: 14),
              ),
              const SizedBox(height: 32),
              
              _buildMetricCard(
                title: 'Inflammatory Score (7-Day Avg)',
                value: 'Low',
                metric: '2.1',
                metricUnit: 'hs-CRP sim',
                icon: Icons.local_fire_department,
                color: const Color(0xFF00FF66),
                progress: 0.8,
              ),
              const SizedBox(height: 16),
              
              _buildMetricCard(
                title: 'Satiety Baseline',
                value: 'Optimized',
                metric: '88',
                metricUnit: '%',
                icon: Icons.monitor_weight,
                color: const Color(0xFF00BFFF),
                progress: 0.88,
              ),
              const SizedBox(height: 16),
              
              _buildMetricCard(
                title: 'Metabolic Load',
                value: 'Elevated (Pre-Workout)',
                metric: '140',
                metricUnit: 'BPM / Caloric Deficit',
                icon: Icons.fitness_center,
                color: const Color(0xFFFF8C00),
                progress: 0.6,
              ),
              
              const SizedBox(height: 32),
              const Text('Performance Mode', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF111111),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF00FF66).withOpacity(0.3)),
                  boxShadow: [BoxShadow(color: const Color(0xFF00FF66).withOpacity(0.05), blurRadius: 20)]
                ),
                child: const Column(
                  children: [
                    Row(
                      children: [
                        Icon(Icons.sync, color: Color(0xFF00FF66)),
                        SizedBox(width: 12),
                        Expanded(child: Text('Apple Health / Google Fit Synchronized', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                        Icon(Icons.check_circle, color: Color(0xFF00FF66))
                      ],
                    ),
                    SizedBox(height: 16),
                    Text('Your next shopping wave has been automatically adjusted. High-potassium and magnesium-rich items have been prioritized for your upcoming Marathon Prep cycle.', style: TextStyle(color: Colors.white54, fontSize: 13, height: 1.5)),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String metric,
    required String metricUnit,
    required IconData icon,
    required Color color,
    required double progress,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.03), blurRadius: 15, spreadRadius: 2),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(title, style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600))),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(metric, style: TextStyle(color: color, fontSize: 36, fontWeight: FontWeight.black, letterSpacing: -1)),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 6.0),
                child: Text(metricUnit, style: const TextStyle(color: Colors.white38, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              const Spacer(),
              Text(value, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.white12,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
            borderRadius: BorderRadius.circular(10),
          )
        ],
      ),
    );
  }
}
