import React from 'react';

/**
 * NodeVault Enterprise Wireframe Vector Icon System
 * Designed with precise 24×24 geometry, multi-segment line-art,
 * and high-tech crypto launchpad aesthetics (only.meme / Linear / Raydium style).
 */

const baseSvgProps = (size = 20, stroke = 1.75, className = '', color = 'currentColor') => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: stroke,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: `nv-wire-icon ${className}`.trim(),
});

// 1. Validator Node Cube (Isometric 3D Wireframe with Core)
export function IconNodeCube({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Outer Hexagonal Bounds */}
      <path d="M12 2.5L20.5 7.4V16.6L12 21.5L3.5 16.6V7.4L12 2.5Z" />
      {/* 3D Internal Axis Edges */}
      <path d="M12 12V21.5" />
      <path d="M12 12L20.5 7.4" />
      <path d="M12 12L3.5 7.4" />
      {/* Inner Floating Core Wireframe */}
      <path d="M12 6.5L16 8.8V13.2L12 15.5L8 13.2V8.8L12 6.5Z" strokeOpacity="0.5" />
      {/* Vertex Coordinate Pins */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 2. NIBSS Regulatory Shield (Circuit Security & Settlement Guarantee)
export function IconShieldNIBSS({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Outer Security Shield */}
      <path d="M12 2.5L20 6.2V13.8C20 18.2 16.6 21.2 12 22C7.4 21.2 4 18.2 4 13.8V6.2L12 2.5Z" />
      {/* Horizontal Data Divider */}
      <path d="M4.5 10.5H19.5" strokeOpacity="0.35" />
      {/* NIBSS Central Security Check */}
      <path d="M9 7.8L11 9.8L15 5.8" />
      {/* Lower Inter-Bank Register Bars */}
      <path d="M8 14H16" strokeOpacity="0.8" />
      <path d="M9.5 17H14.5" strokeOpacity="0.5" />
    </svg>
  );
}

// 3. Lightning Engine / $NVT Yield & Mining Bolt
export function IconLightningNVT({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Dual-Phase Energy Bolt */}
      <path d="M13 2.5L4.5 13.5H12L11 21.5L19.5 10.5H12L13 2.5Z" />
      {/* Energy Ray Guides */}
      <path d="M2.5 8H4.5" strokeOpacity="0.4" />
      <path d="M19.5 16H21.5" strokeOpacity="0.4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// 4. Binary Tree Matrix / Sub-Node Downline
export function IconBinaryTree({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Root Node */}
      <circle cx="12" cy="4.5" r="2.5" />
      {/* Left & Right Child Nodes */}
      <circle cx="6" cy="13.5" r="2.2" />
      <circle cx="18" cy="13.5" r="2.2" />
      {/* Primary Connectors */}
      <path d="M10.2 6.5L7.8 11.5" />
      <path d="M13.8 6.5L16.2 11.5" />
      {/* Secondary Downline Branches */}
      <path d="M4.8 15.5L3.5 19" strokeOpacity="0.5" />
      <path d="M7.2 15.5L8.5 19" strokeOpacity="0.5" />
      <path d="M16.8 15.5L15.5 19" strokeOpacity="0.5" />
      <path d="M19.2 15.5L20.5 19" strokeOpacity="0.5" />
      {/* Leaf Terminals */}
      <circle cx="3.5" cy="19.5" r="1" fill="currentColor" />
      <circle cx="8.5" cy="19.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="19.5" r="1" fill="currentColor" />
      <circle cx="20.5" cy="19.5" r="1" fill="currentColor" />
    </svg>
  );
}

// 5. Neoclassical Bank / NUBAN Clearing & EMTL
export function IconBank({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Pediment / Roof Gable */}
      <path d="M2.5 9.5L12 3.5L21.5 9.5H2.5Z" />
      {/* Architrave Beam */}
      <path d="M2.5 11H21.5" />
      {/* 4 Architectural Fluted Columns */}
      <path d="M5.5 11V18" />
      <path d="M9.5 11V18" />
      <path d="M14.5 11V18" />
      <path d="M18.5 11V18" />
      {/* Stylobate / Stepped Plinth */}
      <path d="M3.5 18H20.5" />
      <path d="M2 20.5H22" />
      {/* Central Vault Aperture */}
      <circle cx="12" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}

// 6. Enterprise Blade Server / Mining Rack
export function IconServer({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Blade Bay 1 */}
      <rect x="3" y="3.5" width="18" height="5" rx="1.5" />
      <circle cx="6.5" cy="6" r="1" fill="currentColor" />
      <path d="M10 6H17.5" strokeOpacity="0.4" />

      {/* Blade Bay 2 */}
      <rect x="3" y="9.5" width="18" height="5" rx="1.5" />
      <circle cx="6.5" cy="12" r="1" fill="currentColor" />
      <path d="M10 12H17.5" strokeOpacity="0.4" />

      {/* Blade Bay 3 */}
      <rect x="3" y="15.5" width="18" height="5" rx="1.5" />
      <circle cx="6.5" cy="18" r="1" fill="currentColor" />
      <path d="M10 18H17.5" strokeOpacity="0.4" />
    </svg>
  );
}

