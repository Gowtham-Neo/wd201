/* eslint-disable no-undef */
"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }
    static getTodos() {
      return this.findAll({ order: [["id", "ASC"]] });
    }

    deletetodo() {
      return this.removetask(id);
    }
    markAsCompleted() {
      return this.update({ completed: true });
    }

    static overdue(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toLocaleDateString("en-CA"),
          },
          userId,
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toLocaleDateString("en-CA"),
          },
          userId,
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static async remove(id, userId) {
      return this.destroy({
        where: { id },
        userId,
      });
    }
    setCompletionStatus(boolean) {
      return this.update({ completed: boolean });
    }
    static dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toLocaleDateString("en-CA"),
          },
          userId,
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static completed(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId,
        },
        order: [["id", "ASC"]],
      });
    }
  }

  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            notNull: true,
            len: 5,
            msg: "Title cannot empty.",
          },
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: {
            args: true,
            msg: "Due date is required",
          },
        },
      },
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );
  return Todo;
};
