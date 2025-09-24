import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/domains/game-go/pages/HomePage";
import GamePage from "@/domains/game-go/pages/GamePage";

export default function AppRoutes() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
         </Routes>
      </BrowserRouter>
   );
}
