import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobileNumber: { type: String, trim: true, default: "" },
    password: { type: String, required: true, minlength: 6 },
    timezone: { type: String, default: "Asia/Kolkata" }, // IANA tz, auto-detected client-side
    country: { type: String, default: "IN" },
    integrations: { type: Object, default: {} },
    refreshTokens: [{ type: String }],
    notificationPrefs: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      voice: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    mobileNumber: this.mobileNumber,
    timezone: this.timezone,
    country: this.country,
    notificationPrefs: this.notificationPrefs,
  };
};

export default mongoose.model("User", userSchema);
