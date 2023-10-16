const req = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo test cases for l10", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(2000, () => {});
    agent = req.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Signing In", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstname: "Test",
      lastname: "A",
      email: "Test.a@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Signing out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Create new todo Item", async () => {
    const agent = req.agent(server);
    await login(agent, "Test.a@test.com", "12345678");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Go to movie",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("updating the todos", async () => {
    const agent = req.agent(server);
    await login(agent, "Test.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);

    const createTodoResponse = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(createTodoResponse.statusCode).toBe(302);

    res = await agent.get("/todos").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(res.text);

    if (
      parsedGroupedResponse.dueToday &&
      parsedGroupedResponse.dueToday.length > 0
    ) {
      const dueTodayCount = parsedGroupedResponse.dueToday.length;
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
      const status = !latestTodo.completed;

      res = await agent.get("/todos");
      csrfToken = extractCsrfToken(res);
      const response = await agent.put(`/todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
        completed: status,
      });

      const parsedUpdateResponse = JSON.parse(response.text);
      expect(parsedUpdateResponse.completed).toBe(status);
    } else {
      console.error("No more todos found in 'dueToday'.");
    }
  });

  test("Delete using userID", async () => {
    const agent = req.agent(server);
    await login(agent, "Test.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);

    const createTodoResponse = await agent.post("/todos").send({
      title: "Go to shopping",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(createTodoResponse.statusCode).toBe(302);

    res = await agent.get("/todos").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(res.text);

    if (
      parsedGroupedResponse.dueToday &&
      parsedGroupedResponse.dueToday.length > 0
    ) {
      const dueTodayCount = parsedGroupedResponse.dueToday.length;
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

      res = await agent.get("/todos");
      csrfToken = extractCsrfToken(res);
      const deleteResponse = await agent
        .delete(`/todos/${latestTodo.id}`)
        .send({ _csrf: csrfToken });

      const parsedDeleteResponse = JSON.parse(deleteResponse.text);
      expect(parsedDeleteResponse.success).toBe(true);
    } else {
      console.error("No more todos found in 'dueToday'.");
    }
  });
});
