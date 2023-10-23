/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
let server, agent;

function extractCsrfToken(response) {
  const $ = cheerio.load(response.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let response = await agent.get("/login");
  let csrfToken = extractCsrfToken(response);
  response = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo test suite.", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Sign-Up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign-Out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a todo item", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy Gold",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo item as Completed", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy Gold",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedtodoResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedgroupeResponse = JSON.parse(groupedtodoResponse.text);
    const duetodayCount = parsedgroupeResponse.dueToday.length;
    const latest_Todo = parsedgroupeResponse.dueToday[duetodayCount - 1];
    const status = latest_Todo.completed ? false : true;
    let res1 = await agent.get("/todos");
    csrfToken = extractCsrfToken(res1);
    const response = await agent.put(`/todos/${latest_Todo.id}`).send({
      _csrf: csrfToken,
      completed: status,
    });
    const parsedupdatedResponse = JSON.parse(response.text);
    expect(parsedupdatedResponse.completed).toBe(true);
  });

  test("Deletes a todo item from given id", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy Gold",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedtodoResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedgroupeResponse = JSON.parse(groupedtodoResponse.text);
    const duetodayCount = parsedgroupeResponse.dueToday.length;
    const latest_Todo = parsedgroupeResponse.dueToday[duetodayCount - 1];
    let res1 = await agent.get("/todos");
    csrfToken = extractCsrfToken(res1);
    const response = await agent.delete(`/todos/${latest_Todo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedupdatedResponse = Boolean(response.text);
    expect(parsedupdatedResponse).toBe(true);
  });
});
