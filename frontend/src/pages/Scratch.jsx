import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/images/logo.png";
import hero2Mobile from "../assets/images/hero2-m.jpg";
import mouseIcon from "../assets/images/mouse.png";
import winIcon from "../assets/images/win.png";
import { API_BASE } from "../config/api";

const Scratch = () => {
  const navigate = useNavigate();
  const { mobile } = useParams();
  const mobileFromState = mobile || "";
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState({
    promoCode: "",
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    giftName: "",
  });
  const [loadError, setLoadError] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [shouldGoCongrats, setShouldGoCongrats] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("c2r_session");
    if (!token) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (!shouldGoCongrats || !mobileFromState) return;
    const t = window.setTimeout(() => {
      navigate(`/congratulations/${encodeURIComponent(mobileFromState)}`);
    }, 10000);
    return () => window.clearTimeout(t);
  }, [shouldGoCongrats, mobileFromState, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!canvas || !card) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let isDrawing = false;
    let lastCheckAt = 0;

    const resizeAndPaint = () => {
      if (isRevealed) return;
      const rect = card.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = "/images/scrach-card.png";
    };

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const scratchAt = (x, y) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    };

    const checkReveal = () => {
      if (isRevealed) return;
      const now = Date.now();
      if (now - lastCheckAt < 700) return;
      lastCheckAt = now;

      const w = canvas.width;
      const h = canvas.height;
      const step = 24;
      const imgData = ctx.getImageData(0, 0, w, h).data;

      let transparent = 0;
      let total = 0;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4 + 3;
          total++;
          if (imgData[idx] === 0) transparent++;
        }
      }

      if (transparent / Math.max(1, total) >= 0.6) {
        setIsRevealed(true);
        setIsFading(true);
        setShouldGoCongrats(true);
        // keep the scratched pixels; just fade out the layer
        window.setTimeout(() => {
          const c = canvasRef.current;
          const cctx = c?.getContext("2d");
          if (c && cctx) cctx.clearRect(0, 0, c.width, c.height);
          setIsFading(false);
        }, 650);
      }
    };

    const onDown = (e) => {
      if (isRevealed) return;
      isDrawing = true;
      const { x, y } = getPos(e);
      scratchAt(x, y);
      checkReveal();
    };

    const onMove = (e) => {
      if (!isDrawing || isRevealed) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      scratchAt(x, y);
      checkReveal();
    };

    const onUp = () => {
      isDrawing = false;
    };

    resizeAndPaint();
    window.addEventListener("resize", resizeAndPaint);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove, { passive: false });
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("resize", resizeAndPaint);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [isRevealed]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!mobileFromState) return;
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/users/details?mobile=${encodeURIComponent(
            mobileFromState
          )}`
        );
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.message || "Unable to load customer details.");
        } else {
          setDetails({
            promoCode: data.promoCode || "",
            name: data.name || "",
            email: data.email || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",
            giftName: data.giftName || "",
          });
        }
      } catch {
        setLoadError("Unable to load customer details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [mobileFromState]);

  return (
    <body className="font-lato min-h-screen flex items-center justify-end scratch-body">
      {/* Main White Rounded Container */}
      <div className="w-full max-w-[1100px] bg-white rounded-2xl scratch-main md:mr-[50px]">
        {/* Header: Logo (Desktop) / Hero Image (Mobile) */}
        <div
          className="flex items-center justify-center py-[9px] px-4 relative z-10 logo-header"
          style={{ boxShadow: "0 0px 10px 0px rgba(0, 0, 0, 0.15)" }}
        >
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("c2r_session");
              window.location.href = "/";
            }}
            className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 text-xs md:text-sm text-gray-500 hover:text-blue-600 underline"
          >
            Logout
          </button>
          <img
            src={logo}
            alt="Redeem Your Gift Logo"
            className="max-w-[230px] h-auto hidden md:block"
          />
          <img
            src={hero2Mobile}
            alt="Hero Image"
            className="w-full h-auto block md:hidden"
          />
        </div>

        {/* Main Content Area with Pink Wavy Background */}
        <div className="pink-wavy-bg px-6 py-8 md:px-14 md:py-12 overflow-hidden rounded-b-2xl">
          {/* Two Column Layout: Scratch Card & Customer Details */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left Column: Scratch Card */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* Sparkle Icons Around Scratch Card (4 only) */}
              {/* 1: Left & center to scratch card */}
              <div className="sparkle sparkle-1 absolute top-1/2 -left-6 -translate-y-1/2">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                    fill="#FF8C42"
                    opacity="0.8"
                  />
                  <path
                    d="M12 6L12.5 9L15.5 9.5L12.5 10L12 13L11.5 10L8.5 9.5L11.5 9L12 6Z"
                    fill="#FFA366"
                  />
                </svg>
              </div>
              {/* 2: Bottom & 30px to right */}
              <div
                className="sparkle sparkle-2 absolute"
                style={{ top: "35%", right: "10px" }}
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                    fill="#FF8C42"
                    opacity="0.8"
                  />
                  <path
                    d="M12 6L12.5 9L15.5 9.5L12.5 10L12 13L11.5 10L8.5 9.5L11.5 9L12 6Z"
                    fill="#FFA366"
                  />
                </svg>
              </div>
              {/* 3: Right & 20px to bottom */}
              <div
                className="sparkle sparkle-3 absolute"
                style={{ bottom: "15px", right: "25%" }}
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                    fill="#FF8C42"
                    opacity="0.8"
                  />
                  <path
                    d="M12 6L12.5 9L15.5 9.5L12.5 10L12 13L11.5 10L8.5 9.5L11.5 9L12 6Z"
                    fill="#FFA366"
                  />
                </svg>
              </div>
              {/* 4: Right & top corner */}
              <div
                className="sparkle sparkle-4 absolute"
                style={{ top: "16px", left: "25%" }}
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                    fill="#FF8C42"
                    opacity="0.8"
                  />
                  <path
                    d="M12 6L12.5 9L15.5 9.5L12.5 10L12 13L11.5 10L8.5 9.5L11.5 9L12 6Z"
                    fill="#FFA366"
                  />
                </svg>
              </div>

              <div
                className="w-[360px] h-[400px] relative rounded-[25px] overflow-hidden shadow-lg border border-gray-300"
                id="scratchCard"
                ref={cardRef}
              >
                {/* Scratch Card Inner Design (Revealed after scratching) */}
                <div className="absolute inset-0">
                  {/* Teal Header Section (Top 40%) */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[40%]"
                    style={{ backgroundColor: "#19B8DA" }}
                  />

                  {/* "You Won!" Text (above win icon) */}
                  <div className="absolute top-[13%] left-1/2 transform -translate-x-1/2 z-10 text-center">
                    <h2 className="text-white font-bold" style={{ fontSize: 28 }}>
                      You Won!
                    </h2>
                  </div>

                  {/* White Circle with Win Icon (Overlapping boundary) */}
                  <div
                    className="absolute top-[26%] left-1/2 transform -translate-x-1/2 z-10"
                    style={{
                      padding: 15,
                      border: "2px solid rgba(255, 255, 255, 0.5)",
                      borderRadius: "50%",
                    }}
                  >
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                      <img
                        src={winIcon}
                        alt="Win"
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                  </div>

                  {/* White Bottom Section (Bottom 60%) */}
                  <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-white flex items-center justify-center">
                    <h3 className="text-xl font-bold text-gray-800">
                      {details.giftName || "Your Gift"}
                    </h3>
                  </div>
                </div>

                {/* Scratchable overlay canvas (for future scratch logic) */}
                <canvas
                  id="scratchCanvas"
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full cursor-pointer touch-none z-30 transition-opacity duration-700 ${
                    isRevealed ? "pointer-events-none" : ""
                  } ${isFading ? "opacity-0" : "opacity-100"}`}
                />
                {/* Mouse icon on scratch card - animates left to right like scratch */}
                <img
                  id="scratchMouseIcon"
                  src={mouseIcon}
                  alt="Scratch"
                  className={`scratch-icon-animate absolute left-1/2 object-contain pointer-events-none z-30 opacity-90 ${
                    isRevealed ? "hidden" : ""
                  }`}
                  style={{
                    top: 75,
                    width: "auto",
                    height: "auto",
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                />
              </div>
            </div>

                {/* Right Column: Customer Details */}
            <div className="flex-1 customer-details-parent">
              <h2
                className="text-xl md:text-2xl font-bold mb-6"
                style={{ color: "#168CA5" }}
              >
                Customer Details
              </h2>

              <div className="flex flex-col gap-4">
                {loadError && (
                  <p className="text-xs text-red-600 mb-2">{loadError}</p>
                )}
                {/* Promotional Code Field */}
                <div
                  className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-sm"
                  style={{ border: "1px solid #E1D8D8" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#DEF0F1" }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: "#1DA8C5" }}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M7.5 12c0 .83-.67 1.5-1.5 1.5S4.5 12.83 4.5 12s.67-1.5 1.5-1.5S7.5 11.17 7.5 12zm3-4.5C10.5 6.67 9.83 6 9 6S7.5 6.67 7.5 7.5 8.17 9 9 9s1.5-.67 1.5-1.5zm6 0C16.5 6.67 15.83 6 15 6s-1.5.67-1.5 1.5S14.17 9 15 9s1.5-.67 1.5-1.5zm3 4.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label
                      className="text-sm block"
                      style={{ color: "#768599" }}
                    >
                      Promotional Code
                    </label>
                    <div
                      className="text-base font-medium"
                      style={{ color: "#2F3032" }}
                    >
                      {details.promoCode}
                    </div>
                  </div>
                </div>

                {/* Name Field */}
                <div
                  className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-sm"
                  style={{ border: "1px solid #E1D8D8" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#DEF0F1" }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: "#1DA8C5" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label
                      className="text-sm block"
                      style={{ color: "#768599" }}
                    >
                      Name
                    </label>
                    <div
                      className="text-base font-medium"
                      style={{ color: "#2F3032" }}
                    >
                      {details.name}
                    </div>
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div
                  className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-sm"
                  style={{ border: "1px solid #E1D8D8" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#DEF0F1" }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: "#1DA8C5" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label
                      className="text-sm block"
                      style={{ color: "#768599" }}
                    >
                      Mobile Number
                    </label>
                    <div
                      className="text-base font-medium"
                      style={{ color: "#2F3032" }}
                    >
                      {mobileFromState}
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div
                  className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-sm"
                  style={{ border: "1px solid #E1D8D8" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#DEF0F1" }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: "#1DA8C5" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label
                      className="text-sm block"
                      style={{ color: "#768599" }}
                    >
                      Email Id
                    </label>
                    <div
                      className="text-base font-medium"
                      style={{ color: "#2F3032" }}
                    >
                      {details.email}
                    </div>
                  </div>
                </div>

                {/* Address Field */}
                <div
                  className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-sm"
                  style={{ border: "1px solid #E1D8D8" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#DEF0F1" }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: "#1DA8C5" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label
                      className="text-sm block"
                      style={{ color: "#768599" }}
                    >
                      Address
                    </label>
                    <div
                      className="text-base font-medium"
                      style={{ color: "#2F3032" }}
                    >
                      {details.address}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  );
};

export default Scratch;

