import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RedeemGift from "./pages/RedeemGift";
import ValidateOtp from "./pages/ValidateOtp";
import PromoCode from "./pages/PromoCode";
import PersonalDetails from "./pages/PersonalDetails";
import Scratch from "./pages/Scratch";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedeemGift />} />
        <Route path="/validate-otp" element={<ValidateOtp />} />
        <Route path="/promo-code" element={<PromoCode />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
        <Route path="/scratch" element={<Scratch />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
