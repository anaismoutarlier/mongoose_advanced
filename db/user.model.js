const mongoose = require("mongoose");
const moment = require("moment");

const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      message: ({ value }) => `Username ${value} is not valid.`,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      select: false,
      index: true,
      validate: {
        validator: val => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/?.test(val),
        message: ({ value }) => `${value} is not a valid email address.`,
      },
    },
    dateCreated: Date,
    type: {
      type: String,
      enum: ["admin", "user", "moderator"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "pending",
    },
    birthdate: Date,

    password: {
      type: String,
      select: false,
      // this = document
      required: () => this.status !== "pending",
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

UserSchema.virtual("age").get(function () {
  //this = document
  return moment().diff(this.birthdate, "years");
});

UserSchema.virtual("posts", {
  ref: "posts",
  localField: "_id",
  foreignField: "user",
});

UserSchema.pre("find", function (next) {
  // this = requête

  next();
});

UserSchema.pre("deleteOne", function (next) {
  console.log("pre delete filter ", this.getFilter());
  if (!this.getFilter()._id)
    throw new Error("MongoDB ObjectId must be used for deletion.");
  else next();
});

UserSchema.post("deleteOne", async function () {
  console.log("User deleted.\nPost delete filter, ", this.getFilter());
  const user = this.getFilter()._id;
  const res1 = await mongoose.model("posts").deleteMany({ user });
  const res2 = await mongoose.model("posts").updateMany(
    { "comments.user": user },
    {
      $pull: { comments: { user } },
    }
  );
  console.log(res1, res2);
});

UserSchema.loadClass(
  class {
    static getCredentials(filter) {
      // this = model
      return this.findOne(filter).select("+email +password");
    }

    static findActive(filter) {
      return this.find({ ...filter, status: "active" });
    }

    static findByGender() {
      const query = [
        {
          $group: {
            _id: "$gender",
            users: {
              $push: {
                _id: "$_id",
                username: "$username",
              },
            },
          },
        },
        {
          $project: {
            gender: "$_id",
            users: 1,
            _id: 0,
          },
        },
      ];
      return this.aggregate(query);
    }
  }
);

module.exports = mongoose.model("users", UserSchema);
