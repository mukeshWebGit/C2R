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
      className="font-lato min-h-screen flex items-start md:items-center justify-end md:p-4"
      style={{
        backgroundImage: "url(/images/hero2.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-[600px] bg-white md:rounded-2xl shadow-2xl overflow-hidden md:mr-[50px]">
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

        <div className="px-6 py-10 md:px-10 md:py-14 pink-wavy-bg rounded-b-2xl text-center gerdientBg">
          <h1 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#168CA5" }}>
            Thank You,
          </h1>

          <p className="text-base mb-3 text-orange">
            We have received all the required information.
          </p>
          <p className="text-base text-light mb-8">
            We will process your <span className="text-dark font-semibold">Gift within 7-10 days</span>
            <br />
            and notify you by SMS &amp; email.
          </p>

          <div
            className="bg-white rounded-lg relative z-10 max-w-[280px] mx-auto"
            style={{ border: "1px solid #E1D8D8", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}
          >
            <div className="flex justify-center">
              <div className="py-[30px] px-[20px] flex items-center justify-center relative">
                {loading ? (
                  <div className="w-[180px] h-[180px] bg-gray-100 rounded-md" />
                ) : giftImageUrl || derivedGiftImageUrl ? (
                  <img
                    src={giftImageUrl || derivedGiftImageUrl}
                    alt={giftName || "Gift"}
                    className="max-w-[180px] h-auto block"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <img
                    src="/src/assets/images/watch_big.jpg"
                    alt="UCB Wrist Watch"
                    className="max-w-[180px] h-auto block"
                  />
                )}
              </div>
            </div>

            <div className="text-center">
              <h3
                className="font-medium py-5 px-4 block"
                style={{ color: "#2F3032", fontSize: 16, borderTop: "1px dashed #DFDFDE" }}
              >
                {giftName || (loading ? "Loading..." : "UCB Wrist Watch")}
              </h3>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center mb-4">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Congratulations;

