import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bannerMobile from "../assets/images/banner-m.jpg";
import heroDesktop from "../assets/images/hero.jpg";
import logo from "../assets/images/logo.png";
import { API_BASE } from "../config/api";

const PersonalDetails = () => {
  const location = useLocation();
  const mobileFromState = location.state?.mobileNumber || "";
  const promoCodeFromState = location.state?.promoCode || "";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!mobileFromState || !promoCodeFromState) {
      navigate("/");
    }
  }, [mobileFromState, promoCodeFromState, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Enter a valid email address.";
    if (!address.trim()) newErrors.address = "Address is required.";
    if (!stateValue.trim()) newErrors.state = "State/UT is required.";
    if (!city.trim()) newErrors.city = "City is required.";
    if (!pincode.trim()) newErrors.pincode = "Pin code is required.";
    else if (!/^\d{6}$/.test(pincode.trim()))
      newErrors.pincode = "Enter a valid 6-digit pin code.";

    if (!mobileFromState) newErrors.mobile = "Mobile number is missing.";
    if (!promoCodeFromState) newErrors.promo = "Promotional code is missing.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: mobileFromState,
          name,
          email,
          address,
          city,
          state: stateValue,
          pincode,
          promoCode: promoCodeFromState,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || "Unable to save details. Try again.");
      } else {
        localStorage.setItem("c2r_session", "1");
        navigate(`/scratch/${encodeURIComponent(mobileFromState)}`);
      }
    } catch (err) {
      setServerError("Server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPincode(value);
  };

  return (
    <main className="flex flex-col lg:flex-row w-full font-lato">
      {/* Left Section: Illustration Area */}
      <section className="hero-section flex items-center justify-center relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-end">
          <img
            src={bannerMobile}
            alt="Redeem Your Gift Illustration"
            className="w-full object-cover block lg:hidden"
          />
          <img
            src={heroDesktop}
            alt="Redeem Your Gift Illustration"
            className="h-full w-auto object-cover object-right hidden lg:block"
          />
        </div>
      </section>

      {/* Right Section: Personal Details Form */}
      <section className="form-section bg-white flex items-center justify-center p-8 md:p-10 lg:p-12 overflow-y-auto relative">
        <div className="w-full flex flex-col mb-[60px]">
          {/* Logo */}
          <div className="hidden lg:flex items-center justify-center mb-[50px]">
            <img
              src={logo}
              alt="Redeem Your Gift Logo"
              className="max-w-[230px] h-auto block"
            />
          </div>

          <h1 className="!text-[24px] font-bold text-gray-800 leading-tight text-center mb-[10px]">
            REDEEM YOUR GIFT
          </h1>

          <p className="text-sm md:text-base text-gray-500 leading-relaxed text-center mb-6">
            Kindly fill-in Personal Details to redeem the offer
          </p>

          {(errors.mobile || errors.promo) && (
            <p className="text-xs text-red-600 text-center mb-2">
              {errors.mobile || errors.promo}
            </p>
          )}

          <form
            className="flex flex-col mt-[20px]"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Name */}
            <div className="flex flex-col mb-[20px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                <input
                  type="text"
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={validate}
                />
              </div>
              <span
                className={`text-xs min-h-[18px] transition-opacity duration-300 ${
                  errors.name ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {errors.name || " "}
              </span>
            </div>

            {/* Email */}
            <div className="flex flex-col mb-[20px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                <input
                  type="email"
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800"
                  placeholder="Email Id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={validate}
                />
              </div>
              <span
                className={`text-xs min-h-[18px] transition-opacity duration-300 ${
                  errors.email ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {errors.email || " "}
              </span>
            </div>

            {/* Address */}
            <div className="flex flex-col mb-[20px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                <input
                  type="text"
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800"
                  placeholder="Your Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={validate}
                />
              </div>
              <span
                className={`text-xs min-h-[18px] transition-opacity duration-300 ${
                  errors.address ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {errors.address || " "}
              </span>
            </div>

            {/* State/UT */}
            <div className="flex flex-col mb-[20px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                <select
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800"
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                  onBlur={validate}
                >
                  <option value="">Select State/UT</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                  {/* Add more states as needed */}
                </select>
              </div>
              <span
                className={`text-xs min-h-[18px] transition-opacity duration-300 ${
                  errors.state ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {errors.state || " "}
              </span>
            </div>

            {/* City */}
            <div className="flex flex-col mb-[20px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                <input
                  type="text"
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={validate}
                />
              </div>
              <span
                className={`text-xs min-h-[18px] transition-opacity duration-300 ${
                  errors.city ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {errors.city || " "}
              </span>
            </div>

            {/* Pin Code */}
            <div className="flex flex-col mb-[20px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                <input
                  type="tel"
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800"
                  placeholder="Pin Code"
                  value={pincode}
                  onChange={handlePincodeChange}
                  onBlur={validate}
                  maxLength={6}
                />
              </div>
              <span
                className={`text-xs min-h-[18px] transition-opacity duration-300 ${
                  errors.pincode ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {errors.pincode || " "}
              </span>
            </div>

            {serverError && (
              <p className="text-xs text-red-600 mb-2">{serverError}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="max-w-[150px] w-full py-3 px-8 !bg-[#168CA5] hover:!bg-[#137a8f] text-white rounded-[50px] text-base md:text-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md disabled:!bg-[#8fc4d0] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-[10px]"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>

          <footer className="flex items-center justify-center gap-2 absolute bottom-[10px] left-0 right-0">
            <a
              href="#"
              className="text-xs md:text-sm text-gray-400 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-xs md:text-sm text-gray-400">|</span>
            <a
              href="#"
              className="text-xs md:text-sm text-gray-400 hover:text-blue-600 transition-colors"
            >
              Terms of Use
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default PersonalDetails;

