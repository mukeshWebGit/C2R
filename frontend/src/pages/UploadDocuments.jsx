import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/images/logo.png";
import { API_BASE } from "../config/api";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const MAX_SIZE_BYTES = 1024 * 1024; // 1MB

const UploadDocuments = () => {
  const navigate = useNavigate();
  const { mobile } = useParams();

  const [errors, setErrors] = useState({
    id_proof: "",
    invoice_copy: "",
    scratch_card: "",
  });
  const [files, setFiles] = useState({
    id_proof: null,
    invoice_copy: null,
    scratch_card: null,
  });
  const [previews, setPreviews] = useState({
    id_proof: "",
    invoice_copy: "",
    scratch_card: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const fileConfigs = useMemo(
    () => [
      { key: "id_proof", title: "Id Proof" },
      { key: "invoice_copy", title: "Invoice Copy" },
      { key: "scratch_card", title: "Original Scratch Card" },
    ],
    []
  );

  const validateFile = (file) => {
    if (!file) return "Please upload a file.";
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only PDF, JPG, or PNG is allowed.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return "File size should be up to 1MB.";
    }
    return "";
  };

  const handleFileChange = (field, event) => {
    const file = event.target.files?.[0] || null;
    const message = validateFile(file);
    setSubmitted(false);
    setSubmitError("");

    setPreviews((prev) => {
      if (prev[field]) URL.revokeObjectURL(prev[field]);
      return {
        ...prev,
        [field]: !message && file ? URL.createObjectURL(file) : "",
      };
    });

    setFiles((prev) => ({ ...prev, [field]: message ? null : file }));
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async () => {
    const nextErrors = {
      id_proof: validateFile(files.id_proof),
      invoice_copy: validateFile(files.invoice_copy),
      scratch_card: validateFile(files.scratch_card),
    };
    setErrors(nextErrors);
    setSubmitError("");
    setSubmitted(false);

    const hasError = Object.values(nextErrors).some(Boolean);
    if (hasError) return;

    const formData = new FormData();
    formData.append("mobile", mobile || "");
    formData.append("id_proof", files.id_proof);
    formData.append("invoice_copy", files.invoice_copy);
    formData.append("scratch_card", files.scratch_card);

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/upload-documents`, {
        method: "POST",
        body: formData,
      });
      const contentType = res.headers.get("content-type") || "";
      let data = {};
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text || "" };
      }
      if (!res.ok) {
        setSubmitError(
          data.message || `Upload failed with status ${res.status}.`
        );
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || "Unable to upload documents. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="w-full max-w-[1100px] bg-white md:rounded-2xl shadow-2xl overflow-hidden md:mr-[50px]">
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

        <div className="px-6 py-8 md:px-10 md:py-12 pink-wavy-bg rounded-b-2xl gerdientBg">
          <h1 className="text-xl md:text-2xl font-bold text-dark text-center mb-2">
            Upload Required Documents
          </h1>
          <p className="text-base text-light text-center mb-8">
            Please provide the following documents to process your gift
            redemption.
          </p>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-8">
            {fileConfigs.map((item) => {
              const selected = files[item.key];
              const previewUrl = previews[item.key];
              const error = errors[item.key];
              const isPdf = selected?.type === "application/pdf";
              const isImage = Boolean(selected?.type?.startsWith("image/"));

              return (
                <div
                  key={item.key}
                  className="upload-card flex-1 bg-white rounded-xl p-6"
                  style={{
                    border: "1px solid #CFD1D7",
                    boxShadow: "0 4px 25px -5px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <div className="text-base font-semibold text-dark text-left mb-3">
                    {item.title}
                  </div>

                  <label className="upload-box upload-dashed-area flex flex-col items-center justify-center py-6 px-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-green transition-colors block">
                    {!selected ? (
                      <div className="upload-initial flex flex-col items-center">
                        <span className="upload-icon mb-2">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                              stroke="#259D91"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M14 2v6h6"
                              stroke="#259D91"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 18v-6"
                              stroke="#259D91"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9 15h6"
                              stroke="#259D91"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-dark mb-1">
                          Tap to upload here
                        </span>
                        <span className="upload-hint text-xs text-light">
                          PDF, JPG or PNG (Max 1MB)
                        </span>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden py-3 px-2 min-h-[130px]">
                        {isPdf ? (
                          <iframe
                            title={`${item.title} Preview`}
                            src={previewUrl}
                            className="w-full h-[120px] border-0 rounded"
                          />
                        ) : isImage ? (
                          <img
                            src={previewUrl}
                            alt={`${item.title} Preview`}
                            className="max-h-[120px] w-auto object-contain"
                          />
                        ) : (
                          <span className="text-sm text-gray-700 font-medium">
                            File Uploaded
                          </span>
                        )}
                      </div>
                    )}

                    <input
                      type="file"
                      name={item.key}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(item.key, e)}
                    />
                  </label>

                  <div className="upload-file-name mt-2 text-xs text-gray-600 truncate">
                    {selected ? selected.name : ""}
                  </div>
                  <div className="mt-1 min-h-[18px] text-xs text-red-600">
                    {error || ""}
                  </div>
                </div>
              );
            })}
          </div>

          {submitted && (
            <p className="text-sm text-green-700 text-center mb-4">
              Documents submitted successfully.
            </p>
          )}
          {submitError && (
            <p className="text-sm text-red-600 text-center mb-4">
              {submitError}
            </p>
          )}

          <div className="text-center">
            <button
              type="button"
              disabled={isSubmitting}
              className="submit hover:submit-hover"
              onClick={handleSubmit}
            >
              {isSubmitting ? "Submitting..." : "Submit Documents"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UploadDocuments;
