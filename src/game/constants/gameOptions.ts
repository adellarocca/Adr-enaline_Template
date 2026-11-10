/** Accent shared by the UI. Phaser tints take a number; text styles take a hex string. */
export const ACCENT_TINT = 0xd63384;

const accentHex = `#${ACCENT_TINT.toString(16).padStart(6, '0').toUpperCase()}`;

/**
 * Fixed configuration.
 * `gameSize` is both the EXPAND base size, in game pixels, and the stage, in world units.
 * One canvas side stays at this size. The other grows to fill the screen.
 */
export const GameOptions = {
    debugMode: true,
    gameSize: {
        width: 640,
        height: 1050,
    },
    /** Free space around the stage, in world units. Zero keeps the stage flush on the short side. */
    stageMargin: 0,
    /** Shown around the stage when the screen is wider or taller than the stage. Matches the hex pattern. */
    backdropColor: 0xededed,
    /** Game timer max value, in seconds. */
    gameTimeMax: 10,
    /** Player speed, in pixels per second. */
    playerSpeed: 50,
    /** Game gravity. */
    gravity: 400,
    /** Player jump force. */
    jumpForce: 200,
    gameThemeTint: {
        asNumber: ACCENT_TINT,
        asString: accentHex,
    },
} as const;
