const { AuthenticationError, UserInputError } = require("apollo-server");

const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");

module.exports = {
  Mutation: {
    async createComment(_, { postId, body }, context) {
      const { username } = checkAuth(context);

      if (body === "") {
        throw new UserInputError("Comment cannot be empty", {
          errors: {
            body: "Body cannot be empty"
          }
        });
      }

      try {
        const post = await Post.findById(postId);
        post.comments.unshift({
          body,
          username,
          createdAt: new Date().toISOString()
        });

        await post.save();
        return post;
      } catch (err) {
        throw new Error(err);
      }
    },

    async deleteComment(_, { postId, commentId }, context) {
      const { username } = checkAuth(context);

      try {
        const post = await Post.findById(postId);
        const commentIndex = post.comments.findIndex((c) => c.id === commentId);
        if (post.comments[commentIndex].username === username) {
          post.comments.splice(commentIndex, 1);
          await post.save();
          return post;
        }
        throw new AuthenticationError("Unauthorized Request");
      } catch (err) {
        throw new Error(err);
      }
    }
  }
};
