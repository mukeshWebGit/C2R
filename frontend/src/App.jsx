import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RedeemGift from "./pages/RedeemGift";
import ValidateOtp from "./pages/ValidateOtp";
import PromoCode from "./pages/PromoCode";
import PersonalDetails from "./pages/PersonalDetails";
import Scratch from "./pages/Scratch";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public home / landing */}
        <Route path="/" element={<RedeemGift />} />

        {/* OTP and promo can be accessed from the flow; they set session when appropriate */}
        <Route path="/validate-otp" element={<ValidateOtp />} />
        <Route path="/promo-code" element={<PromoCode />} />

        {/* Protected routes - require login flag in localStorage */}
        <Route
          path="/personal-details"
          element={
            <ProtectedRoute>
              <PersonalDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scratch/:mobile"
          element={
            <ProtectedRoute>
              <Scratch />
            </ProtectedRoute>
          }
        />

        {/* Optional protected alias for redeem page, if you want a logged-in only version */}
        <Route
          path="/redeem"
          element={
            <ProtectedRoute>
              <RedeemGift />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
