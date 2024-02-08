const { Router } = require("express");
const { User } = require("../db");
const { ObjectId } = require("mongodb");
const router = Router();

router.get("/byGender", async (_, res) => {
  const data = await User.findByGender();
  res.json({ result: true, data });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.getCredentials({ email });
  console.log(user);
  if (user.password === password) return res.json({ result: true });
  res.json({ result: false });
});

router.get("/", async (_, res) => {
  const users = await User.find().lean();
  console.log({ ...users[0] });
  console.log(users[0].age);
  res.json({ result: true, users });
});

router.get("/:userId", async (req, res) => {
  const { userId: _id } = req.params;
  const user = await User.findOne({ _id }).populate("posts");
  res.json({ result: true, user });
});

router.delete("/:userId", async (req, res) => {
  const { userId: _id } = req.params;
  console.log(_id);
  const data = await User.deleteOne({ _id: new ObjectId(_id) });
  res.json(data);
});

module.exports = router;
