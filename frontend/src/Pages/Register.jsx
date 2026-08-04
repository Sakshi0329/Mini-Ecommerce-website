import React, { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "name") {
      value = value.replace(/[^A-Za-z ]/g, "");
    }

    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        profileImage: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Address must be at least 10 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/.test(formData.password)
    ) {
      newErrors.password =
        "Password must contain at least one letter, one number and one special character";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // EmailJS integration with exact keys matching EmailJS Dashboard template
  const sendOtpEmail = async () => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);

    // Keys matched to {{email}}, {{passcode}}, and {{time}} in EmailJS template
    const templateParams = {
      email: formData.email,
      passcode: randomOtp,
      time: "15 minutes",
    };

    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );
  };

  // Submit Handler for Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please correct the highlighted fields.",
        width: "350px",
        confirmButtonColor: "#f39c12",
      });
      return;
    }
    setLoading(true);

    try {
      await sendOtpEmail();

      Swal.fire({
        icon: "success",
        title: "OTP Sent",
        text: "OTP has been sent to your email successfully!",
        width: "350px",
        confirmButtonColor: "#198754",
      });
      setIsOtpSent(true);
    } catch (err) {
      console.error("EmailJS error:", err);
      Swal.fire({
        icon: "error",
        title: "Email Failed",
        text: "Failed to send OTP email. Please check your credentials.",
        width: "350px",
        confirmButtonColor: "#dc3545",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await sendOtpEmail();
      Swal.fire({
        icon: "success",
        title: "OTP Resent",
        text: "A new OTP has been sent to your email address.",
        width: "350px",
        confirmButtonColor: "#198754",
      });
    } catch (err) {
      console.error("Resend OTP Error:", err);
      Swal.fire({
        icon: "error",
        title: "Resend Failed",
        text: "Could not resend OTP. Please try again.",
        width: "350px",
        confirmButtonColor: "#dc3545",
      });
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Handler
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid OTP",
        text: "Please enter a valid 6-digit OTP.",
        width: "350px",
        confirmButtonColor: "#f39c12",
      });
      return;
    }

    if (otp !== generatedOtp) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: "Incorrect OTP. Please try again.",
        width: "350px",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser(formData);
      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: res.data?.msg || "Account created successfully!",
        width: "350px",
        confirmButtonColor: "#198754",
      }).then(() => {
        navigate("/login");
      });
    } catch (err) {
      console.error("Registration error", err.response?.data);
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: err.response?.data?.msg || "Something went wrong.",
        width: "350px",
        confirmButtonColor: "#dc3545",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      {!isOtpSent ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Create Account</h2>
          <div className="mb-2">
            <div className="text-center mb-3">
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  margin: "0 auto 15px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #ddd",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  background: "#f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Profile Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "45px", color: "#666" }}>👤</span>
                )}
              </div>

              <label
                htmlFor="profileImage"
                className="btn btn-outline-primary btn-sm"
                style={{ cursor: "pointer", width: "180px" }}
              >
                📷 Choose Profile Photo
              </label>

              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </div>
            <input
              type="text"
              name="name"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              placeholder="Enter Full Name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name}</div>
            )}
          </div>

          <div className="mb-2">
            <input
              type="email"
              name="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          <div className="mb-2">
            <input
              type="tel"
              name="phone"
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              placeholder="10 Digit Mobile Number"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && (
              <div className="invalid-feedback">{errors.phone}</div>
            )}
          </div>

          <div className="mb-2">
            <textarea
              rows="3"
              name="address"
              className={`form-control ${errors.address ? "is-invalid" : ""}`}
              placeholder="Enter Full Address"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
            {errors.address && (
              <div className="invalid-feedback">{errors.address}</div>
            )}
          </div>

          <div className="mb-2">
            <input
              type="password"
              name="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Create Password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
            <small className="text-muted">
              Password must contain at least one letter, one number and one
              special character.
            </small>
          </div>

          <button type="submit" className="green-btn" disabled={loading}>
            {loading ? "Sending OTP..." : "Register Now"}
          </button>

          <div className="text-center mt-2">
            <small className="text-muted">
              Already have an account?{" "}
              <span
                className="text-bold fw-semibold"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </small>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="auth-form">
          <h2>Verify Your Email</h2>
          <p style={{ marginBottom: "20px", color: "#555" }}>
            We've sent a 6-digit OTP to <strong>{formData.email}</strong>
          </p>

          <input
            type="text"
            name="otp"
            placeholder="Enter 6-Digit OTP"
            maxLength="6"
            pattern="[0-9]{6}"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            style={{
              textAlign: "center",
              fontSize: "20px",
              letterSpacing: "4px",
            }}
          />

          <button type="submit" className="green-btn" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Register"}
          </button>

          <div className="text-center mt-3">
            <small className="text-muted">Didn't receive the OTP? </small>
            <button
              type="button"
              className="btn btn-link p-0 fw-semibold"
              onClick={handleResendOtp}
              disabled={loading}
              style={{ fontSize: "14px", textDecoration: "none" }}
            >
              Resend OTP
            </button>
          </div>

          <div className="text-center mt-2">
            <button
              type="button"
              className="text-btn"
              onClick={() => setIsOtpSent(false)}
              style={{
                background: "none",
                border: "none",
                color: "#007bff",
                cursor: "pointer",
              }}
            >
              ← Back to Edit Details
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Register;