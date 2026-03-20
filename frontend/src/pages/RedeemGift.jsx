import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bannerMobile from "../assets/images/banner-m.jpg";
import heroDesktop from "../assets/images/hero.jpg";
import logo from "../assets/images/logo.png";

const OTP_STORAGE_PREFIX = "c2r_otp_";

/** 6-digit demo OTP (shown in alert; same value must be entered on validate page) */
const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const RedeemGift = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mobileFromState = location.state?.mobileNumber;

  const [mobileNumber, setMobileNumber] = useState(() => {
    const digits = (mobileFromState || "").toString().replace(/\D/g, "");
    return digits;
  });
  const [mobileError, setMobileError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const digits = (mobileFromState || "").toString().replace(/\D/g, "");
    setMobileNumber(digits);
    if (mobileError) setMobileError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileFromState]);

  const validateMobile = (value) => {
    if (!value.trim()) {
      return "Mobile number is required.";
    }
    const onlyDigits = value.replace(/\D/g, "");
    if (onlyDigits.length !== 10) {
      return "Enter a valid 10-digit mobile number.";
    }
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mError = validateMobile(mobileNumber);

    setMobileError(mError);

    if (mError) {
      return;
    }

    setIsSubmitting(true);

    const digitsOnly = mobileNumber.replace(/\D/g, "");
    const otp = generateOtp();
    try {
      sessionStorage.setItem(`${OTP_STORAGE_PREFIX}${digitsOnly}`, otp);
    } catch {
      // ignore storage errors
    }

    // Demo: same OTP must be used on the next screen for validation
    alert(`Your OTP is: ${otp}`);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/validate-otp", {
        state: { mobileNumber: digitsOnly },
      });
    }, 300);
  };

  const handleMobileChange = (e) => {
    const value = e.target.value;
    // Optional: allow only digits
    const digitsOnly = value.replace(/\D/g, "");
    setMobileNumber(digitsOnly);
    if (mobileError) {
      setMobileError(validateMobile(digitsOnly));
    }
  };

  return (
    <main className="flex flex-col lg:flex-row w-full font-lato">
      {/* Left Section: Illustration Area */}
      <section className="hero-section flex items-center justify-center relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-end">
          {/* Mobile Hero Image */}
          <img
            src={bannerMobile}
            alt="Redeem Your Gift Illustration"
            className="w-full object-cover block lg:hidden"
          />
          {/* Desktop Hero Image */}
          <img
            src={heroDesktop}
            alt="Redeem Your Gift Illustration"
            className="h-full w-auto object-cover object-right hidden lg:block"
          />
        </div>
      </section>

      {/* Right Section: Form Area */}
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

          {/* Heading */}
          <h1 className="!text-[24px] font-bold text-gray-800 leading-tight text-center mb-[10px]">
            REDEEM YOUR GIFT
          </h1>

          {/* Instructional Text */}
          <p className="text-sm md:text-base text-gray-500 leading-relaxed text-center">
            Kindly enter your Mobile Number to proceed further
          </p>

          {/* Form */}
          <form
            id="redeemForm"
            className="flex flex-col mt-[50px]"
            noValidate
            onSubmit={handleSubmit}
          >
            {/* Mobile Number Field */}
            <div className="flex flex-col mb-[40px]">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
                {/* Mobile Icon */}
                <svg
                  className="w-6 h-6 flex-shrink-0 text-gray-500 transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 18H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800"
                  placeholder="Enter Your Mobile No"
                  required
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  onBlur={() => setMobileError(validateMobile(mobileNumber))}
                />
              </div>
              <span
                className={`error-message text-xs min-h-[18px] transition-opacity duration-300 ${
                  mobileError ? "text-red-600 opacity-100" : "opacity-0"
                }`}
              >
                {mobileError || " "}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="max-w-[150px] w-full py-3 px-8 !bg-[#168CA5] hover:!bg-[#137a8f] text-white rounded-[50px] text-base md:text-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md disabled:!bg-[#8fc4d0] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-[50px]"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>

          {/* Footer */}
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

export default RedeemGift;