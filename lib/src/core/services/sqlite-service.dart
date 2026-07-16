// ignore_for_file: file_names, depend_on_referenced_packages

import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class SqliteService {
  SqliteService();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDb();
    return _db!;
  }

  Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final pathString = join(dbPath, 'vibetours_cache.db');

    return openDatabase(
      pathString,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE wikipedia_cache (
            coords_key TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE INDEX idx_wikipedia_coords ON wikipedia_cache (coords_key)
        ''');
      },
    );
  }

  String _buildCoordsKey(double lat, double lon) {
    return '${lat.toStringAsFixed(4)}_${lon.toStringAsFixed(4)}';
  }

  Future<Map<String, String>?> getWikipediaCache(double lat, double lon) async {
    try {
      final db = await database;
      final key = _buildCoordsKey(lat, lon);
      final List<Map<String, dynamic>> maps = await db.query(
        'wikipedia_cache',
        columns: ['name', 'description'],
        where: 'coords_key = ?',
        whereArgs: [key],
        limit: 1,
      );

      if (maps.isNotEmpty) {
        final row = maps.first;
        return {
          'name': row['name']?.toString() ?? '',
          'description': row['description']?.toString() ?? '',
        };
      }
    } catch (e) {
      debugPrint('Error reading SQLite wikipedia_cache: $e');
    }
    return null;
  }

  Future<void> saveWikipediaCache(
    double lat,
    double lon,
    String name,
    String description,
  ) async {
    try {
      final db = await database;
      final key = _buildCoordsKey(lat, lon);
      final now = DateTime.now().toIso8601String();

      await db.insert(
        'wikipedia_cache',
        {
          'coords_key': key,
          'name': name,
          'description': description,
          'created_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } catch (e) {
      debugPrint('Error inserting SQLite wikipedia_cache: $e');
    }
  }
}
