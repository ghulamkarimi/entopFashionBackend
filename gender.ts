// enums/GenderType.ts
export const genderValues = ["Männlich", "Weiblich", "Kinder", "Unisex", "Erwachsene"] as const;
export type GenderType = typeof genderValues[number];
