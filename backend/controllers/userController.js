import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==========================
// 1. REGISTER FUNCTION (Frontend EmailJS Flow)
// ==========================
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, profileImage } = req.body;

    // Validation
    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ msg: "All fields must be filled out." });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User is already registered." });
    }

    // Password Validation Rule
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        msg: "Password must be at least 6 characters long and include at least one digit (0-9) and one special character (!@#$%^&*).",
      });
    }

    // Password Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save User directly as verified (Since OTP is already verified on Frontend)
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      profileImage: profileImage || "",
      isVerified: true, // Auto-verify after successful frontend OTP
    });

    await user.save();

    // Generate JWT Token
    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      msg: "Registration successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        role: user.role,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Registration Error:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        msg: "Server Error: " + err.message,
      });
    }
  }
};

// ==========================
// 2. VERIFY OTP FUNCTION (Optional / Backup)
// ==========================
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        msg: "Email and OTP are required!",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found.",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      msg: "Email verified successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        role: user.role,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("OTP Verification Error:", err.message);

    return res.status(500).json({
      msg: "Server Error: OTP verification failed",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, profileImage } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.json({
      msg: "Profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -otp -otpExpires"
    );

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// ==========================
// 3. LOGIN FUNCTION
// ==========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and Password are required!",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        msg: "This email is not registered.",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        msg: "Your email is not verified. Please verify your OTP first!",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Incorrect Password!",
      });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        role: user.role,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);

    if (!res.headersSent) {
      return res.status(500).json({
        msg: "Server Error: Login failed",
      });
    }
  }
};