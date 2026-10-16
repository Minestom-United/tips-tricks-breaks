---
layout: default
title: "Empty Chunks"
description: "Save server memory outside the build area: serve one shared air chunk instead of a thousand real ones."
permalink: /memory/
category: server
status: source-verified
tags: [memory, chunk-supplier, EmptyChunk, polar, world-border]
---

> **Verification:** `source-verified` on Minestom `2026.10.07-26.2`. The pattern
> comes from production code (hollow-cube `mapmaker`:
> `modules/map-core/.../instance/EmptyChunk.java` and `MapInstance.java`, commit
> `3d6419e`, 2026-10-12). The calls were checked against the Minestom javadoc
> (`InstanceContainer#setChunkSupplier`, `Chunk#getFullDataPacket`,
> `ChunkLoader.noop()`). The snippets below have not been run on their own, and
> the sizes are illustrative.
{: .note }

## What the player experiences

Nothing changes. Outside the map border the player still sees void or sky and
can fly through it. The difference is on the server. Instead of a full
`DynamicChunk` (sections, palettes, heightmaps, light arrays, tick maps) for
every 16×16 column, the instance holds a near-empty object that replays one
pre-built air packet.

This matters with a large view distance over a small map. Hollow Cube runs
`minestom.chunk-view-distance=16`, which is about 33×33 = 1,089 chunks per
player, over build plots that are often 8×8 real chunks. Without this trick,
roughly 1,000 air chunks per player would each be a real chunk object.

## Why it works

`InstanceContainer` asks a `ChunkSupplier` for a chunk object whenever it needs
one. The default supplier builds a `DynamicChunk`. Hollow Cube picks a chunk
type by position:

- inside the world border: a real chunk (`LitChunk` or `UnlitChunk`),
- outside the border: an `EmptyChunk`.

`EmptyChunk extends Chunk` and does three things:

1. **One shared payload.** A single static `ChunkData` and `LightData`, built
   once from 24 empty `Section`s. `getFullDataPacket()` returns
   `new ChunkDataPacket(chunkX, chunkZ, CHUNK_DATA, LIGHT_DATA)`. Every empty
   column sends the same bytes, and the only per-chunk allocation is the packet
   wrapper.
2. **No-ops for everything else.** `setBlock()` does nothing, `getBlock()`
   returns `Block.AIR`, `getBiome()` returns `Biome.PLAINS`, and `tick()`,
   `reset()` and `invalidate()` do nothing. `copy()` returns a new `EmptyChunk`.
   `getSections()` returns fresh empty `Section`s so callers can't change shared
   state.
3. **Never saved, never held twice.** Saving filters out empty chunks with
   `filter(chunk -> !(chunk instanceof EmptyChunk))`. After loading, the loader
   is replaced with `ChunkLoader.noop()`, so the `PolarWorld` bytes aren't kept
   next to the live chunks.

The border itself is a normal `WorldBorder`. Deciding whether a chunk is inside
it is a small box test on the chunk coordinates.

## Recipe: shared air outside the border

Swap the supplier in your `InstanceContainer` setup, after the world loads:

```java
import net.minestom.server.instance.ChunkLoader;
import net.minestom.server.instance.DynamicChunk;

instance.setChunkLoader(ChunkLoader.noop()); // drop the Polar copy after load
instance.setChunkSupplier((inst, chunkX, chunkZ) ->
    chunkIntersectsBorder(chunkX, chunkZ)
        ? new DynamicChunk(inst, chunkX, chunkZ)
        : new EmptyChunk(inst, chunkX, chunkZ));
```

Border test:

```java
boolean chunkIntersectsBorder(int chunkX, int chunkZ) {
    var border = instance.getWorldBorder();
    double radius = border.diameter() / 2d;
    int minX = chunkX * 16, minZ = chunkZ * 16;
    return minX < border.centerX() + radius
        && minX + 16 - 1 >= border.centerX() - radius
        && minZ < border.centerZ() + radius
        && minZ + 16 - 1 >= border.centerZ() - radius;
}
```

A trimmed `EmptyChunk`. Hollow Cube's full version also has a full-bright light
option and heightmap stubs:

