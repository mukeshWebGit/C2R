import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bannerMobile from "../assets/images/banner-m.jpg";
import heroDesktop from "../assets/images/hero.jpg";
import logo from "../assets/images/logo.png";
import { API_BASE } from "../config/api";

const PromoCode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mobileFromState = location.state?.mobileNumber || "";
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!mobileFromState) {
      navigate("/");
    }
  }, [mobileFromState, navigate]);

  const validateCode = (value) => {
    if (!value.trim()) return "Promotional code is required.";
    if (!/^[A-Za-z0-9]{4,20}$/.test(value.trim()))
      return "Enter a valid promotional code.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    const error = validateCode(code);
    setCodeError(error);
    if (error) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(data.message || "Invalid or already used code.");
        setIsSubmitting(false);
        return;
      }

      navigate("/personal-details", {
        state: {
          mobileNumber: mobileFromState,
          promoCode: code.trim().toUpperCase(),
          giftName: data.gift || "",
        },
      });
    } catch (err) {
      setServerError("Unable to verify code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setCode(value);
    if (codeError) setCodeError(validateCode(value));
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

      {/* Right Section: Promo Code Form */}
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
            Kindly fill-in your Promotional Code to redeem the offer
          </p>

          <form
            className="flex flex-col mt-[20px]"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Promo Code Field */}
            <div className="flex flex-col mb-[20px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                <svg
                  className="w-6 h-6 flex-shrink-0 text-gray-500 transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 9H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800 uppercase tracking-[0.2em]"
                  placeholder="Promotional Code"
                  value={code}
                  onChange={handleChange}
                  onBlur={() => setCodeError(validateCode(code))}
                  maxLength={20}
                  required
                />
              </div>
              <span
                className={`text-xs min-h-[18px] transition-opacity duration-300 ${
                  codeError ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {codeError || " "}
              </span>
            </div>

            {serverError && (
              <p className="text-xs text-red-600 mb-2">{serverError}</p>
            )}
            {successMessage && (
              <p className="text-xs text-green-600 mb-2">{successMessage}</p>
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

export default PromoCode;