// 7. Official WhatsApp Channel Wireframe
export function IconWhatsApp({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Dialogue Speech Boundary */}
      <path d="M20.5 11.5C20.5 16.5 16.5 20.5 11.5 20.5C9.8 20.5 8.2 20 6.8 19.2L3 20.5L4.4 16.8C3.5 15.3 3 13.5 3 11.5C3 6.5 7 2.5 12 2.5C16.8 2.5 20.5 6.5 20.5 11.5Z" />
      {/* Handset Contour */}
      <path d="M8.5 8.5C8.8 8 9.4 8 9.9 8.2C10.3 8.4 11 9.5 11.1 9.8C11.3 10.1 11.3 10.4 11 10.7C10.7 11 10.5 11.2 10.8 11.8C11.1 12.4 11.8 13.2 12.5 13.6C13.1 13.9 13.3 13.7 13.6 13.4C13.9 13.1 14.3 13.2 14.6 14C14.9 14.8 14.6 15.2 14.2 15.5C13.8 15.8 12.9 16 11.8 15.2C10.2 14.1 8.8 12 8.3 10.2C8 9.3 8.2 8.9 8.5 8.5Z" strokeWidth={stroke * 0.9} />
    </svg>
  );
}

// 8. Official Telegram Bot Channel Wireframe
export function IconTelegram({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Target Orbit Ring */}
      <circle cx="12" cy="12" r="9.5" strokeOpacity="0.4" />
      {/* Supersonic Glider Dart */}
      <path d="M5.5 11.8L18.5 6.5L14.8 18L11 14.2L8.2 16V13L15 8.8L7.8 12.5L5.5 11.8Z" />
    </svg>
  );
}

// 9. $NVT Sovereign Currency Coin / Projection Switcher
export function IconCurrencyNVT({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Outer Coin Perimeter */}
      <circle cx="12" cy="12" r="9.5" />
      {/* Inner Concentric Bezel */}
      <circle cx="12" cy="12" r="7" strokeOpacity="0.4" />
      {/* NVT 'N' Monogram */}
      <path d="M9.5 8.5V15.5L14.5 8.5V15.5" />
      {/* Parity Axis Tick Marks */}
      <path d="M12 2.5V4" strokeOpacity="0.6" />
      <path d="M12 20V21.5" strokeOpacity="0.6" />
      <path d="M2.5 12H4" strokeOpacity="0.6" />
      <path d="M20 12H21.5" strokeOpacity="0.6" />
    </svg>
  );
}

