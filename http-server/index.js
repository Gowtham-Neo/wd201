const args = require("minimist")(process.argv.slice(2));

const http = require("http");
const fs = require("fs");

let home_content= "";
let project_content = "";
let registration_content= "";

fs.readFile("home.html", (err, home) => {
  if(err) {
    throw err;
  }
  home_content = home;
});

fs.readFile("project.html", (err, project) => {
  if(err) {
    throw err;
  }
  project_content = project;
});

fs.readFile("registration.html", (err, registration) => {
  if(err) {
    throw err;
  }
  registration_content = registration;
});

http
  .createServer((req, res) => {
    let url = req.url;
    res.writeHeader(200, { "Content-Type": "text/html" });
    switch (url) {
      case "/project":
        res.write(project_content);
        res.end();
        break;
      case "/registration":
        res.write(registration_content);
        res.end();
        break;
      default:
        res.write(home_content);
        res.end();
        break;
    }
  })
  .listen(args.port);