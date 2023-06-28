const { Router } = require("express");
const { User } = require("../db");
const {
  getSignUp,
  getLogIn,
  postSignUp,
  postLogIn,
  getLogOut,
  googleAuthToken,
  userVerification,
  getUserByToken,
} = require("../controllers/authController");

const jwt = require("jsonwebtoken");

const passport = require("passport");

const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  //console.log("Request Body:", req.body);
  const { name, last_name, email, password, phone } = req.body;

  try {
    const { newSignUp, token } = await postSignUp(
      name,
      last_name,
      email,
      password,
      phone
    );

    res.cookie("login", token, {
      httpOnly: true,
      maxAge: 1000 * 3 * 24 * 60 * 60,
    });
    res.status(201).json(`User ${newSignUp.email} created succesfully`);
  } catch (error) {
    res.status(400).json(`Failed to create user: ${error.message}`);
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { newLogIn, token } = await postLogIn(email, password);

    // res.cookie("login", token, {
    //   httpOnly: true,
    //   maxAge: 1000 * 3 * 24 * 60 * 60,
    //   sameSite: "None",
    //   secure: true,
    //   domain: ".vercel.app"
    // });
    console.log("esto es token: ",token)
    res.status(201).json(token);
  } catch (error) {
    res.status(400).json(`Failed to log in the user: ${error.message}`);
  }
});

authRouter.get("/logout", async (req, res) => {
  try {
    if (req.user && req.user.googleId) {
      res.cookie("login", req.cookies.login, {
        httpOnly: true,
        maxAge: 1,
      });
      return res.status(200).json("Google user logged out successfully");
    }

    res.cookie("login", "", { httpOnly: true, maxAge: 1 });
    res.status(200).json("User logged out successfully");
  } catch (error) {
    res.status(400).json(`Error while logging out the user: ${error.message}`);
  }
});

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://ecommers-front-rust.vercel.app/login",
    session: false,
  }),
  async (req, res) => {
    try {
      const token = await googleAuthToken(req.user);
      res.cookie("login", token, {
        httpOnly: true,
        maxAge: 1000 * 3 * 24 * 60 * 60,
      });
      const redirectUrl = "https://ecommers-front-rust.vercel.app/home";
      res.redirect(redirectUrl);
    } catch (error) {
      return res.status(500).json({ error: "Authentication failed" });
    }
  }
);

authRouter.post("/verification", async (req, res) => {
  try {
    const verification = await userVerification(
      req.body.email,
      req.body.verification_code
    );

    res.status(200).json(`User ${req.body.email} verificated succesfully`);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

authRouter.post("/user", async (req, res) => {
  const {token} = req.body;
  console.log("esto es token: ",token);
  try {
    if (token) {
      jwt.verify(
        token,
        "shnawg is not paying the bills",
        async (error, decodedToken) => {
          if (error) {
            throw new Error(error.message);
          } else {
            const user = await getUserByToken(decodedToken);
            res.status(200).json({ user });
          }
        }
      );
    } else {
      res.status(400).json("There's no user logged");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

authRouter.put("/user", async (req, res) => {
  const { token, email, oldPassword, newPassword } = req.body;

  if (token && email && oldPassword && newPassword) {
    try {
      const decodedToken = jwt.verify(token, "shnawg is not paying the bills");

      const user = await getUserByToken(decodedToken);

      if (user.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ error: "Invalid email" });
      }

      await User.changePassword(email, oldPassword, newPassword);

      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(400).json({
      error: "Token, email, oldPassword, and newPassword are required",
    });
  }
});

module.exports = authRouter;
