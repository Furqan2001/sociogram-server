const { AuthenticationError, UserInputError } = require("apollo-server");

const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },

    async getPost(_, { postId }) {
      try {
        const post = Post.findById(postId);
        return post;
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Mutation: {
    async createPost(_, { body }, context) {
      const user = checkAuth(context);

      if (body === "") {
        throw new Error("Post cannot be empty");
      }

      const newPost = new Post({
        username: user.username,
        user: user.id,
        body,
        createdAt: new Date().toISOString()
      });

      const post = await newPost.save();

      return post;
    },

    async deletePost(_, { postId }, context) {
      const user = checkAuth(context);

      try {
        const post = await Post.findById(postId);
        if (user.username === post.username) {
          await post.remove();
          return "Post Deleted successfully";
        }
        throw new AuthenticationError("Action not allowed");
      } catch (err) {
        throw new Error(err);
      }
    },

    async likePost(_, { postId }, context) {
      const { username } = checkAuth(context);

      try {
        const post = await Post.findById(postId);
        if (post.likes.find((like) => like.username === username)) {
          post.likes = post.likes.filter((like) => like.username !== username);
        } else {
          post.likes.push({
            username
          });
        }
        await post.save();
        return post;
      } catch (err) {
        throw new UserInputError("Post Not Found");
      }
    }
  }
};
