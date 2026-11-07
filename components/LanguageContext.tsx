"use client";

import { createContext, useContext } from "react";

interface LanguageState {
  hindi: boolean;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageState>({
  hindi: false,
  toggleLanguage: () => undefined
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export default LanguageContext;
