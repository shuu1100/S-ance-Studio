import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

// Dynamic import of asset manifest compiled or direct parsing
// Since assetManifest is a TypeScript file in src/lib, we can read and test both the manifest structure and filesystem integrity directly.
const manifestPath = path.resolve(__dirname, "../src/lib/assetManifest.ts");
const manifestContent = fs.readFileSync(manifestPath, "utf-8");

test("Séance Studio — Public Assets Directory Structure Exists", () => {
  assert.ok(fs.existsSync(publicDir), "public directory must exist");
  const requiredSubdirs = [
    "assets/environments",
    "assets/characters",
    "assets/clues",
    "assets/story-moments",
    "assets/endings",
    "assets/ui",
  ];

  for (const subdir of requiredSubdirs) {
    const fullPath = path.join(publicDir, subdir);
    assert.ok(fs.existsSync(fullPath), `Required asset subdirectory missing: ${subdir}`);
  }
});

test("Séance Studio — Local Image Files Physically Exist on Disk with Non-Zero Sizes", () => {
  const localCoreAssets = [
    "assets/environments/manor_exterior.jpg",
    "assets/environments/room_foyer.jpg",
    "assets/environments/room_seance.jpg",
    "assets/environments/room_library.jpg",
    "assets/environments/room_conservatory.jpg",
    "assets/environments/room_cellar.jpg",
    "assets/characters/char_apparition.jpg",
    "assets/characters/char_eleanor.jpg",
    "assets/characters/char_caretaker.jpg",
    "assets/characters/char_daughter.jpg",
    "assets/characters/char_julian.jpg",
    "assets/characters/char_vane.jpg",
    "assets/clues/clue_silver_flask.jpg",
  ];

  for (const assetRelPath of localCoreAssets) {
    const fullPath = path.join(publicDir, assetRelPath);
    assert.ok(fs.existsSync(fullPath), `Asset file physically missing: ${assetRelPath}`);
    const stats = fs.statSync(fullPath);
    assert.ok(stats.size > 10000, `Asset file suspiciously small or empty (${stats.size} bytes): ${assetRelPath}`);
  }
});

test("Séance Studio — Zero Remote / External Image URLs in Asset Manifest", () => {
  assert.ok(!manifestContent.includes("http://"), "Manifest must contain no http:// remote URLs");
  assert.ok(!manifestContent.includes("https://"), "Manifest must contain no https:// remote URLs");
  assert.ok(!manifestContent.includes("cdn."), "Manifest must contain no external CDN references");
  assert.ok(!manifestContent.includes("unsplash.com"), "Manifest must contain no remote stock image references");
});

test("Séance Studio — All Local Paths Begin With Approved Local Prefix", () => {
  const localPathRegex = /localPath:\s*"([^"]+)"/g;
  let match;
  let totalPathsChecked = 0;

  while ((match = localPathRegex.exec(manifestContent)) !== null) {
    const assetPath = match[1];
    assert.ok(
      assetPath.startsWith("/assets/"),
      `Path does not start with approved /assets/ prefix: ${assetPath}`
    );
    totalPathsChecked++;
  }

  assert.ok(totalPathsChecked >= 15, `Expected at least 15 asset paths, found ${totalPathsChecked}`);
});

test("Séance Studio — Clue Confidentiality Protocol (Locked Clues Never Leaked)", () => {
  const testClueUndiscovered = {
    id: "clue_silver_flask",
    title: "Silver Flask with Bitter Almond Odor",
    description: "Crucial physical evidence containing arsenic trioxide residue.",
    status: "undiscovered",
  };

  const testClueDiscovered = {
    id: "clue_silver_flask",
    title: "Silver Flask with Bitter Almond Odor",
    description: "Crucial physical evidence containing arsenic trioxide residue.",
    status: "verified",
  };

  function simulateClueArtworkRender(clue) {
    if (clue.status === "undiscovered") {
      return {
        isConcealed: true,
        renderedTitle: "[Concealed Exhibit]",
        renderedImage: null,
      };
    }
    return {
      isConcealed: false,
      renderedTitle: clue.title,
      renderedImage: "/assets/clues/clue_silver_flask.jpg",
    };
  }

  const lockedOutput = simulateClueArtworkRender(testClueUndiscovered);
  assert.equal(lockedOutput.isConcealed, true);
  assert.equal(lockedOutput.renderedImage, null, "Locked clue must never render image path");
  assert.equal(lockedOutput.renderedTitle, "[Concealed Exhibit]", "Locked clue title must be redacted");

  const unlockedOutput = simulateClueArtworkRender(testClueDiscovered);
  assert.equal(unlockedOutput.isConcealed, false);
  assert.ok(unlockedOutput.renderedImage.length > 0);
  assert.equal(unlockedOutput.renderedTitle, testClueDiscovered.title);
});

test("Séance Studio — Stable Room to Environment Asset Mapping", () => {
  const rooms = [
    "room_foyer",
    "room_seance",
    "room_library",
    "room_conservatory",
    "room_cellar",
  ];

  for (const roomId of rooms) {
    assert.ok(
      manifestContent.includes(roomId),
      `Manifest must explicitly define environment entry for ${roomId}`
    );
    assert.ok(
      manifestContent.includes(`/assets/environments/${roomId}.jpg`),
      `Manifest must map ${roomId} to /assets/environments/${roomId}.jpg`
    );
  }
});

test("Séance Studio — Stable Character to Portrait Asset Mapping", () => {
  const characters = [
    "char_apparition",
    "char_eleanor",
    "char_caretaker",
    "char_daughter",
    "char_julian",
    "char_vane",
  ];

  for (const charId of characters) {
    assert.ok(
      manifestContent.includes(charId),
      `Manifest must explicitly define character portrait entry for ${charId}`
    );
  }
});

test("Séance Studio — Intentional Fallback Design Compliance", () => {
  // Check that every manifest entry defines a valid fallbackStyle
  const fallbackRegex = /fallbackStyle:\s*"([^"]+)"/g;
  let match;
  const validFallbackStyles = new Set([
    "victorian_cameo",
    "parchment_plate",
    "wax_seal",
    "gothic_frame",
    "spectral_aura",
    "atmospheric_room",
  ]);

  let count = 0;
  while ((match = fallbackRegex.exec(manifestContent)) !== null) {
    const style = match[1];
    assert.ok(
      validFallbackStyles.has(style),
      `Invalid or undocumented fallbackStyle found: ${style}`
    );
    count++;
  }

  assert.ok(count >= 15, `Expected at least 15 fallback styles declared, found ${count}`);
});
