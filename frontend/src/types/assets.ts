/**
 * Types for the Séance Studio Local Visual Storytelling and Asset System.
 */

export type AssetCategory =
  | "environment"
  | "character"
  | "clue"
  | "story-moment"
  | "ending"
  | "ui";

export type VisualVariant =
  | "default"
  | "restless"
  | "evasive"
  | "trance"
  | "spectral"
  | "compact"
  | "detail";

export interface AssetFocalPoint {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

export type FallbackDesignStyle =
  | "victorian_cameo"
  | "gothic_frame"
  | "wax_seal"
  | "parchment_plate"
  | "atmospheric_room"
  | "spectral_aura";

export interface AssetManifestEntry {
  id: string;
  category: AssetCategory;
  localPath: string; // Absolute path relative to public/
  altText: string;
  caption?: string;
  focalPoint?: AssetFocalPoint;
  variants?: Partial<Record<VisualVariant, string>>;
  fallbackStyle: FallbackDesignStyle;
  themeColor?: string;
  isAvailableLocally: boolean;
}