```java
import java.util.ArrayList;
import java.util.BitSet;
import java.util.List;
import java.util.Map;
import net.minestom.server.MinecraftServer;
import net.minestom.server.instance.Chunk;
import net.minestom.server.instance.Instance;
import net.minestom.server.instance.Section;
import net.minestom.server.instance.block.Block;
import net.minestom.server.instance.block.BlockHandler;
import net.minestom.server.instance.palette.Palette;
import net.minestom.server.network.NetworkBuffer;
import net.minestom.server.network.packet.server.play.ChunkDataPacket;
import net.minestom.server.network.packet.server.play.data.ChunkData;
import net.minestom.server.network.packet.server.play.data.LightData;
import net.minestom.server.network.packet.server.SendablePacket;
import net.minestom.server.registry.RegistryKey;
import net.minestom.server.world.biome.Biome;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import static net.minestom.server.network.NetworkBuffer.SHORT;

public class EmptyChunk extends Chunk {
    private static final ChunkData CHUNK_DATA;
    private static final LightData LIGHT_DATA;
    static {
        var sections = new ArrayList<Section>();
        for (int i = 0; i < 24; i++) sections.add(new Section());
        CHUNK_DATA = new ChunkData(Map.of(), NetworkBuffer.makeArray(buffer -> {
            for (Section section : sections) {
                buffer.write(SHORT, (short) section.blockPalette().count());
                buffer.write(SHORT, (short) 0); // fluid count
                buffer.write(Palette.BLOCK_SERIALIZER, section.blockPalette());
                buffer.write(Palette.biomeSerializer(
                    MinecraftServer.getBiomeRegistry().size()), section.biomePalette());
            }
        }), Map.of());
        LIGHT_DATA = createLightData(sections);
    }

    public EmptyChunk(@NotNull Instance instance, int chunkX, int chunkZ) {
        super(instance, chunkX, chunkZ, false);
    }

    @Override
    protected void setBlock(int x, int y, int z, @NotNull Block block,
        BlockHandler.@Nullable Placement placement,
        BlockHandler.@Nullable Destroy destroy) { }

    @Override public @NotNull List<Section> getSections() {
        var out = new ArrayList<Section>();
        for (int i = minSection; i < maxSection; i++) out.add(new Section());
        return out;
    }
    @Override public @NotNull Section getSection(int s) { return new Section(); }
    @Override public void tick(long t) { }
    @Override public void reset() { }
    @Override public void invalidate() { }
    @Override public @NotNull SendablePacket getFullDataPacket() {
        return new ChunkDataPacket(chunkX, chunkZ, CHUNK_DATA, LIGHT_DATA);
    }
    @Override public @NotNull Chunk copy(@NotNull Instance i, int x, int z) {
        return new EmptyChunk(i, x, z);
    }
    @Override public Block getBlock(int x, int y, int z, @NotNull Condition c) {
        return Block.AIR;
    }
    @Override public @NotNull RegistryKey<Biome> getBiome(int x, int y, int z) {
        return Biome.PLAINS;
    }
    @Override public void setBiome(int x, int y, int z, @NotNull RegistryKey<Biome> b) { }

    private static LightData createLightData(List<Section> sections) {
        BitSet skyMask = new BitSet(), blockMask = new BitSet();
        BitSet emptySkyMask = new BitSet(), emptyBlockMask = new BitSet();
        List<byte[]> skyLights = new ArrayList<>(), blockLights = new ArrayList<>();
        int index = 0;
        for (Section section : sections) {
            index++;
            byte[] sky = section.skyLight().array(), block = section.blockLight().array();
            if (sky.length != 0) { skyLights.add(sky); skyMask.set(index); }
            else emptySkyMask.set(index);
            if (block.length != 0) { blockLights.add(block); blockMask.set(index); }
            else emptyBlockMask.set(index);
        }
        return new LightData(skyMask, blockMask, emptySkyMask, emptyBlockMask,
            skyLights, blockLights);
    }
}
```

The full version, including the full-bright light variant:
`https://github.com/hollow-cube/mapmaker/blob/3d6419e4418065c830cbd2c69ede8ffa85ed52e5/modules/map-core/src/main/java/net/hollowcube/mapmaker/map/instance/EmptyChunk.java`

Save filter, so empty chunks are never written to disk:

```java
polarWorld.saveChunks(instance.getChunks().stream()
    .filter(c -> !(c instanceof EmptyChunk))
    .toList());
if (polarWorld.chunks().isEmpty())
    throw new IllegalStateException("Avoiding saving empty instance!");
```

## Caveats, limits and revert

- **Outside the border only.** Chunks inside the border must stay editable. If
  you use `EmptyChunk` everywhere, `setBlock` silently does nothing and building
  breaks.
- **The skeleton is trimmed.** It may not compile as written, because the full
  class has more overrides. Start from Hollow Cube's file linked above.
- **Heightmaps and lighting are stubbed.** Hollow Cube's version throws on
  `motionBlockingHeightmap()` and builds light from empty sections. Its
  full-bright path uses a shared static light payload and calls
  `loader.setLoadLighting(false)` to skip the light engine. Pick one approach.
- **Revert.** Call `setChunkSupplier(DynamicChunk::new)` (or `LightingChunk::new`)
  and reload the affected columns. Anything that asks for a chunk again gets a
  real one.
- **Version drift.** This page pins `2026.10.07-26.2`. Hollow Cube runs
  `26_3-20260920`. The calls checked here (`setChunkSupplier`,
  `ChunkLoader.noop`, `getFullDataPacket`) exist in both, but re-check them
  before copying.
- **The client still downloads the air.** This saves server RAM and disk, not
  bandwidth. Each empty column still sends its small shared packet.
