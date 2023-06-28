const server = require("./src/app.js");
const { conn } = require("./src/db.js");
require('dotenv').config();
const { seedDB, seedReviews, seedUsers } = require("./src/utils/index.js");

conn.sync({ alter: true }).then(() => {
  server.listen(process.env.PORT, () => {
    seedUsers()
    seedReviews()
    seedDB()
    console.log("%s listening at ", process.env.PORT); 
  });
});