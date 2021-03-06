const Joi = require("@hapi/joi");
const bcrypt = require("bcrypt");

const db = require("../db/connection");

const users = db.get("users");
const schema = Joi.object({
  username: Joi.string()
    .regex(/(^[A-Za-z0-9\-\_]*$)/)
    .min(3)
    .max(30),
  password: Joi.string()
    .trim()
    .min(10)
    .regex(/(^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]))/),
  role: Joi.string().valid("user", "admin"),

  active: Joi.bool(),
});

const list = async (req, res, next) => {
  try {
    const result = await users.find({}, "-password");
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateOne = async (req, res, next) => {
  const { id: _id } = req.params;
  //validate id param
  try {
    //validate request body
    const result = schema.validate(req.body);
    if (!result.error) {
      //if valid, find the user with given id
      const query = { _id };
      const user = await users.findOne(query);
      if (user) {
        //update user in DB
        const updatedUser = req.body;
        if (updatedUser.password) {
          updatedUser.password = await bcrypt.hash(updatedUser.password, 12);
        }
        const result = await users.findOneAndUpdate(query, {
          $set: updatedUser,
        });
        //respond w/ user
        delete result.password;
        res.json(result);
      } else {
        next(); //404
      }
    } else {
      res.status(422);
      throw new Error(result.error);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
    list,
    updateOne,
};