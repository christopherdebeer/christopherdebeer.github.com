---
title: Gesture recognition encodes motion as intent
status: seedling
created: 2026-01-25
---

The problem: map continuous sensor data (accelerometers, gyroscopes, cameras) to discrete semantic actions.

Approaches range from template matching (compare trajectory shapes) to learned classifiers (train on labeled examples). Template matching works surprisingly well for small gesture vocabularies.

The challenge isn't accuracy—it's designing gestures that are distinct enough to recognize reliably and natural enough to remember.

See also: [[simcap]], [[tflite]]
