const { validationResult } = require("express-validator");
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");
const {
  encryptData,
  decryptData,
  decryptePass,
} = require("./hashingController");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const secretKey =
  "6e97deb2f832bbaa0ceadcbd8f94abb053da76fe4f695392bf0012c646921ca3";

const getUserById = async (req, res, next) => {
  const uid = req.params.uid;
  let user;
  try {
    user = await userModel.findById(uid);
    const { decPass, decAadhar, decPan } = decryptData(
      user.password,
      user.aadhar,
      user.panNo,
      secretKey
    );
    user.password = decPass;
    user.aadhar = decAadhar;
    user.panNo = decPan;
  } catch (error) {}
  return res
    .status(200)
    .send({ message: "User Found!", success: true, user: user });
};

const newUser = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(new Error("Invalid Data"));
  }
  const {
    email,
    password,
    joiningDate,
    position,
    name,
    aadhar,
    panNo,
    isSuperUser,
    address,
    dateOfBirth,
    githubId,
    linkedIn,
    phone,
  } = req.body;

  let existingUser;
  try {
    existingUser = await userModel.findOne({ email: email });
  } catch (error) {
    res.status(500).send({ message: `${error.message}`, success: false });
  }
  if (existingUser) {
    return res
      .status(500)
      .json({ message: "User already exists with this email", success: false });
  }

  const { encPass, encAadhar, encPan } = encryptData(
    password,
    aadhar,
    panNo,
    secretKey
  );

  try {
    const newUser = new userModel({
      email,
      password: encPass,
      joiningDate,
      position,
      name,
      aadhar: encAadhar,
      panNo: encPan,
      isSuperUser,
      address,
      dateOfBirth,
      githubId,
      linkedInId: linkedIn,
      phone,
    });

    newUser.image = "uploads\\images\\user-default.jpg";

    await newUser.save();
    res.status(201).send({ message: "Register Success", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `${error.message}`, success: false });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Decrypt stored password
    const { decPass } = decryptePass(user.password, secretKey);
    
    // Compare passwords
    if (password !== decPass) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, isSuperUser: user.isSuperUser },
      secretKey,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSuperUser: user.isSuperUser,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const displayUser = async (req, res, next) => {
  let users;
  try {
    console.log("Attempting to fetch users from database...");
    users = await userModel.find({});
    console.log("Raw users data:", users);
    
    if (!users || users.length === 0) {
      console.log("No users found in database");
      return res.status(200).json({ user: [], success: true, message: "No users found" });
    }
    
    // Log each user's basic info
    users.forEach(user => {
      console.log(`User found: ${user.name} (${user.email}), SuperUser: ${user.isSuperUser}`);
    });
    
    return res.status(200).json({ user: users, success: true });
  } catch (error) {
    console.error("Error in displayUser:", error);
    return res.status(500).json({ 
      message: "Error fetching users", 
      success: false,
      error: error.message 
    });
  }
};

