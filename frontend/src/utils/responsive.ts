import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Design baseline: iPhone 14 Pro Max (430 × 932 logical points)
const BASE_WIDTH = 430;
const BASE_HEIGHT = 932;

// Cap at the design baseline so elements never scale UP on tablets/laptops —
// only scale DOWN on smaller phones.
const EFFECTIVE_WIDTH = Math.min(SCREEN_WIDTH, BASE_WIDTH);
const EFFECTIVE_HEIGHT = Math.min(SCREEN_HEIGHT, BASE_HEIGHT);

/** Capped device width — never exceeds the design baseline. Use instead of Dimensions.get("window").width. */
export const deviceWidth  = EFFECTIVE_WIDTH;
/** Capped device height — never exceeds the design baseline. Use instead of Dimensions.get("window").height. */
export const deviceHeight = EFFECTIVE_HEIGHT;

/** Scale a horizontal/uniform size proportionally to screen width. Use for padding, margins, icon sizes, fixed widths/heights. */
export const scale = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((EFFECTIVE_WIDTH / BASE_WIDTH) * size));

/** Scale a vertical size proportionally to screen height. Use for heights that relate to the full screen. */
export const verticalScale = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((EFFECTIVE_HEIGHT / BASE_HEIGHT) * size));

/**
 * Scale a size with a dampening factor so it doesn't shrink/grow as aggressively.
 * Default factor 0.5 means half the scaling effect.
 * Ideal for font sizes — text should scale down slightly but not too much.
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  Math.round(PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor));