// 10. Compass Rose / Platform Exploration & Simulator
export function IconCompass({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Azimuth Dial */}
      <circle cx="12" cy="12" r="9.5" />
      {/* 4 Cardinal Ticks */}
      <path d="M12 2.5V5" />
      <path d="M12 19V21.5" />
      <path d="M2.5 12H5" />
      <path d="M19 12H21.5" />
      {/* Faceted Magnetic Needle */}
      <polygon points="12,6.5 14.5,12 12,17.5 9.5,12" strokeWidth={stroke} />
      <line x1="12" y1="6.5" x2="12" y2="17.5" strokeOpacity="0.6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 11. Protocol Dashboard / Telemetry Console HUD
export function IconDashboard({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* 4 Modular Telemetry Pods */}
      <rect x="3" y="3.5" width="8" height="7.5" rx="1.75" />
      <rect x="13" y="3.5" width="8" height="5.5" rx="1.75" />
      <rect x="13" y="11" width="8" height="9.5" rx="1.75" />
      <rect x="3" y="13" width="8" height="7.5" rx="1.75" />
      {/* Telemetry Sensor Bars inside Pods */}
      <path d="M5.5 7.5H8.5" strokeOpacity="0.5" />
      <path d="M15.5 15.5H18.5" strokeOpacity="0.5" />
      <path d="M15.5 17.5H17" strokeOpacity="0.5" />
      <path d="M5.5 17H7.5" strokeOpacity="0.5" />
    </svg>
  );
}

// 12. Smart KYC Credential / Biometric Identity
export function IconKYC({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Smart Card Boundary */}
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      {/* Biometric Portrait Frame */}
      <circle cx="7.5" cy="10" r="2" />
      <path d="M5 14.5C5 13.2 6.1 12.5 7.5 12.5C8.9 12.5 10 13.2 10 14.5" />
      {/* Cryptographic Contact Chip */}
      <rect x="13" y="7.5" width="5.5" height="4" rx="0.75" strokeOpacity="0.6" />
      {/* Data Signature Tracks */}
      <path d="M13 14H18.5" strokeOpacity="0.4" />
      <path d="M13 16.5H16.5" strokeOpacity="0.4" />
    </svg>
  );
}

// 13. Sliders / Tuning & Interactive Simulator
export function IconSliders({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      {/* Track 1 */}
      <line x1="4" y1="7" x2="20" y2="7" />
      <circle cx="8" cy="7" r="2.5" fill="var(--bg-base, #0b0f19)" />

      {/* Track 2 */}
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="16" cy="12" r="2.5" fill="var(--bg-base, #0b0f19)" />

      {/* Track 3 */}
      <line x1="4" y1="17" x2="20" y2="17" />
      <circle cx="11" cy="17" r="2.5" fill="var(--bg-base, #0b0f19)" />
    </svg>
  );
}

// 14. Check Verification Badge
export function IconCheckCircle({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 12.2L10.8 15L16 9" />
    </svg>
  );
}

// 15. Cross / Dismissal Badge
export function IconXCircle({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9 9L15 15" />
      <path d="M15 9L9 15" />
    </svg>
  );
}

// 16. Refresh / Synchronization Vortex
export function IconRefresh({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
      <path d="M3 3V8H8" />
      <path d="M3 12A9 9 0 0 0 18 18.7L21 16" />
      <path d="M21 21V16H16" />
    </svg>
  );
}

// 17. Directional Vector Arrow
export function IconArrowRight({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14 6 20 12 14 18" />
    </svg>
  );
}

// 18. External Portal Link
export function IconExternalLink({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      <path d="M18 13V19C18 20.1 17.1 21 16 21H5C3.9 21 3 20.1 3 19V8C3 6.9 3.9 6 5 6H11" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// 19. Overlapping Document Copy
export function IconCopy({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M4 15.5H3.5C2.7 15.5 2 14.8 2 14V3.5C2 2.7 2.7 2 3.5 2H14C14.8 2 15.5 2.7 15.5 3.5V4" />
    </svg>
  );
}

// 20. Cryptographic Lock / Escrow Security
export function IconLock({ size = 20, stroke = 1.75, className = '', color = 'currentColor', ...props }) {
  return (
    <svg {...baseSvgProps(size, stroke, className, color)} {...props}>
      <rect x="4.5" y="10" width="15" height="11.5" rx="2" />
      <path d="M7.5 10V6.5C7.5 4 9.5 2 12 2C14.5 2 16.5 4 16.5 6.5V10" />
      <circle cx="12" cy="15.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

