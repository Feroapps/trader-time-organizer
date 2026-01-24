import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initCapacitor } from "./utils/capacitorInit";

initCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
