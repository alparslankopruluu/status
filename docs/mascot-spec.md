# docs/mascot-spec.md - Owl Mascot State Machine & SVG Visual Spec

Hooty the Status Owl is the core visual identifier of StatusOwl.

## Visual Design Rules

```
       HEALTHY (>70%)               ALERT (30-70%)              TIRED (10-30%)            EXHAUSTED (<10%)
     🟢 Flying / Soaring         🟡 Perched + Coffee         🟠 Frowning & Sweating      🔴 Sleeping zZz + Timer
    
          .---.                       .---.                       .---.                       .---.
         /     \                     /     \                     /     \                     /     \
        (  ^ v ^ )                   (  O v O )                 (  > v < )                  (  - v - ) zZz
       /|   --   |\                 /|   --   |\               /|   --   |\                /|   --   |\
      (  \      /  )               (  \  ☕ /  )             (  \   💧 /  )              (  \  🩹  /  )
       `--`----`--`                 `--`----`--`               `--`----`--`                `--`----`--`
      ⚡ Glowing Wings             ☕ Coffee Mug               💧 Sweat Drop               🩹 Bandage & zZz
```

---

## Mascot State Definitions

### 1. `flying` (Healthy: Score > 70%)
- **Primary Color**: Emerald Green / Neon Cyan (`#10B981` / `#06B6D4`)
- **Expression**: Big cheerful eyes, wide smile, raised wings.
- **Micro-Animations**: Wing flapping (1.2s loop), floating vertical bobbing, glowing aura particle effect.
- **Audio Feedback** (Optional): Light chime.

### 2. `alert` (Normal: 30% <= Score <= 70%)
- **Primary Color**: Warm Amber / Gold (`#F59E0B`)
- **Expression**: Attentive open eyes, holding a warm coffee mug with steam.
- **Micro-Animations**: Slow eye blinking (every 4s), steam rising from coffee.

### 3. `tired` (Low Quota: 10% <= Score < 30%)
- **Primary Color**: Warning Orange / Red-Orange (`#F97316`)
- **Expression**: Heavy eyelids, sad/frowning mouth, sweat drop on forehead.
- **Micro-Animations**: Shivering body effect, slow breathing.

### 4. `sleeping` (Exhausted: Score < 10% or Rate Limited)
- **Primary Color**: Crimson Red / Purple (`#EF4444` / `#8B5CF6`)
- **Expression**: Closed eyes (`- -`), nightcap or forehead bandage, snoring floating `zZz` bubbles.
- **Badge Overlay**: Active countdown timer pill displaying hours/minutes remaining until quota reset (e.g. `⏳ Reset in 02:45`).
- **Micro-Animations**: Floating rising `zZz` bubbles, gentle snoring chest expansion.
