const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("passport");
const connnectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const saltRounds = 10;
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());

const { Todo, User } = require("./models");

app.use(
  session({
    secret: "my-super-secret-key-23487623476321414726",

    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, {
            message: "Account is not exist for this mail",
          });
        });
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session: ", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.set("view engine", "ejs");
app.get("/", async (request, response) => {
  if (request.user) {
    response.redirect("/todos");
  } else {
    response.render("index", {
      title: "Todo App",
      csrfToken: request.csrfToken(),
    });
  }
});

app.get(
  "/todos",
  connnectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const allTodos = await Todo.getTodos(loggedInUser);
    const overdue = await Todo.overdue(loggedInUser);
    const dueToday = await Todo.dueToday(loggedInUser);
    const dueLater = await Todo.dueLater(loggedInUser);
    const completed = await Todo.completed(loggedInUser);
    if (request.accepts("html")) {
      response.render("todos", {
        title: "Todo App",
        allTodos,
        overdue,
        dueLater,
        dueToday,
        completed,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        overdue,
        dueLater,
        dueToday,
        completed,
      });
    }
  },
);

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Signup",

    csrfToken: req.csrfToken(),
  });
});

app.post("/users", async (req, res) => {
  if (req.body.email.length == 0) {
    req.flash("error", "Email can not be empty...!");
    return res.redirect("/signup");
  }
  if (req.body.firstName.length == 0) {
    req.flash("error", "Firstname cannot be empty...!");
    return res.redirect("/signup");
  }
  if (req.body.lastName.length == 0) {
    req.flash("error", "Lastname cannot be empty...!");
    return res.redirect("/signup");
  }
  if (req.body.password.length < 8) {
    req.flash("error", "Password must be at least 8 characters...");
    return res.redirect("/signup");
  }

  const hash = await bcrypt.hash(req.body.password, saltRounds);
  console.log(req.user);
  try {
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hash,
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/login", (request, reponse) => {
  reponse.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      req.flash("error", "Please provide a valid email...!");
      return res.redirect("/login");
    }

    if (!password) {
      req.flash("error", "Please provide the password...!");
      return res.redirect("/login");
    }

    const user = await User.findOne({
      where: { email },
    });

    if (!user || !user.isValidPassword(password)) {
      req.flash("error", "Invalid Email or Password...!");
      return res.redirect("/login");
    }

    req.flash("success", "Logged in successfully...!");
    return res.redirect("/todos");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred");
    res.redirect("/login");
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { firstName, email, password } = req.body;
    if (!firstName) {
      req.flash("error", "Please provide a valid firstName");
      return res.redirect("/signup");
    }
    if (!email) {
      req.flash("error", "Please provide a valid  email");
      return res.redirect("/signup");
    }
    if (!password) {
      req.flash("error", "Please provide a valid  password");
      return res.redirect("/signup");
    }
    req.flash("success", "User signed up successfully");
    return res.redirect("/todos");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred");
    res.redirect("/signup");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log(request.user);
    response.redirect("/todos");
  },
);

app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/todos", async (request, response) => {
  console.log("We have to fetch all the todos");
  try {
    const allTodos = await Todo.findAll();
    return response.send(allTodos);
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

app.post("/todos", connnectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  if (req.body.title.length == 0) {
    req.flash("error", "Title cannot be empty...!");
    return res.redirect("/todos");
  }
  if (req.body.dueDate.length == 0) {
    req.flash("error", "Due date cannot be empty...!");
    return res.redirect("/todos");
  }

  try {
    await Todo.addTodo({
      title: req.body.title,
      dueDate: req.body.dueDate,
      userId: req.user.id,
    });
    return res.redirect("/todos");
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

app.put(
  "/todos/:id",
  connnectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const todo = await Todo.findByPk(req.params.id);
    try {
      const updatedtodo = await todo.setCompletionStatus(req.body.completed);
      return res.json(updatedtodo);
    } catch (error) {
      console.log(error);
      return res.status(422).json(error);
    }
  },
);

app.put("/todos/:id/markAsCompleted", async (req, res) => {
  const todo = await Todo.findByPk(req.params.id);
  try {
    const updatedtodo = await todo.setCompletionStatus(req.body.completed);
    return res.json(updatedtodo);
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

app.delete(
  "/todos/:id",
  connnectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    console.log("We have to delete a todo with ID: ", request.params.id);
    try {
      const status = await Todo.remove(request.params.id, loggedInUser);
      return response.json(status ? true : false);
    } catch (err) {
      return response.status(422).json(err);
    }
  },
);

module.exports = app;
