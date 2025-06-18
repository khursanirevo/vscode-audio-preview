import { useContext } from "react";
import { VSCodeContext, VSCodeContextType } from "../contexts/VSCodeContext";

export function useVSCode(): VSCodeContextType {
  const context = useContext(VSCodeContext);
  if (context === undefined) {
    throw new Error("useVSCode must be used within a VSCodeProvider");
  }
  return context;
}
