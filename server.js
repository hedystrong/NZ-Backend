const express = require("express");
const dotenv = require("dotenv");
var path = require("path");
var rfs = require("rotating-file-stream");
const connectDB = require("./config/db");
const colors = require("colors");
const errorHandler = require("./middleware/error");
var morgan = require("morgan");
const logger = require("./middleware/logger");
const cors = require("cors");
// Router оруулж ирэх
const usersRoutes = require("./routes/users");

dotenv.config({ path: "./config/config.env" });

const app = express();

connectDB();

var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", 
  path: path.join(__dirname, "log"),
});

var whitelist = ["http://localhost:3000"];

var corsOptions = {
  // Ямар ямар домэйнээс манай рест апиг дуудаж болохыг заана
  origin: function (origin, callback) {
    if (origin === undefined || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Horigloj baina.."));
    }
  },
  allowedHeaders: "Authorization, Set-Cookie, Content-Type",
  methods: "GET, POST, PUT, DELETE",
  credentials: true,
}

// Body parser
app.use(express.json());
app.use(logger);
app.use(cors(corsOptions))
app.use(morgan("combined", { stream: accessLogStream }));
app.use("/api/users", usersRoutes);
app.use(errorHandler);

const server = app.listen(
  process.env.PORT,
  console.log(`Express сэрвэр ${process.env.PORT} порт дээр аслаа... `)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Алдаа гарлаа : ${err.message}`.underline.red.bold);
  server.close(() => {
    process.exit(1);
  });
});
