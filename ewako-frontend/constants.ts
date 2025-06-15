import { JastipItemType, JastipUnit } from './types'; // Ensure correct import

export const ADMIN_WHATSAPP_NUMBER = "+966566943064"; // Replace with actual number for production
export const APP_NAME = "EWAKO ROYAL";

export const PRIMARY_COLOR_METALLIC_RED = "#B71C1C";
export const SECONDARY_COLOR_METALLIC_GOLD = "#D4AF37";

export const MOCK_API_KEY = "YOUR_GEMINI_API_KEY"; // Placeholder for Gemini API Key if used

export const MOCK_MUTOWIFS = [
  { id: "m1", name: "Abdullah", phone: "+966501234567" },
  { id: "m2", name: "Muhammad", phone: "+966507654321" },
  { id: "m3", name: "Ahmad", phone: "+966509876543" },
];

export const JASTIP_UNITS_MAP: { [key in JastipItemType]?: JastipUnit[] } = {
  [JastipItemType.FOOD]: [JastipUnit.BOX, JastipUnit.KG, JastipUnit.PCS],
  [JastipItemType.DATES]: [JastipUnit.BOX, JastipUnit.KG, JastipUnit.PCS],
  [JastipItemType.CLOTHES]: [JastipUnit.PCS, JastipUnit.KODI],
  [JastipItemType.PERFUME]: [JastipUnit.BOTTLE, JastipUnit.LUSIN],
  [JastipItemType.OTHER]: [JastipUnit.PCS, JastipUnit.UNIT],
};

// Default support contacts
export const DEFAULT_SUPPORT_PHONE = "+628110000000"; // Example Main Admin Phone
export const DEFAULT_SUPPORT_EMAIL = "support@ewakoroyal.com"; // Example Main Admin Email
