const User = require("../model/User");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

// бүртгүүлэх
exports.register = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  const token = user.getJsonWebToken();

  res.status(200).json({
    success: true,
    token,
    user: user,
  });
});

// нэвтрэх 
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new MyError("Имэйл болон нууц үгээ дамжуулна уу", 400);
  }

  // Тухайн хэрэглэгч хайна
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new MyError("Имэйл болон нууц үг буруу байна!!!", 401);
  }

  const ok = await user.checkPassword(password);

  if (!ok) {
    throw new MyError("Имэйл болон нууц үг буруу байна!!!", 401);
  }

  console.log("token" + user.getJsonWebToken());
  res.status(200).json({
    success: true,
    token: user.getJsonWebToken(),
    user: user,
  });
});

// Олон хэрэглэгчийн мэдээлэл авах
exports.getUsers = asyncHandler(async (req, res, next) => {
  const select = req.query.select;

  const users = await User.find(req.query, select)

  res.status(200).json({
    success: true,
    data: users
  });
});

// Тухайн хэрэглэгчийн мэдээлэл авах
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй!", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Хэрэглэгч модел үүсгэх
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Тухайн хэрэглэгчийн мэдээлэл өөрчлөх
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Тухайн хэрэглэгчийн мэдээлэл устгах
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  user.remove();

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Тухайн хэрэглэгчийн нууц үг солих имэйл илгээх
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.email) {
    throw new MyError("Та нууц үг сэргээх имэйл хаягаа дамжуулна уу", 400);
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    throw new MyError(req.body.email + " имэйлтэй хэрэглэгч олдсонгүй!", 400);
  }

  const resetToken = user.generatePasswordChangeToken();
  await user.save();

  // await user.save({ validateBeforeSave: false });

  // Имэйл илгээнэ
  const link = `https://car.mn/changepassword/${resetToken}`;

  const message = `Сайн байна уу?<br><br>Та нууц үг солих хүсэлт илгээлээ.<br> Та нууц үгээ доорхи линк дээр дарж солино уу:<br><br><a target="_blanks" href="${link}">${link}</a><br><br>Өдрийг сайхан өнгөрүүлээрэй!!!`;


  const info = await sendEmail({
    email: user.email,
    subject: "Нууц үг өөрчлөх хүсэлт",
    message,
  });


  res.status(200).json({
    success: true,
    resetToken,
  });
});

// Тухайн хэрэглэгчийн нууц үг солих
exports.resetPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.resetToken || !req.body.password) {
    throw new MyError("Та токен болон нууц үгээ дамжуулна уу", 400);
  }

  const encrypted = crypto
    .createHash("sha256")
    .update(req.body.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: encrypted,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new MyError("Токены хүчинтэй хугацаа дууссан байна!", 400);
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = user.getJsonWebToken();

  res.status(200).json({
    success: true,
    token,
    user: user,
  });
});
