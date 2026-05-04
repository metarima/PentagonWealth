const express = require("express");
const os = require("os");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");
const localMediaDir = path.join(
  os.homedir(),
  ".cursor",
  "projects",
  "c-Users-flash-Desktop-Projects-Pengaton-Wealth-PentagonWealth",
  "assets"
);

app.use(express.json());
app.use(express.static(publicDir));
app.use("/media", express.static(localMediaDir));

app.post("/api/contact", (req, res) => {
  const { fullName, email, serviceInterest, message, companyWebsite } = req.body || {};

  if (companyWebsite) {
    return res.status(400).json({ ok: false, message: "Spam detected." });
  }

  if (!fullName || !email || !serviceInterest || !message) {
    return res.status(400).json({ ok: false, message: "Please complete all required fields." });
  }

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailLooksValid) {
    return res.status(400).json({ ok: false, message: "Please provide a valid email address." });
  }

  if (message.length < 12) {
    return res.status(400).json({ ok: false, message: "Please include a little more detail in your message." });
  }

  console.log("[Contact Enquiry]", {
    fullName,
    email,
    serviceInterest,
    message,
    submittedAt: new Date().toISOString(),
  });

  return res.json({
    ok: true,
    message: "Thanks, your enquiry has been received. We will be in touch shortly.",
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Pentagon Wealth app running at http://localhost:${PORT}`);
});
