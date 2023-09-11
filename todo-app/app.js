/* eslint-disable no-undef */
const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const path=require("path")
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,"/public")))

app.set("view engine","ejs")

app.get("/", async (req, res)=> {
  const allTodos= await Todo.getTodos();
  if(req.accepts("html")){
    res.render("index",{
      allTodos,
    });
  }else{
    res.json({
      allTodos,
    })
  }
});


app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos_list = await Todo.findAll();
    return response.send(todos_list);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  const delete_todo = await Todo.destroy({ where: { id: request.params.id } });
  response.send(delete_todo ? true : false);
});

module.exports = app;
