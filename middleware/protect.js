const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandle");
const MyError = require("../utils/myError");
const User = require("../model/User");

exports.protect = asyncHandler(async (req, res, next) => {
  if (!req.headers.authorization) {
    throw new MyError(
      "Энэ үйлдлийг хийхэд таны эрх хүрэхгүй байна. Та эхлээд логин хийнэ үү. Authorization header-ээр токеноо дамжуулна уу.",
      401
    );
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    throw new MyError("Токен байхгүй байна.", 400);
  }

  const tokenObj = jwt.verify(token, process.env.JWT_SECRET);
  console.log("------" + req.userId, tokenObj.id);

  req.userId = tokenObj.id;
  req.userRole = tokenObj.role;

  next();
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log("----role" + req.userRole, roles);
    if (!roles.includes(req.userRole)) {
      throw new MyError(
        "Таны эрх [" + req.userRole + "] энэ үйлдлийг гүйцэтгэхэд хүрэлцэхгүй!",
        403
      );
    }

    next();
  };
};
