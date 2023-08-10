/* eslint-disable no-undef */
let todoList = require("../todo");
const { all, markAsComplete, add, overdue, dueToday, dueLater } = todoList();
describe("Todo test cases", () => {
  beforeAll(() => {
    const today = new Date();
    const oneDay = 60 * 60 * 24 * 1000;
    [
      {
        title: "Complete assignment",
        completed: false,
        dueDate: new Date(today.getTime() - 1 * oneDay).toLocaleDateString(
          "en-CA"
        ),
      },
      {
        title: "Go for shopping",
        completed: false,
        dueDate: new Date().toLocaleDateString("en-CA"),
      },
      {
        title: "Complete project",
        completed: false,
        dueDate: new Date(today.getTime() + 1 * oneDay).toLocaleDateString(
          "en-CA"
        ),
      },
    ].forEach(add);
  });
  test("Add new todo", () => {
    expect(all.length).toEqual(3);

    add({
      title: "Take the test",
      completed: false,
      dueDate: new Date().toLocaleDateString("en-CA"),
    });

    expect(all.length).toEqual(4);
  });

  test("Todo mark as complete", () => {
    expect(all[0].completed).toEqual(false);
    markAsComplete(0);
    expect(all[0].completed).toEqual(true);
  });

  test("Test for overdue", () => {
    expect(overdue().length).toEqual(1);
  });

  test("Test due today", () => {
    expect(dueToday().length).toEqual(2);
  });

  test("Test for due later", () => {
    expect(dueLater().length).toEqual(1);
  });
});
