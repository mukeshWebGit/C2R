import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bannerMobile from "../assets/images/banner-m.jpg";
import heroDesktop from "../assets/images/hero.jpg";
import logo from "../assets/images/logo.png";
import { API_BASE } from "../config/api";

const OTP_STORAGE_PREFIX = "c2r_otp_";

const ValidateOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mobileFromState = location.state?.mobileNumber;

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileCheckLoading, setMobileCheckLoading] = useState(false);
  const [mobileExists, setMobileExists] = useState(null);
  const [mobileCheckError, setMobileCheckError] = useState("");

  const mobileCheckPromiseRef = useRef(null);

  const mobileDisplay = mobileFromState || "your mobile number";

  useEffect(() => {
    if (!mobileFromState) {
      navigate("/");
    }
  }, [mobileFromState, navigate]);

  // Preload mobile existence check once.
  // This makes Submit fast (no extra network request on button click).
  useEffect(() => {
    if (!mobileFromState) return;

    setMobileCheckLoading(true);
    setMobileCheckError("");
    setMobileExists(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    mobileCheckPromiseRef.current = (async () => {
      const res = await fetch(`${API_BASE}/api/users/check-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile: mobileFromState }),
        signal: controller.signal,
      });

      let data = {};
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text };
      }

      if (!res.ok) {
        throw new Error(data.message || "Unable to verify mobile.");
      }
      return Boolean(data.exists);
    })();

    mobileCheckPromiseRef.current
      .then((exists) => {
        setMobileExists(exists);
      })
      .catch((err) => {
        setMobileCheckError(err?.message || "Unable to verify mobile.");
      })
      .finally(() => {
        setMobileCheckLoading(false);
      });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [mobileFromState]);

  const validateOtp = (value) => {
    const v = value.trim();
    if (!v) return "OTP is required.";
    if (!/^[0-9]{6}$/.test(v))
      return "Enter the 6-digit OTP from the alert.";
    return "";
  };

  const handleResend = () => {
    if (!mobileFromState) {
      setOtpError("Mobile number is missing. Please go back and enter it.");
      navigate("/");
      return;
    }

    const expectedOtp = sessionStorage.getItem(
      `${OTP_STORAGE_PREFIX}${mobileFromState}`
    );

    if (!expectedOtp) {
      setOtpError(
        "OTP session expired. Go back to the home page and request a new OTP."
      );
      return;
    }

    setOtpError("");
    setOtp("");
    alert(`Your OTP is: ${expectedOtp}`);
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

    const expectedOtp = sessionStorage.getItem(
      `${OTP_STORAGE_PREFIX}${mobileFromState}`
    );
    if (!expectedOtp) {
      setOtpError(
        "OTP session expired. Go back to the home page and request a new OTP."
      );
      return;
    }
    if (otp.trim() !== expectedOtp) {
      setOtpError("Invalid OTP. Use the same 6-digit code from the alert.");
      return;
    }

    setIsSubmitting(true);
    try {
      let exists = mobileExists;

      // If preload isn't finished yet, wait briefly for it.
      if (exists === null && mobileCheckPromiseRef.current) {
        exists = await Promise.race([
          mobileCheckPromiseRef.current,
          new Promise((_, reject) =>
            window.setTimeout(() => reject(new Error("Mobile check timeout")), 4000)
          ),
        ]);
      }

      if (exists === null) {
        setOtpError(
          mobileCheckError || "Checking mobile. Please try again in a moment."
        );
        return;
      }

      try {
        sessionStorage.removeItem(
          `${OTP_STORAGE_PREFIX}${mobileFromState}`
        );
      } catch {
        /* ignore */
      }

      localStorage.setItem("c2r_session", "1");
      if (exists) {
        navigate(`/scratch/${encodeURIComponent(mobileFromState)}`);
      } else {
        navigate("/promo-code", {
          state: { mobileNumber: mobileFromState },
        });
      }
    } catch (err) {
      setOtpError(err?.message || "Unable to check mobile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
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
            Activation codes has been sent to{" "}
            <span className="font-bold" style={{ color: "#D96401" }}>
              {mobileDisplay}
            </span>
            <a
              href="#"
              role="button"
              aria-label="Edit mobile number"
              style={{ color: "#D96401" }}
              className="inline-flex items-center justify-center ml-2 hover:opacity-90"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { mobileNumber: mobileFromState } });
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 20h9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 18l-4 1 1-4L16.5 3.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </a>
            <br />
            Please dial our Helpline Nos. for any assistance.
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
                  className="flex-1 border-none outline-none text-[16px] text-gray-800 bg-transparent placeholder:text-gray-400 focus:text-gray-800 tracking-[0.2em]"
                  placeholder="Enter 6-digit OTP"
                  inputMode="numeric"
                  value={otp}
                  onChange={handleChange}
                  onBlur={() => setOtpError(validateOtp(otp))}
                  maxLength={6}
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

              <div className="flex justify-end">
                <a
                  href="#"
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isSubmitting) return;
                    handleResend();
                  }}
                  style={{ color: "#D96401" }}
                  className={`text-xs md:text-sm underline hover:opacity-90 ${
                    isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  Resend Code
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="max-w-[150px] w-full py-3 px-8 !bg-[#168CA5] hover:!bg-[#137a8f] text-white rounded-[50px] text-base md:text-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md disabled:!bg-[#8fc4d0] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-[10px]"
            >
              {isSubmitting ? "Verifying..." : "Submit"}
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

export default ValidateOtp;

