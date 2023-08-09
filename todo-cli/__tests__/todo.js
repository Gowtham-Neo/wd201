/* eslint-disable no-undef */
const todoList = require("../todo");
// eslint-disable-next-line no-unused-vars
const { add, markAsComplete, all } = todoList();
describe("Todolist Test Suite", () => {
  test("Should add new todo", () => {
    expect(all.length).toBe(0);
    add({
      title: "Test todo",
      completed: false,
      dueDate: new Date().toLocaleDateString("en-CA"),
    });
    expect(all.length).toBe(1);
  });
});
