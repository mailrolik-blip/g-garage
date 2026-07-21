import type { SourceType } from "@prisma/client";

export function validateGtin(value: string | null | undefined): boolean {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (![8, 12, 13, 14].includes(digits.length)) return false;
  const check = Number(digits.at(-1));
  const body = digits.slice(0, -1).split("").reverse().map(Number);
  const sum = body.reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function sourceReliability(type: SourceType): number {
  return { MANUFACTURER: 100, OFFICIAL_DISTRIBUTOR: 92, PARTS_CATALOG: 84, LARGE_RETAILER: 76, MARKETPLACE: 45, OTHER: 55 }[type];
}

export function mapCategory(text: string | null | undefined): string {
  const value = String(text ?? "").toLowerCase();
  if (/фильтр|filter/.test(value)) return "фильтры";
  if (/тормоз|brake/.test(value)) return "тормозная система";
  if (/амортизатор|рессор|подвес/.test(value)) return "подвеска";
  if (/зеркал|стекл|кабин|кузов|mirror|glass|body/.test(value)) return "кузов";
  if (/бачок|охлажд|cool|tank/.test(value)) return "охлаждение";
  if (/рулев|steer/.test(value)) return "рулевое управление";
  if (/маховик|flywheel|кпп|вал|transmission/.test(value)) return "трансмиссия";
  if (/датчик|блок|module|электр/.test(value)) return "электрика";
  return "прочее";
}

export function detectConflict(values: Array<string | null | undefined>): string | null {
  const normalized = [...new Set(values.filter(Boolean).map((value) => String(value).trim().toUpperCase()))];
  return normalized.length > 1 ? `Conflicting values: ${normalized.join(", ")}` : null;
}

export function calculateConfidence(input: { sourceTypes: SourceType[]; exactArticle: boolean; brandConsistent: boolean; marketplaceOnly: boolean; conflict: boolean }): number {
  if (input.conflict || !input.exactArticle) return Math.min(74, input.sourceTypes.length * 20);
  if (input.marketplaceOnly) return 70;
  const strong = input.sourceTypes.filter((type) => ["MANUFACTURER", "OFFICIAL_DISTRIBUTOR", "PARTS_CATALOG", "LARGE_RETAILER"].includes(type)).length;
  if (strong >= 2 && input.brandConsistent) return 92;
  if (strong >= 1 && input.brandConsistent) return 82;
  return 60;
}