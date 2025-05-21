// enums/GenderType.ts
export const genderValues = ["Männlich", "Weiblich", "Kinder", "Universal"] as const;
export type GenderType = typeof genderValues[number];
