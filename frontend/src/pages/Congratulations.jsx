import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/images/logo.png";
import { API_BASE } from "../config/api";

const Congratulations = () => {
  const navigate = useNavigate();
  const { mobile } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [giftName, setGiftName] = useState("");
  const [giftImage, setGiftImage] = useState("");

  const derivedGiftImageUrl = useMemo(() => {
    const name = (giftName || "").trim();
    if (!name) return "";
    // "Bluetooth Speaker Mini" -> "Bluetooth-Speaker-Mini.webp"
    const filename = `${name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-_.]/g, "")}.webp`;
    return `${API_BASE}/images/${filename}`;
  }, [giftName]);

  const giftImageUrl = useMemo(() => {
    if (!giftImage) return "";
    if (giftImage.startsWith("http://") || giftImage.startsWith("https://")) {
      return giftImage;
    }
    if (giftImage.startsWith("/")) return `${API_BASE}${giftImage}`;
    return `${API_BASE}/${giftImage}`;
  }, [giftImage]);

  useEffect(() => {
    const token = localStorage.getItem("c2r_session");
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    // Override Vite default body centering for this page only
    const body = document.body;
    const prev = {
      display: body.style.display,
      placeItems: body.style.placeItems,
      minWidth: body.style.minWidth,
      backgroundColor: body.style.backgroundColor,
    };

    body.style.display = "block";
    body.style.placeItems = "unset";
    body.style.minWidth = "0";
    body.style.backgroundColor = "transparent";

    return () => {
      body.style.display = prev.display;
      body.style.placeItems = prev.placeItems;
      body.style.minWidth = prev.minWidth;
      body.style.backgroundColor = prev.backgroundColor;
    };
  }, []);

  useEffect(() => {
    const fetchGift = async () => {
      if (!mobile) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/users/details?mobile=${encodeURIComponent(mobile)}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Unable to load gift details.");
        } else {
          setGiftName(data.giftName || "");
          setGiftImage(data.giftImage || data.image || data.gift_image || "");
        }
      } catch {
        setError("Unable to load gift details.");
      } finally {
        setLoading(false);
      }
    };

    fetchGift();
  }, [mobile]);

  return (
    <main
      className="font-lato min-h-screen w-full flex md:items-center justify-end md:p-4"
      style={{
        backgroundImage: "url(/images/hero2.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Main White Rounded Container */}
      <div className="w-full max-w-[600px] bg-white md:rounded-2xl shadow-2xl overflow-hidden md:mr-[50px]">
        {/* Header: Logo */}
        <div
          className="flex items-center justify-center py-[9px] px-4 relative z-10"
          style={{ boxShadow: "0 0px 10px 0px rgba(0, 0, 0, 0.15)" }}
        >
          <img
            src={logo}
            alt="Redeem Your Gift Logo"
            className="max-w-[140px] md:max-w-[230px] h-auto block"
          />
        </div>

        {/* Main Content Area with Wavy Background */}
        <div className="px-6 py-8 md:px-10 md:py-12 pink-wavy-bg rounded-b-2xl">
          {/* Congratulations Section */}
          <div className="text-center mb-8 relative">
            {/* Decorative Confetti Elements */}
            <div
              className="absolute top-0 left-1/4 w-3 h-3 rounded-full"
              style={{
                backgroundColor: "#FF8C42",
                opacity: 0.6,
                transform: "rotate(45deg)",
              }}
            />
            <div
              className="absolute top-2 right-1/4 w-2 h-2 rounded-full"
              style={{
                backgroundColor: "#168CA5",
                opacity: 0.6,
                transform: "rotate(45deg)",
              }}
            />
            <div
              className="absolute -top-1 left-1/2 w-2 h-2 rounded-full"
              style={{
                backgroundColor: "#FFA366",
                opacity: 0.6,
                transform: "rotate(45deg)",
              }}
            />
            <div
              className="absolute top-4 left-1/3 w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: "#1DA8C5",
                opacity: 0.5,
                transform: "rotate(45deg)",
              }}
            />
            <div
              className="absolute top-1 right-1/3 w-3 h-3 rounded-full"
              style={{
                backgroundColor: "#FF8C42",
                opacity: 0.5,
                transform: "rotate(45deg)",
              }}
            />

            <h1 className="!text-[2.5em] sm:text-4xl md:text-5xl font-bold mb-2 relative z-10 text-center text-orange">
              Congratulations!
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 relative z-10">
              You have won a gift
            </p>
          </div>

          {/* Prize Card Container with Sparkles */}
          <div className="relative mb-8 max-w-[280px] mx-auto">
            {/* Sparkles */}
            <div className="celebration-sparkle sparkle-1 absolute -top-4 -left-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                  fill="#FFD700"
                  opacity="0.8"
                />
              </svg>
            </div>
            <div className="celebration-sparkle sparkle-2 absolute -top-6 right-8">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                  fill="#FF8C42"
                  opacity="0.8"
                />
              </svg>
            </div>
            <div className="celebration-sparkle sparkle-3 absolute top-1/2 -left-6 -translate-y-1/2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                  fill="#FFD700"
                  opacity="0.7"
                />
              </svg>
            </div>
            <div className="celebration-sparkle sparkle-4 absolute top-1/2 -right-6 -translate-y-1/2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                  fill="#FFA366"
                  opacity="0.8"
                />
              </svg>
            </div>
            <div className="celebration-sparkle sparkle-5 absolute -bottom-4 left-8">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                  fill="#1DA8C5"
                  opacity="0.7"
                />
              </svg>
            </div>
            <div className="celebration-sparkle sparkle-6 absolute -bottom-5 -right-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                  fill="#168CA5"
                  opacity="0.8"
                />
              </svg>
            </div>

            {/* Prize Card */}
            <div
              className="bg-white rounded-lg relative z-10"
              style={{
                border: "1px solid #E1D8D8",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div className="flex justify-center">
                <div className="py-[30px] px-[20px] flex items-center justify-center relative">
                  {loading ? (
                    <div className="w-[180px] h-[180px] bg-gray-100 rounded-md" />
                  ) : giftImageUrl || derivedGiftImageUrl ? (
                    <img
                      src={giftImageUrl || derivedGiftImageUrl}
                      alt={giftName || "Gift"}
                      className="w-auto h-[180px] block"
                      onError={(e) => {
                        // If derived filename doesn't exist on backend, hide broken icon
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-[180px] h-[180px] bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                      No image
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <h3
                  className="font-medium py-5 px-4 block"
                  style={{
                    color: "#2F3032",
                    fontSize: 16,
                    borderTop: "1px dashed #DFDFDE",
                  }}
                >
                  {giftName || (loading ? "Loading..." : "Your Gift")}
                </h3>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center mb-4">{error}</p>
          )}

          {/* Redeem Button */}
          <div className="text-center">
            <button
              type="button"
              className="px-8 py-3 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: "#168CA5", minWidth: 200 }}
              onClick={() => {
                navigate(`/upload-documents/${encodeURIComponent(mobile || "")}`);
              }}
            >
              Redeem
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Congratulations;

