const User = require("../models/userModel");
const Service = require("../models/serviceModel");
const bcrypt = require("bcrypt");
var nm = require("nodemailer");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

let savedOTPS = {};

const transporter = nm.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const securePassword = async (password) => {
  const salt = 10;
  try {
    const passwordHash = await bcrypt.hash(password, salt);
    return passwordHash;
  } catch (error) {
    console.log(error);
  }
};

const sendResetMail = async (name, email, id) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "For Reset Password",
      html:
        "<p>Hii " +
        name +
        ', Please click here to <a href="http://localhost:3000/change-password/?id=' +
        id +
        '"> reset </a> your password. <p/>',
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const serviceMail = async (name, email, service) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "New Service Added to Your Account",
      html: `<p>Dear ${name},</p>
      <p>We hope this email finds you well. We are writing to let you know that a ${service} has been added to your account. We thought you would like to know about this addition, which we believe will enhance your experience with our platform.</p>
      <p>If you have any questions about the new service or how it works, please do not hesitate to contact us. Our customer support team is available to assist you.</p>
      <p>Thank you for being a valued member of our community.</p>
      <br>
      <p>Best regards</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const secPassword = await securePassword(password);
    const user = new User({
      name: name,
      email: email,
      password: secPassword,
    });

    const userData = await user.save();

    if (userData) {
      res.status(200).json({
        message: "Registration Successful.",
      });
    } else {
      res.status(409).json({ message: "Registration Failed" });
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const userData = await User.findOne({ email: email });
  const passwordMatch = await bcrypt.compare(password, userData.password);
  if (passwordMatch) {
    jwt.sign(
      { email, id: userData._id },
      process.env.SECRET,
      {},
      async (err, token) => {
        if (err) throw err;
        const user = await User.findOneAndUpdate(
          { email: email },
          { $set: { token: token } }
        );
        res.status(200).json({
          userData,
        });
      }
    );
  } else {
    res.status(400).json({ message: "Wrong Credentials" });
  }
};

exports.sendOtp = async (req, res) => {
  let email = req.body.email;
  let digits = "0123456789";
  let limit = 4;
  let otp = "";
  for (i = 0; i < limit; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  var options = {
    from: process.env.EMAIL_USERNAME,
    to: `${email}`,
    subject: "Testing node emails",
    html: `<p>Enter the otp: ${otp} to verify your email address</p>`,
  };
  transporter.sendMail(options, function (error, info) {
    if (error) {
      console.log(error);
      res.status(500).send("couldn't send");
    } else {
      savedOTPS[email] = otp;
      setTimeout(() => {
        delete savedOTPS.email;
      }, 50000);
      res.send("sent otp");
    }
  });
};

exports.verifyOtp = async (req, res) => {
  let otprecived = req.body.otp;
  let email = req.body.email;
  if (savedOTPS[email] == otprecived) {
    res.send("Verfied");
  } else {
    res.status(500).json({ message: "Invalid OTP" });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    console.log(userData);
    if (userData) {
      sendResetMail(userData.name, userData.email, userData._id);
      res.status(200).json({
        message: "Please Check your mail to reset your password",
      });
    } else {
      res.status(401).json({ message: "User email is incorrect." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.newPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const id = req.body.id;
    const secure_password = await securePassword(password);
    const updatedData = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { password: secure_password } }
    );
    res.status(200).json({ message: "Password changes successfully." });
  } catch (error) {
    console.log(error.message);
  }
};

exports.homePage = async (req, res) => {
  const data = await User.find({ is_admin: false });
  res.status(200).json({ message: "All Users", data: data });
};

exports.getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await User.findById({ _id: id });
    if (data) {
      res.status(200).json({ data });
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = new ObjectId(req.body.id);
    const data = await User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
        },
      }
    );
    if (data) {
      res.status(200).json({ data });
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = new ObjectId(req.body.id);
    const data = await User.findByIdAndRemove({ _id: id });
    if (data) {
      res.status(200).json({ message: "User Deleted Successfully." });
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.servicePage = async (req, res) => {
  const data = await Service.find();
  res.status(200).json({ message: "All Services", data: data });
};

exports.addService = async (req, res) => {
  const { email, service, price } = req.body;
  try {
    const serviceData = new Service({
      email: email,
      service: service,
      price: price,
    });

    const serviceDone = await serviceData.save();

    if (serviceDone) {
      serviceMail(serviceDone.name, serviceDone.email, serviceDone.service);
      res.status(200).json({
        message: "Service added Successful.",
      });
    } else {
      res.status(409).json({ message: "Service request failed" });
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
};

exports.editService = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Service.findById({ _id: id });
    if (data) {
      res.status(200).json({ data });
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.updateService = async (req, res) => {
  try {
    const id = new ObjectId(req.body.id);
    const data = await Service.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: req.body.name,
          service: req.body.service,
          price: req.body.price,
        },
      }
    );
    if (data) {
      res.status(200).json({ message: "Service Updated Successfully." });
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.deleteService = async (req, res) => {
  try {
    const id = new ObjectId(req.body.id);
    const data = await Service.findByIdAndRemove({ _id: id });
    if (data) {
      res.status(200).json({ message: "Service Deleted Successfully." });
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.userPage = async (req, res) => {
  try {
    const email = await req.body.email;
    const data = await User.findOne({
      email: email,
    });
    if (data) {
      res.status(200).json({ message: "Data found.", data });
    } else {
      res.status(200).json({ message: "Data found.", data });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};
