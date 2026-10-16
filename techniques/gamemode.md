---
layout: default
title: "Gamemode Spoofing"
description: "Send mismatched gamemode packets so the client renders one gamemode while the server enforces another."
permalink: /gamemode/
category: player-state
status: source-verified
tags: [gamemode, packets, ChangeGameStatePacket, PlayerInfoUpdatePacket]
---

> **Verification:** `source-verified` on Minestom `2026.10.07-26.2`. The javadoc
> and the `Player#setGameMode` source were checked. Client behavior has **not
> been playtested yet**, so treat the notes on what the player experiences as
> predictions, not measurements.
{: .note }

## What the player experiences

The main example is **creative powers with spectator noclip**. The client
renders the world as a spectator (no collision, free camera movement), while the
server still treats the player as creative (instant break, invulnerability,
creative tab-list entry). The same method gives you any other hybrid.

## Why it works

"Gamemode" is really **three separate channels**. Minestom keeps them in sync
through `Player#setGameMode`, which sends all of the following:

| Channel | Packet / state | Controls |
|---|---|---|
| Client renderer | `ChangeGameStatePacket(Reason.CHANGE_GAMEMODE, n)` sent to **the player only** | Abilities, UI, collision prediction, and the F3 readout. This is what *you* see and feel. |
| Tab list | `PlayerInfoUpdatePacket(UPDATE_GAME_MODE, …)` broadcast to **everyone** | What *other players* see in the player list. |
| Server authority | `gameMode` field, `refreshAbilities()`, `updateCollisions()` | What the server *enforces*: digging rules, damage, and collision shape. |

The hack is to **stop keeping them in sync**. Call `setGameMode` to set the real
mode (server state and tab list), then overwrite the first channel by sending
one packet to that client. The client follows the last gamemode packet it got,
and the server follows its own field. Neither side knows they disagree.

## Recipe: creative on the server, spectator on the client

```java
import net.minestom.server.entity.GameMode;
import net.minestom.server.entity.Player;
import net.minestom.server.network.packet.server.play.ChangeGameStatePacket;

// 1. Server truth: creative powers, and everyone sees CREATIVE in tab list.
player.setGameMode(GameMode.CREATIVE);

// 2. Lie to THIS client only: render as spectator (noclip camera).
player.sendPacket(new ChangeGameStatePacket(
    ChangeGameStatePacket.Reason.CHANGE_GAMEMODE,
    GameMode.SPECTATOR.ordinal()));

// 3. Revert: re-send the truth (setGameMode re-syncs all three channels).
player.setGameMode(player.getGameMode());
```

You can swap in any modes you like: pick the real mode for step 1 and the
displayed mode for step 2. For a survival player with a creative UI, use
`SURVIVAL` on the server and `CREATIVE` on the client. To make a vanilla client
display a mode the server doesn't enforce, it's the same two lines.

## Caveats, limits and revert

- **The spectator renderer has side effects.** A spectator client hides the
  hotbar and changes how interaction works (Minestom issue #2040 reports this
  for mode mismatches during configuration). Whether block breaking and placing
  works from a spectator renderer is the biggest open question. **Don't promise
  creative building with noclip until someone playtests it.** For now this
  recipe is safest for cameras, transit, and observation.
- **The spoof is per player and easy to break.** Anything that re-syncs the
  client overwrites it with the real mode: `setGameMode`, respawn, a dimension
  change, or a relog. Re-apply it after those events if it needs to last.
- **The tab list shows the real mode.** Step 1 broadcasts the real mode to
  everyone. To fake the *tab list* entry instead, you need a custom
  `PlayerInfoUpdatePacket` broadcast. That is possible, but it affects every
  viewer.
- **Anticheat and movement checks** (yours or a plugin's) may flag noclip
  movement as cheating. Adjust your own validation, or exempt affected players.
- **Behavior depends on the client version.** Gamemode-driven client behavior
  changes between versions, so include the exact client version when you report
  results.
