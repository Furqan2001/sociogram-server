const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");
const { SECRET_KEY } = require("../../config");
const { validateRegister, validateLogin } = require("../../util/validation");

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
}

module.exports = {
  Mutation: {
    async login(_, { username, password }) {
      const { valid, errors } = validateLogin(username, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user = await User.findOne({ username });
      if (!user) {
        throw new UserInputError("User Not Found", {
          errors: {
            message: "User Not Found"
          }
        });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        throw new UserInputError("User Not Found", {
          errors: {
            message: "Invalid Credentials"
          }
        });
      }

      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token
      };
    },

    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } }
    ) {
      const { errors, valid } = validateRegister(
        username,
        email,
        password,
        confirmPassword
      );

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const foundUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (foundUser) {
        throw new UserInputError("Email/Username is already taken", {
          errors: {
            message: "This Email/Username is already taken!"
          }
        });
      }

      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString()
      });

      const res = await newUser.save();

      const token = generateToken(res);

      return {
        ...res._doc,
        id: res._id,
        token
      };
    }
  }
};
