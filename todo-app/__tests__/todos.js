/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;
function extractCsrfToken(res) {
  var s = cheerio.load(res.text);
  return s("[name=_csrf]").val();
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a todo and responds ", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy Coffee",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parseGroupResponse = JSON.parse(groupTodosResponse.test);
    const dueTodayCount = parseGroupResponse.dueToday.length;
    const latestTodo = parseGroupResponse.dueToday[dueTodayCount - 1];
    const status = latestTodo.completed ? false : true;
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: status,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
  test("Delete todo using ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Go Work!",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
});
