// ==============================================================================
// src/types/trades.ts — Shared Trade Types and Preset Configurations
// ==============================================================================

export type PrimaryTrade = 'plumbing' | 'hvac' | 'electrical' | 'roofing' | 'general';

export interface TradePresetConfig {
  title: string;
  badge: string;
  description: string;
  defaultTerms: string;
  invoicePresets: Array<{ description: string; price: number; taxable: boolean }>;
}

export const TRADE_PRESETS_CONFIG: Record<PrimaryTrade, TradePresetConfig> = {
  plumbing: {
    title: 'Plumbing & Drainage',
    badge: 'Plumbing Pro',
    description: 'Specialized for residential & commercial pipework, fixtures, water heaters, and drain cleaning.',
    defaultTerms: 'Payment due within 14 days of invoice date. Emergency callouts subject to after-hours surcharge.',
    invoicePresets: [
      { description: 'Standard Plumbing Diagnostic & Service Callout', price: 95.0, taxable: true },
      { description: 'Emergency Pipe Leak Repair & Section Replacement', price: 275.0, taxable: true },
      { description: 'Motorized Main Line Drain Cleanout & Hydro-Jetting', price: 185.0, taxable: false },
      { description: 'Water Heater Heating Element & Thermostat Swap', price: 320.0, taxable: true },
      { description: 'Bathroom Faucet Replacement & Supply Line Hookup', price: 210.0, taxable: true },
      { description: 'Toilet Rebuild (Fluidmaster Valve, Flapper, Bolts)', price: 165.0, taxable: true },
    ],
  },
  hvac: {
    title: 'HVAC & Climate Control',
    badge: 'HVAC Certified',
    description: 'Designed for heating, ventilation, AC installs, duct sanitization, and seasonal maintenance.',
    defaultTerms: 'Payment due upon completion of HVAC commissioning. Equipment warranties require certified signoff.',
    invoicePresets: [
      { description: 'Comprehensive AC System Diagnostic & Precision Tune-Up', price: 129.0, taxable: true },
      { description: 'R-410A Eco Refrigerant Leak Seal & 2lb Re-charge', price: 245.0, taxable: true },
      { description: 'Smart Thermostat (Ecobee / Nest) Multi-Stage Setup', price: 189.0, taxable: true },
      { description: 'Dual-Run Capacitor & Contactor Replacement', price: 215.0, taxable: true },
      { description: 'Whole-Home Air Handler Blower Motor Replacement', price: 485.0, taxable: true },
      { description: 'Condenser Coil Acid Wash & Drainage Clearout', price: 175.0, taxable: false },
    ],
  },
  electrical: {
    title: 'Electrical & EV Systems',
    badge: 'Master Electrician',
    description: 'Built for panel upgrades, EV charging stations, rewiring, GFCI compliance, and commercial lighting.',
    defaultTerms: 'Payment due upon inspection sign-off. All electrical installations strictly adhere to NEC standards.',
    invoicePresets: [
      { description: 'Electrical Diagnostic & Circuit Load Capacity Analysis', price: 110.0, taxable: true },
      { description: 'Level 2 48A Dedicated EV Fast Charger Installation', price: 650.0, taxable: true },
      { description: '200-Amp Main Service Breaker Panel Modernization', price: 1850.0, taxable: true },
      { description: 'GFCI / AFCI Dual-Function Breaker Retrofit & Testing', price: 220.0, taxable: true },
      { description: 'Whole-House Surge Protection Device Installation', price: 340.0, taxable: true },
      { description: 'Recessed LED Ultra-Slim Downlight Retrofit (Pack of 6)', price: 390.0, taxable: true },
    ],
  },
  roofing: {
    title: 'Roofing & Exterior Systems',
    badge: 'Roofing Specialist',
    description: 'Tailored for leak mitigation, shingle replacement, valley flashing, and storm damage assessments.',
    defaultTerms: '50% deposit required upon material delivery, remainder due upon final completion inspection.',
    invoicePresets: [
      { description: 'Roof Integrity & Storm Leak Diagnostic Inspection', price: 150.0, taxable: false },
      { description: 'Architectural Shingle Emergency Patch & Valley Flashing', price: 420.0, taxable: true },
      { description: 'Seamless Gutter Guard Cleanout & Downspout Snaking', price: 260.0, taxable: true },
      { description: 'Chimney Step & Counter-Flashing Waterproof Reseal', price: 380.0, taxable: true },
      { description: 'Pipe Boot Rubber Flashing Replacement (2 Units)', price: 290.0, taxable: true },
      { description: 'Attic Ridge Vent Solar Fan Ventilation Upgrade', price: 540.0, taxable: true },
    ],
  },
  general: {
    title: 'General Contracting & Trade Services',
    badge: 'General Contractor',
    description: 'Multi-discipline field operations covering drywall, painting, light carpentry, and emergency repairs.',
    defaultTerms: 'Payment due within 14 days of invoice date. Progress invoicing applies to multi-day contracts.',
    invoicePresets: [
      { description: 'General Trade Service Diagnostic & First-Hour Labor', price: 105.0, taxable: true },
      { description: 'Drywall Hole Repair, Texture Matching & Priming', price: 225.0, taxable: true },
      { description: 'Interior Pre-Hung Door Hanging & Hardware Mortising', price: 195.0, taxable: true },
      { description: 'Tile Backsplash Installation & Waterproof Grouting', price: 420.0, taxable: true },
      { description: 'Subfloor Reinforcement & Squeak Elimination Service', price: 310.0, taxable: true },
      { description: 'Exterior Caulk Waterproofing & Trim Weatherization', price: 180.0, taxable: true },
    ],
  },
};
