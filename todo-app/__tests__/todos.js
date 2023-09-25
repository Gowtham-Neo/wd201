/* eslint-disable no-undef */
const request = require("supertest"); 
var cheerio = require("cheerio"); 

const db = require("../models/index"); 
const app = require("../app");

let server, agent;


function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}


beforeAll(async () => {
  await db.sequelize.sync({ force: true }); 
  server = app.listen(4000, () => {}); 
  agent = request.agent(server); 
});

afterAll(async () => {
  await db.sequelize.close(); 
  server.close(); // Close the Express.js server
});


describe("Todo Application", () => {
  test("Should not create a todo item with empty dueDate", async () => {
    const response = await agent.post("/todos").send({
      title: "Empty Due Date Todo",
      dueDate: "",
      completed: false,
    });

    expect(response.status).toBe(400);
  });

  test("Should create a sample due today item", async () => {
    const response = await agent.post("/todos").send({
      title: "Due Today Todo",
      dueDate: new Date().toISOString(),
      completed: false,
    });

    expect(response.status).toBe(302);
  });

  test("Should create a sample due later item", async () => {
    const response = await agent.post("/todos").send({
      title: "Due Later Todo",
      dueDate: "2023-12-31",
      completed: false,
    });
    expect(response.status).toBe(302);
  });

  test("Should create a sample overdue item", async () => {
    const response = await agent.post("/todos").send({
      title: "Overdue Completed",
      dueDate: "2021-01-01",
      completed: false,
    });

    expect(response.status).toBe(302);
  });

  test("Should mark a sample overdue item as completed", async () => {
    const overdueResponse = await agent.post("/todos").send({
      title: "Overdue Completed",
      dueDate: "2021-01-01", 
      completed: false,
    });

    const overdueTodoId = Number(overdueResponse.header.location.split("/")[2]);

    const markCompletedResponse = await agent.put(`/todos/${overdueTodoId}`).send({
      _csrf: extractCsrfToken(overdueResponse),
      completed: true,
    });
    expect(markCompletedResponse.status).toBe(200);
    expect(markCompletedResponse.body.completed).toBe(true);
  });

  test("Should toggle a completed item to incomplete when clicked on it", async () => {
    const completedResponse = await agent.post("/todos").send({
      title: "Completed Todo",
      dueDate: new Date().toISOString(),
      completed: true,
    });

    const completedTodoId = Number(completedResponse.header.location.split("/")[2]);
    const toggleResponse = await agent.put(`/todos/${completedTodoId}`).send({
      _csrf: extractCsrfToken(completedResponse),
      completed: false, // Toggle to incomplete
    });

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.completed).toBe(false);
  });

  test("Should delete an item", async () => {
    const createResponse = await agent.post("/todos").send({
      title: "Todo to Delete",
      dueDate: new Date().toISOString().split("T")[0],
      completed: false,
    });
    const todoToDeleteId = Number(createResponse.header.location.split("/")[2]);
    const deleteResponse = await agent.delete(`/todos/${todoToDeleteId}`).send();
    expect(deleteResponse.status).toBe(302);
  });
})