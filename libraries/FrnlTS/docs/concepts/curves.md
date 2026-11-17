# Curves

A Curve maps an input domain to a property value.

For FRNL state animation, every Curve uses a canonical one-second domain:

    0.0s ---------------- 1.0s

The Curve itself has no playback duration.

A Curve can drive a modulatable Property wherever that property's semantic contract permits modulation. This includes applicable Slot Properties, allowing Slot layout relationships to be animated independently of the contained UI entity.

## Phase interpretation

For a finite Attack or Release phase, the phase duration remaps the one-second Curve domain.

A 0.5 second phase compresses the Curve into 0.5 seconds. A 2 second phase stretches it across 2 seconds.

Conceptually:

    normalizedTime = elapsedPhaseTime / phaseDuration

Sustain repeatedly evaluates the Curve over its one-second domain.

The same normalized Curve mechanism is therefore used for Visual Asset properties and Slot Properties. The property being modulated changes; the Curve and temporal semantics do not.
