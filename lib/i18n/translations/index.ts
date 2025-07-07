import { en } from "./en";
import { ro } from "./ro";

export const translations = {
  en,
  ro,
};

export type TranslationKey = keyof typeof en;