const editEmployee = async (req, res, next) => {
  try {
  const { email, name, position, phone, address, aadhar, panNo } = req.body;
  const uid = req.params.uid;

    console.log('Edit Employee Request:', {
      uid,
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file uploaded'
    });

    // Validate required fields
    if (!email || !name || !position || !phone || !address || !aadhar || !panNo) {
      return res.status(400).json({
        message: "All fields are required",
        success: false
      });
    }

  let user;
  try {
    user = await userModel.findById(uid);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          success: false
        });
      }
  } catch (error) {
      console.error("Error finding user:", error);
      return res.status(500).json({
        message: "Error finding user",
        success: false
      });
  }

    // Update user fields
  user.name = name;
  user.email = email;
  user.position = position;
  user.phone = phone;
  user.address = address;
  user.aadhar = aadhar;
  user.panNo = panNo;

    // Handle image upload
    if (req.file) {
      try {
        // Delete old image if it exists and is not the default image
        if (user.image && user.image !== "uploads/images/user-default.jpg") {
          const oldImagePath = path.join(__dirname, "..", user.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error("Error deleting old image:", err);
            });
          }
        }

        // Store the relative path in the database
        const relativePath = path.relative(path.join(__dirname, ".."), req.file.path).replace(/\\/g, "/");
        user.image = relativePath;
        console.log('Updated image path:', relativePath);
      } catch (error) {
        console.error("Error handling image upload:", error);
        return res.status(500).json({
          message: "Error uploading image",
          success: false
        });
      }
    }

  try {
    await user.save();
      console.log('User updated successfully:', {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image
      });
      
      return res.status(200).json({
        message: "User details updated successfully!",
        success: true,
        user: {
          ...user.toObject(),
          image: `/${user.image}` // Add leading slash for proper URL
        }
      });
    } catch (error) {
      console.error("Error saving user:", error);
      return res.status(500).json({
        message: "Could not update user details",
        success: false
      });
    }
  } catch (error) {
    console.error("Error in editEmployee:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

const updateUserImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Check if user is authenticated and matches the requested user
    if (req.userData.userId !== req.params.uid) {
      // Delete the uploaded file if unauthorized
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.log(err);
        });
      }
      return res.status(403).json({ message: "Not authorized to update this user's image" });
    }

    const user = await userModel.findById(req.params.uid);
    if (!user) {
      // Delete the uploaded file if user not found
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.log(err);
        });
      }
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old image if exists and it's not the default image
    if (user.image && user.image !== "uploads/images/user-default.jpg") {
      const oldImagePath = path.join(__dirname, "..", user.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) console.log(err);
        });
      }
    }

    // Update user with new image path
    const relativePath = path.relative(path.join(__dirname, ".."), req.file.path).replace(/\\/g, "/");
    user.image = relativePath;
    
    try {
      await user.save();
    } catch (saveError) {
      console.error("Error saving user:", saveError);
      // Delete the uploaded file if save fails
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.log(err);
        });
      }
      return res.status(500).json({ message: "Error saving user data" });
    }

    // Return success response with user data
    res.status(200).json({ 
      message: "Image uploaded successfully",
      user: {
        ...user.toObject(),
        image: `/${relativePath}` // Add leading slash for proper URL
      }
    });
  } catch (error) {
    console.error("Image upload error:", error);
    // Delete the uploaded file if there's an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log(err);
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const signup = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      employeeId, 
      dateOfBirth, 
      gender, 
      address, 
      education, 
      position, 
      department, 
      joiningDate, 
      salary, 
      emergencyContact, 
      aadhar, 
      panNo,
      githubId,
      linkedInId
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !employeeId || !dateOfBirth || 
        !gender || !position || !department || !joiningDate || !salary || 
        !aadhar || !panNo || !address || !githubId || !linkedInId) {
      return res.status(400).json({ 
        success: false,
        message: 'Please fill all required fields' 
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ $or: [{ email }, { employeeId }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or employee ID already exists' 
      });
    }

    // Encrypt sensitive data
    const { encPass, encAadhar, encPan } = encryptData(password, aadhar, panNo, secretKey);

    // Create new user
    const newUser = new userModel({
      name,
      email,
      password: encPass,
      phone,
      employeeId,
      dateOfBirth,
      gender,
      address,
      education,
      position,
      department,
      joiningDate,
      salary,
      emergencyContact,
      aadhar: encAadhar,
      panNo: encPan,
      githubId,
      linkedInId,
      image: "uploads/images/user-default.jpg",
      isSuperUser: false
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, isSuperUser: newUser.isSuperUser },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isSuperUser: newUser.isSuperUser
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error registering user',
      error: error.message 
    });
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, position, address } = req.body;
    const userId = req.params.uid;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.position = position || user.position;
    user.address = address || user.address;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        position: user.position,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createTestUser = async (req, res) => {
  try {
    const testUser = {
      email: "test@test.com",
      password: "test123",
      name: "Test User",
      position: "Developer",
      isSuperUser: false
    };

    // Check if user already exists
    const existingUser = await userModel.findOne({ email: testUser.email });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "Test user already exists",
        user: existingUser
      });
    }

    // Encrypt password
    const { encPass } = encryptData(testUser.password, "", "", secretKey);

    // Create new user
    const newUser = new userModel({
      ...testUser,
      password: encPass,
      image: "uploads/images/user-default.jpg"
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Test user created successfully",
      user: newUser
    });
  } catch (error) {
    console.error("Create test user error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating test user"
    });
  }
};

const getAdmins = async (req, res) => {
  try {
    const admins = await userModel.find({ isSuperUser: true })
      .select('name email phone image joiningDate')
      .sort({ joiningDate: -1 });

    res.status(200).json({
      success: true,
      admins
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin profiles"
    });
  }
};

module.exports = {
  newUser,
  loginUser,
  displayUser,
  editEmployee,
  getUserById,
  updateUserImage,
  signup,
  updateUser,
  createTestUser,
  getAdmins
};
