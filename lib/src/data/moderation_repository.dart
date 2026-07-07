import 'package:supabase_flutter/supabase_flutter.dart';

class ModerationRepository {
  ModerationRepository({required this.client});

  final SupabaseClient? client;

  Future<void> blockUser(String blockedId) async {
    if (client == null || client!.auth.currentUser == null) return;
    
    final blockerId = client!.auth.currentUser!.id;
    await client!.from('blocked_users').upsert({
      'blocker_id': blockerId,
      'blocked_id': blockedId,
    });
  }

  Future<void> unblockUser(String blockedId) async {
    if (client == null || client!.auth.currentUser == null) return;
    
    final blockerId = client!.auth.currentUser!.id;
    await client!.from('blocked_users').delete().match({
      'blocker_id': blockerId,
      'blocked_id': blockedId,
    });
  }

  Future<Set<String>> getBlockedUsers() async {
    if (client == null || client!.auth.currentUser == null) return {};
    
    final blockerId = client!.auth.currentUser!.id;
    try {
      final response = await client!
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', blockerId);
          
      return (response as List).map((row) => row['blocked_id'] as String).toSet();
    } catch (e) {
      return {};
    }
  }

  Future<void> reportContent({
    String? tourId,
    String? commentId,
    String? reportedUserId,
    required String reason,
    String details = '',
  }) async {
    if (client == null || client!.auth.currentUser == null) return;
    
    final reporterId = client!.auth.currentUser!.id;
    String reportType = 'tour';
    if (commentId != null) reportType = 'comment';
    if (reportedUserId != null && tourId == null && commentId == null) reportType = 'user';

    await client!.from('reports').insert({
      'reporter_id': reporterId,
      'tour_id': tourId,
      'comment_id': commentId,
      'reported_user_id': reportedUserId,
      'report_type': reportType,
      'reason': reason,
      'details': details,
    });
  }
}
