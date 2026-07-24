import 'dart:async';
import 'package:flutter/material.dart';

/// A utility class to debounce actions (e.g. text search inputs, API calls).
class Debouncer {
  Debouncer({this.milliseconds = 350});

  final int milliseconds;
  Timer? _timer;

  void run(VoidCallback action) {
    _timer?.cancel();
    _timer = Timer(Duration(milliseconds: milliseconds), action);
  }

  void dispose() {
    _timer?.cancel();
  }
}
