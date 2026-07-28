// ignore_for_file: file_names, depend_on_referenced_packages

import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../../domain/models.dart';

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
      version: 2,
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
        await _createOfflineToursTable(db);
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await _createOfflineToursTable(db);
        }
      },
    );
  }

  Future<void> _createOfflineToursTable(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS offline_tours (
        id TEXT PRIMARY KEY,
        title TEXT,
        city TEXT,
        country TEXT,
        json_data TEXT,
        created_at TEXT
      )
    ''');
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

  // --- OFFLINE TOURS METHODS ---

  Future<void> saveOfflineTour(Tour tour) async {
    try {
      final db = await database;
      final jsonData = jsonEncode(tour.toCreationJson());
      await db.insert(
        'offline_tours',
        {
          'id': tour.id,
          'title': tour.title,
          'city': tour.city,
          'country': tour.country,
          'json_data': jsonData,
          'created_at': DateTime.now().toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } catch (e) {
      debugPrint('Error saving SQLite offline_tours: $e');
    }
  }

  Future<bool> isTourSavedOffline(String tourId) async {
    try {
      final db = await database;
      final maps = await db.query(
        'offline_tours',
        columns: ['id'],
        where: 'id = ?',
        whereArgs: [tourId],
        limit: 1,
      );
      return maps.isNotEmpty;
    } catch (e) {
      debugPrint('Error checking SQLite isTourSavedOffline: $e');
      return false;
    }
  }

  Future<void> removeOfflineTour(String tourId) async {
    try {
      final db = await database;
      await db.delete(
        'offline_tours',
        where: 'id = ?',
        whereArgs: [tourId],
      );
    } catch (e) {
      debugPrint('Error removing SQLite offline_tours: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getOfflineTours() async {
    try {
      final db = await database;
      return await db.query('offline_tours', orderBy: 'created_at DESC');
    } catch (e) {
      debugPrint('Error reading SQLite getOfflineTours: $e');
      return [];
    }
  }
}
