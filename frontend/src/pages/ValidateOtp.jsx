import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bannerMobile from "../assets/images/banner-m.jpg";
import heroDesktop from "../assets/images/hero.jpg";
import logo from "../assets/images/logo.png";
import { API_BASE } from "../config/api";

const ValidateOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mobileFromState = location.state?.mobileNumber;

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mobileDisplay = mobileFromState || "your mobile number";

  useEffect(() => {
    if (!mobileFromState) {
      navigate("/");
    }
  }, [mobileFromState, navigate]);

  const validateOtp = (value) => {
    if (!value.trim()) return "Activation code is required.";
    if (!/^[A-Za-z0-9]{4,12}$/.test(value.trim()))
      return "Enter a valid activation code.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateOtp(otp);
    setOtpError(error);
    if (error) return;

    if (!mobileFromState) {
      setOtpError("Mobile number is missing. Please go back and enter it.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/check-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile: mobileFromState }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || "Unable to verify mobile.");
      } else if (data.exists) {
        localStorage.setItem("c2r_session", "1");
        navigate(`/scratch/${encodeURIComponent(mobileFromState)}`);
      } else {
        navigate("/promo-code", {
          state: { mobileNumber: mobileFromState },
        });
      }
    } catch (err) {
      setOtpError("Unable to check mobile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setOtp(value);
    if (otpError) setOtpError(validateOtp(value));
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

      {/* Right Section: OTP Form */}
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
            Activation code has been sent to{" "}
            <span className="font-semibold text-gray-700">
              {mobileDisplay}
            </span>
          </p>

          <form
            className="flex flex-col mt-[20px]"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* OTP Field */}
            <div className="flex flex-col mb-[20px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                <svg
                  className="w-6 h-6 flex-shrink-0 text-gray-500 transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 10H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800 tracking-[0.2em] uppercase"
                  placeholder="Enter Activation Code"
                  value={otp}
                  onChange={handleChange}
                  onBlur={() => setOtpError(validateOtp(otp))}
                  maxLength={12}
                  required
                />
              </div>
              <span
                className={`text-xs min-h-[18px] transition-opacity duration-300 ${
                  otpError ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {otpError || " "}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="max-w-[150px] w-full py-3 px-8 !bg-[#168CA5] hover:!bg-[#137a8f] text-white rounded-[50px] text-base md:text-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md disabled:!bg-[#8fc4d0] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-[10px]"
            >
              {isSubmitting ? "Verifying..." : "Submit"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 self-center text-xs text-gray-500 hover:text-blue-600 underline"
          >
            Back to details
          </button>

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

export default ValidateOtp;

