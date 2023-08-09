/* eslint-disable no-undef */
const todoList = require("../todo");
let today = new Date().toLocaleDateString("en-CA");

const { all, markAsComplete, add, overdue, dueToday, dueLater } = todoList();

describe("Todolist Testing", () => {
  beforeAll(() => {
    add({
      title: "Learn Node JS",
      completed: false,
      dueDate: new Date().toLocaleDateString("en-CA"),
    });
  });

  test("Add a new todo in list", () => {
    let length = all.length;

    add({
      title: "Skilled",
      completed: false,
      dueDate: new Date().toLocaleDateString("en-CA"),
    });

    expect(all.length).toBe(length + 1);
  });

  test("Mark todo as completed", () => {
    expect(all[0].completed).toBe(false);
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
  });

  test("Retrive todos that are overdue", () => {
    let listOfTodos = overdue();

    expect(
      listOfTodos.every((todo) => {
        return todo.dueDate < today;
      }),
    ).toBe(true);
  });

  test("Retrive todos that are in dueToday", () => {
    let listOfTodos = dueToday();

    expect(
      listOfTodos.every((todo) => {
        return todo.dueDate === today;
      }),
    ).toBe(true);
  });

  test("Retrive todos that are in dueLater.", () => {
    let listOfTodos = dueLater();

    expect(
      listOfTodos.every((todo) => {
        return todo.dueDate > today;
      }),
    ).toBe(true);
  });
});
