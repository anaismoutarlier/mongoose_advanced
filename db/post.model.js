const { Schema, model } = require("mongoose");

const CommentSchema = Schema(
  {
    content: String,
    user: { type: Schema.Types.ObjectId, ref: "users" },
  },
  {
    timestamps: true,
  }
);

const PostSchema = Schema(
  {
    title: String,
    content: String,
    user: { type: Schema.Types.ObjectId, ref: "users" },
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

PostSchema.pre("find", function (next) {
  this.populate("user");
  this.populate("comments.user");
  next();
});

module.exports = model("posts", PostSchema);
