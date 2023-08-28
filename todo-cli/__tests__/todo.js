// __tests__/todo.js
/* eslint-disable no-undef */
// eslint-disable-next-line quotes
const db = require("../models");

describe('Todolist Test Suite', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  test('Should add new todo', async () => {
    const todoItemsCount = await db.Todo.count();
    await db.Todo.addTask({
      title: 'Test_todo',
      completed: false,
      dueDate: new Date(),
    });
    const newTodoItemsCount = await db.Todo.count();
    expect(newTodoItemsCount).toBe(todoItemsCount + 1);
  });
});