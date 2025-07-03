
"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light"

type ThemeProviderProps = {
  children: React.ReactNode
}

type ThemeProviderState = {
  theme: Theme
}

const initialState: ThemeProviderState = {
  theme: "light",
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const [theme] = useState<Theme>("light")

  useEffect(() => {
    // Force white background on all elements
    document.documentElement.style.backgroundColor = "white";
    document.body.style.backgroundColor = "white";
    
    // Remove any theme classes
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, [])

  const value = {
    theme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
