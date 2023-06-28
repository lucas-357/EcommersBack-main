const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mainRouter = require("./routes/index.js");
const cors = require("cors");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth2");
const { User } = require("./db");
const session = require("express-session");
const { createProxyMiddleware } = require("http-proxy-middleware");
const nodemailerRouter = require("./routes/index.js");

require("./db.js");

const server = express();

server.name = "API";

// Configure Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://ecommersback-production.up.railway.app/auth/google/callback",
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        const [user] = await User.findOrCreate({
          where: { googleId: profile.id },
          defaults: {
            name: profile.name.givenName,
            last_name: profile.name.familyName,
            email: profile.email,
            password: "",
          },
        });
        done(null, user);
      } catch (error) {
        const redirectUrl = "https://ecommers-front-rust.vercel.app/login"; 
        done(false, false, { message: "Authentication failed", redirectUrl });
      }
    }
  )
);
server.use("/nodemailer", nodemailerRouter);
server.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
server.use(bodyParser.json({ limit: "50mb" }));
server.use(cookieParser());
server.use(morgan("dev"));

server.use(
  session({
    secret: "shnawg is not paying the bills",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
server.use(passport.initialize());


server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://ecommers-front-rust.vercel.app'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Expose-Headers','Set-Cookie');
  next();
});

server.use(cors({
  origin: "https://ecommers-front-rust.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "authorization",
  ],
}));

// Configurar opciones de CORS
// const corsOptions = {
//   origin: "https://ecommers-front-rust.vercel.app", // Replace with the exact origin of your application
//   credentials: true,
//   methods: "GET, POST, OPTIONS, PUT, DELETE",
//   allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept",
// };

// server.use(cors(corsOptions));

server.use(mainRouter);

server.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || err;
  console.error(err);
  res.status(status).send(message);
});

module.exports = server;


