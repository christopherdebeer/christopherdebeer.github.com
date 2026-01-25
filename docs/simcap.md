---
title: SIMCAP turns motion into meaning
status: seedling
created: 2026-01-25
---

A [[project]] for [[gesture-recognition]] using inertial measurement. Sensor Inferred Motion CAPture.

Hardware: 9-DoF IMU streaming at 50 Hz over Bluetooth Low Energy, running on [[espruino]].

Software pipeline:
- Real-time sensor visualization
- Labeled gesture collection for training data
- Template-based recognition via 3D spatial matching
- ML pipeline with [[tflite]] export for on-device inference

Multiple firmware variants (GAMBIT, MOUSE, KEYBOARD, BAE) enable different input modalities—gestures become keystrokes, mouse movements, or custom triggers.

The insight: small motions carry semantic weight when you build the vocabulary.

Live: [simcap.parc.land](https://simcap.parc.land)

See also: [[dygram]], [[parc-land]]
