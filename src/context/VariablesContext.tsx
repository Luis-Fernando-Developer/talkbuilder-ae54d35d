import { createContext, useContext, useState } from "react"

type VariableContextType = { 
  variables: Record<string, any>;
  setVariables: React.Dispatch<React.SetStateAction<Record<string, any >>>;
};

const VariablesContext = createContext<VariableContextType | null>(null);

export function VariablesProvider({children}: {children: React.ReactNode}) {
  const [variables, setVariables] = useState<Record<string, any>>({});
  return (
    <VariablesContext.Provider value={{ variables, setVariables }} >
      {children}
    </VariablesContext.Provider>
  );
}

export function useVariables(){
  const context = useContext(VariablesContext);
  if(!context) {
    throw new Error("useVariables must be used within VariablesProvide");
  }
  return context;  
}