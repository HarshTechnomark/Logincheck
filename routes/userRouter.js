const express = require("express");
const userRoute = express();
const isAuth = require("../middleware/is-auth");

const userController = require("../controllers/userController");

userRoute.post("/register", userController.registerUser);

userRoute.post("/login", userController.loginUser);

userRoute.post("/sendotp", userController.sendOtp);

userRoute.post("/verify", userController.verifyOtp);

userRoute.post("/forget", userController.forgetPassword);

userRoute.post("/change-password", userController.newPassword);

userRoute.get("/home", isAuth, userController.homePage);

userRoute.get("/user/:id", isAuth, userController.getUser);

userRoute.post("/update-user", isAuth, userController.updateUser);

userRoute.post("/delete-user", isAuth, userController.deleteUser);

userRoute.get("/service", isAuth, userController.servicePage);

userRoute.post("/add-service", isAuth, userController.addService);

userRoute.get("/service/:id", isAuth, userController.editService);

userRoute.post("/update-service", isAuth, userController.updateService);

userRoute.post("/delete-service", isAuth, userController.deleteService);


// For User

userRoute.post("/user", isAuth, userController.userPage);

module.exports = userRoute;
