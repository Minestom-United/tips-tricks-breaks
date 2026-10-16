---
layout: default
title: "Camera Rigs"
description: "Smooth cinematic cameras: seat the player on an invisible display entity, spectate it, and let interpolation do the smoothing."
permalink: /camera/
category: camera
status: source-verified
tags: [camera, spectate, passenger, display-entity, interpolation]
---

> **Verification:** `source-verified` on Minestom `2026.10.07-26.2`. Every call
> below was checked against the javadoc and server source, but we haven't run
> it on a live client yet. The rig design (passenger **plus** spectate on an
> `ITEM_DISPLAY`) comes from production code (bridgesplash GameSDK,
> `PlayerFreezeEntity`) and has been adapted to the Minestom core API.
{: .note }

## What the player experiences

Instead of snapping from point to point, the player's view **glides**. Position
and look direction ease toward each new waypoint over a fraction of a second,
like a cinematic camera path. It needs no client mods and no resource pack.

## Why it works

Two attachments do two different jobs, and the **order matters**:

1. **Passenger: the body rides the rig.** `rig.addPassenger(player)` seats the
   player on the entity. The server keeps the player's position tied to the rig,
   and the client follows the vehicle it rides. This is the reliable half. It
   keeps the body, position, and entity tracking consistent for the whole shot.
2. **Spectate: the camera follows the rig.** `player.spectate(rig)` sends the
   camera packet, and the client renders from the rig instead of the body. The
   spectate menu in the client only works in spectator mode, but the server-side
   packet works in any mode, because the client obeys the packet and ignores the
   menu state. Spectator mode is still recommended, so the player's own movement
   input doesn't fight the camera.

The smoothing comes from the fact that **display entities interpolate**. When
the rig teleports, the client doesn't snap it. It glides the rendered position
and rotation from the old values to the new ones over the **interpolation
duration**, measured in ticks. That number is the smoothness setting. At 5
ticks, each move eases over a quarter of a second. Larger values glide for
longer, but the camera trails further behind the server's real position.

Three properties of the rig keep it invisible and stable:

- **Invisible.** An `ITEM_DISPLAY` holding `ItemStack.AIR` renders nothing. The
  invisible flag is set as well, as a backup.
- **No physics.** The rig must never fall or drift mid-shot, and the server
  must not run collision checks on it. Gravity would fight every waypoint.
  That takes two things: `setNoGravity(true)` and `hasPhysics = false`.
- **No periodic re-syncs.** Vanilla and Minestom force-sync entity positions at
  an interval, and a re-sync that lands mid-glide visibly slows the end of the
  move. Setting the sync period to `Long.MAX_VALUE` turns this off for the rig.

> **Two similarly named fields. Don't mix them up.** `teleport_duration` (the
> NBT tag and the Paper API) is clamped to 0-59. Minestom's
> `setPosRotInterpolationDuration()` writes the raw entity-data field, which
> Minestom doesn't clamp, and which is reported to accept values above 59. The
> recipe uses 5 ticks, which is within every limit.
{: .warn }

## Recipe: display rig (current best)

Here is the rig as a small class. It is adapted from `PlayerFreezeEntity` and
ported to the Minestom core API. The original extends Tesseract's
`NoPhysicsEntity`, a small `Entity` subclass whose constructor calls
`setNoGravity(true)` and sets `hasPhysics = false`. The rig below does the same
two things inline:

```java
import net.minestom.server.entity.Entity;
import net.minestom.server.entity.EntityType;
import net.minestom.server.entity.metadata.display.ItemDisplayMeta;
import net.minestom.server.item.ItemStack;

public class CameraRig extends Entity {
    public CameraRig() {
        super(EntityType.ITEM_DISPLAY);
        setInvisible(true);
        setNoGravity(true); // the rig must never fall or drift
        hasPhysics = false; // and the server must not collide or move it
        // Don't let periodic position re-syncs stomp the client's glide.
        setSynchronizationTicks(Long.MAX_VALUE);
        editEntityMeta(ItemDisplayMeta.class, meta -> {
            meta.setItemStack(ItemStack.AIR); // invisible dolly
            // THE smoothness knob: ticks the client takes to glide per move.
            meta.setPosRotInterpolationDuration(5);
        });
    }
}
```

To drive it, add the passenger first, **then** spectate:

```java
import net.minestom.server.coordinate.Pos;
import net.minestom.server.entity.GameMode;
import net.minestom.server.entity.Player;

CameraRig rig = new CameraRig();
rig.setInstance(player.getInstance(), player.getPosition());

rig.addPassenger(player); // 1. body rides the rig
player.setGameMode(GameMode.SPECTATOR);
player.spectate(rig);     // 2. camera rides the rig's eyes

// One teleport per waypoint; each glide lasts ~5 ticks on the client.
Pos start = player.getPosition();
rig.teleport(new Pos(start.x() + 10, start.y() + 3, start.z()));

// Revert: camera home, player dismounts, rig despawned.
player.stopSpectating();
rig.removePassenger(player);
rig.remove();
```

For a full path, run one teleport per waypoint from a scheduler tick. Each
teleport glides on its own, so the spacing of your waypoints controls the
easing: close waypoints drift slowly, and distant ones sweep fast.

## Caveats, limits and revert

- **Order matters in two places.** When attaching, add the passenger before
  spectating. When moving, set the metadata before teleporting: the
  interpolation duration has to reach the client *before* the teleport packet,
  or the move snaps. Setting it when you build the rig, as above, covers this.
  If you change it mid-shot, leave at least one tick before the next teleport.
- **Reverting takes three calls.** `stopSpectating()` reattaches the camera to
  the body, `removePassenger(player)` dismounts, and `remove()` despawns the
  rig. If the player relogs mid-shot, their client resets its own camera, so
  clean up the entity on the server.
- **Needs playtesting.** We haven't measured in-game how the glide feels at
  different durations (5, 10, or 20 ticks), how yaw wraps on 180° turns, or how
  behavior differs across client versions. Playtest reports should include the
  client version.
