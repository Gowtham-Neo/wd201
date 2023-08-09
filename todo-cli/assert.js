// assert.js

let toggleTodoCompletedStatus = (todoItem) => {
  return todoItem;
};

let testToggleCompletion = () => {
  let item = {
    title: "Buy Milk",
    completed: false,
  };
  item = toggleTodoCompletedStatus(item);

  console.assert(item.completed === true, "Todo item should be completed");
  console.log(item);
};

testToggleCompletion();
