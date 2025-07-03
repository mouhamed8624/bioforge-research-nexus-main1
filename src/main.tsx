
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force white background on all elements at the earliest possible moment
document.documentElement.style.backgroundColor = "white";
document.body.style.backgroundColor = "white";
document.documentElement.classList.remove("dark");
document.documentElement.classList.add("light");

createRoot(document.getElementById("root")!).render(<App />);
