const express = require("express");
const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

router.get(
  "/admin",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin",
    });
  }
);

router.get(
  "/provider",
  protect,
  authorize("provider"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Provider",
    });
  }
);

router.get(
  "/customer",
  protect,
  authorize("customer"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Customer",
    });
  }
);

module.exports = router;