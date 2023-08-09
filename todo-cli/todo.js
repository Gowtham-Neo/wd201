/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const todoList = () => {
  all = [];
  const add = (todoItem) => {
    all.push(todoItem);
  };
  const markAsComplete = (index) => {
    all[index].completed = true;
  };
  let today = new Date().toLocaleDateString("en-CA");
  const overdue = () => {
    return all.filter((item) => {
      return item.dueDate < today;
    });
  };

  const dueToday = () => {
    return all.filter((item) => {
      return item.dueDate === today;
    });
  };

  const dueLater = () => {
    return all.filter((item) => {
      return item.dueDate > today;
    });
  };

  const toDisplayableList = (list) => {
    let lists = [];
    list.forEach((item) => {
      if (item.dueDate === today) {
        if (item.completed === true) {
          lists.push(`[x] ${item.title}`);
        } else {
          lists.push(`[ ] ${item.title}`);
        }
      } else {
        if (item.completed === true) {
          lists.push(`[x] ${item.title} ${item.dueDate}`);
        } else {
          lists.push(`[ ] ${item.title} ${item.dueDate}`);
        }
      }
    });
    return lists.join("\n");
  };

  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};
module.exports = todoList;

// ####################################### #
// DO NOT CHANGE ANYTHING BELOW THIS LINE. #
// ####################################### #
