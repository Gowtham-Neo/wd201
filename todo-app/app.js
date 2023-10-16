const express = require("express");
const path = require("path");
const app = express();
const { Todo, User } = require("./models");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;

app.use(flash());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(express.static(path.join(__dirname, "/public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "my-super-secret-key-15261562217281726",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } }).then(async function (user) {
        const result = await bcrypt.compare(password, user.password);
        if (result) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Invalid password" });
        }
      });
    },
  ),
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.get("/", async (req, res) => {
  res.render("index", {
    title: "Todo application",
    csrfToken: req.csrfToken(),
  });
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const allItems = await Todo.getTodos();
  const loggedInUser = req.user.id;
  const overDue = await Todo.overdue(loggedInUser);
  const due_Later = await Todo.dueLater(loggedInUser);
  const due_Today = await Todo.dueToday(loggedInUser);
  const completed_items = await Todo.completed(loggedInUser);

  if (req.accepts("html")) {
    res.render("todo", {
      title: "Todo application",
      allItems,
      overDue,
      due_Later,
      due_Today,
      completed_items,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      overDue,
      due_Later,
      due_Today,
      completed_items,
    });
  }
});

app.get("/todos/:id", async function (req, res) {
  try {
    const gettodos = await Todo.findByPk(req.params.id);
    return res.json(gettodos);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.get("/todos", async function (req, res) {
  console.log("Listing Items");
  try {
    const todolist = await Todo.findAll();
    return res.send(todolist);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, res) {
    console.log(req.user);
    try {
      const trimmedTitle = req.body.title.trim();
      if (trimmedTitle.length === 0) {
        throw new Error("Title cannot be empty.");
      }

      await Todo.addTodo({
        title: trimmedTitle,
        dueDate: req.body.dueDate,
        userId: req.user.id,
      });

      return res.redirect("/todos");
    } catch (err) {
      return res.status(422).json({ error: err.message });
    }
  },
);

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup", csrfToken: req.csrfToken() });
});

app.put("/todos/:id", async function (request, res) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatingTodos = await todo.setCompletionStatus(
      request.body.completed,
    );
    return res.json(updatingTodos);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res) {
    console.log(req.user);
    res.redirect("/todos");
  },
);
app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post("/users", async (req, res) => {
  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  console.log(hashedPwd);

  try {
    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: hashedPwd, // Store the hashed password
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/todos");
    });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      const validationErrors = err.errors.map((error) => error.message);
      req.flash("error", validationErrors);
      res.redirect("/signup");
    } else {
      console.log(err);
    }
  }
});

app.delete("/todos/:id", async (req, res) => {
  console.log("deleting with ID:", req.params.id);
  try {
    await Todo.remove(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(422).json(err);
  }
});

module.exports = app;
