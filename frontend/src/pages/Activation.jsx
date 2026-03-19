import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/images/logo.png";
import { API_BASE } from "../config/api";

const Activation = () => {
  const navigate = useNavigate();
  const { mobile } = useParams();

  const [giftName, setGiftName] = useState("UCB Wrist Watch");
  const [giftImage, setGiftImage] = useState("");
  const [error, setError] = useState("");
  const [timeLeftMs, setTimeLeftMs] = useState(
    12 * 60 * 60 * 1000 + 11 * 60 * 1000 + 35 * 1000
  );

  const hours = Math.max(
    0,
    Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  );
  const minutes = Math.max(
    0,
    Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60))
  );
  const seconds = Math.max(0, Math.floor((timeLeftMs % (1000 * 60)) / 1000));

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
    if (!token) navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
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
      setError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/users/details?mobile=${encodeURIComponent(mobile)}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Unable to load gift details.");
        } else {
          setGiftName(data.giftName || "UCB Wrist Watch");
          setGiftImage(data.giftImage || data.image || data.gift_image || "");
        }
      } catch {
        setError("Unable to load gift details.");
      }
    };

    fetchGift();
  }, [mobile]);

  useEffect(() => {
    let targetTime = Date.now() + timeLeftMs;

    const tick = () => {
      const now = Date.now();
      const distance = targetTime - now;
      if (distance <= 0) {
        // reset to original countdown duration
        targetTime = Date.now() + timeLeftMs;
        setTimeLeftMs(timeLeftMs);
      } else {
        setTimeLeftMs(distance);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="font-lato min-h-screen flex items-center justify-end md:p-4"
      style={{
        backgroundImage: "url(/src/assets/images/hero2.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-[600px] bg-white md:rounded-2xl shadow-2xl overflow-hidden">
        <div
          className="flex items-center justify-center py-[9px] px-4 relative z-10 rounded-none md:rounded-t-2xl"
          style={{ boxShadow: "0 0px 10px 0px rgba(0, 0, 0, 0.15)" }}
        >
          <img
            src={logo}
            alt="Redeem Your Gift Logo"
            className="max-w-[140px] md:max-w-[230px] h-auto block"
          />
        </div>

        <div className="px-6 py-8 md:px-10 md:py-12 pink-wavy-bg rounded-b-2xl text-center gerdientBg">
          <p className="text-xl mb-4 text-dark font-semibold">Dear Customer,</p>

          <p className="text-xl font-semibold mb-6 text-orange">
            Your account activation is under process.
          </p>

          <p className="text-base mb-8 text-light">
            You can redeem{" "}
            <span className="text-dark">
              {giftName ? `'${giftName}'` : "'UCB Wrist Watch'"}
            </span>{" "}
            after
          </p>

          <div className="flex items-center justify-center gap-2 md:gap-3 mb-6">
            <div className="flex flex-col items-center">
              <div
                className="bg-white rounded-lg px-4 py-3 md:px-6 md:py-4 mb-2"
                style={{
                  boxShadow: "0 5px 12px -2px rgba(0, 0, 0, 0.25)",
                  minWidth: 70,
                }}
              >
                <span
                  className="text-3xl md:text-4xl font-bold text-orange"
                  id="hours"
                >
                  {String(hours).padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs md:text-sm text-light">HOURS</span>
            </div>

            <span className="text-3xl md:text-4xl font-bold mb-8 text-orange">
              :
            </span>

            <div className="flex flex-col items-center">
              <div
                className="bg-white rounded-lg px-4 py-3 md:px-6 md:py-4 mb-2"
                style={{
                  boxShadow: "0 5px 12px -2px rgba(0, 0, 0, 0.25)",
                  minWidth: 70,
                }}
              >
                <span
                  className="text-3xl md:text-4xl font-bold text-orange"
                  id="minutes"
                >
                  {String(minutes).padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs md:text-sm text-light">MINUTES</span>
            </div>

            <span className="text-3xl md:text-4xl font-bold mb-8 text-orange">
              :
            </span>

            <div className="flex flex-col items-center text-orange">
              <div
                className="bg-white rounded-lg px-4 py-3 md:px-6 md:py-4 mb-2"
                style={{
                  boxShadow: "0 5px 12px -2px rgba(0, 0, 0, 0.25)",
                  minWidth: 70,
                }}
              >
                <span
                  className="text-3xl md:text-4xl font-bold"
                  id="seconds"
                >
                  {String(seconds).padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs md:text-sm text-light">SECONDS</span>
            </div>
          </div>

          <p className="text-base text-center mb-8 text-light">
            and before{" "}
            <span style={{ color: "#168CA5", fontWeight: 600 }}>210 days.</span>
          </p>

          <div
            className="bg-white rounded-lg relative z-10 max-w-[280px] mx-auto"
            style={{
              border: "1px solid #E1D8D8",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="flex justify-center">
              <div className="py-[30px] px-[20px] flex items-center justify-center relative">
                {giftImageUrl ? (
                  <img
                    src={giftImageUrl}
                    alt={giftName || "Gift"}
                    className="max-w-[180px] h-auto block"
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
                style={{
                  color: "#2F3032",
                  fontSize: 16,
                  borderTop: "1px dashed #DFDFDE",
                }}
              >
                {giftName || "UCB Wrist Watch"}
              </h3>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Activation;

