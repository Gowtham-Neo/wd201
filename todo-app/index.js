const port = 3000;
const app = require("./app");
app.listen(port, () => {
  console.log(`Started express server at port ${port}`);
});
