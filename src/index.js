import React from "react";
import { render } from "react-dom";
import { types, getSnapshot, applySnapshot } from "mobx-state-tree";
import { observer } from "mobx-react";
import { values } from "mobx";

const randomId = () => Math.floor(Math.random() * 1000).toString(36);

// entity model for todo
const Todo = types
  .model({
    name: types.optional(types.string, ""),
    done: types.optional(types.boolean, false),
    user: types.maybe(types.reference(types.late(() => User)))
  })
  .actions(self => { // self = the object being constructed when an instance of your model is created
    // set the name of the attribute
    function setName(newName) {
      self.name = newName;
    }
    // set the user for the task
    function setUser(user) {
      if (user === "") {
        // when no user is selected set user to null
        self.user = null
      }
      else {
        self.user = user;
      }
    }
    // toggle the todo to complete or incomplete
    function toggle() {
      self.done = !self.done;
    }

    return { setName, setUser, toggle };
  });

// entity model for user
const User = types.model({
  id: types.identifier,
  name: types.optional(types.string, "")
});

// entity model for root store
const RootStore = types
  .model({
    users: types.map(User),
    todos: types.map(Todo)
  })
  .views(self => ({
    // returns number of incomplete tasks
    get pendingCount() {
      return values(self.todos).filter(todo => !todo.done).length;
    },
    // returns number of complete tasks
    get completedCount() {
      return values(self.todos).filter(todo => todo.done).length;
    },
    // declared model view of todos that are either complete or incomplete (based on method parameter input)
    // so you do not have to use filtering everytime like in the gets above
    // model view is declard a function over the properties (first argument) of the model declaration
    getTodosWhereDoneIs(done) {
      return values(self.todos).filter(todo => todo.done === done);
    }
  }))
  .actions(self => {
    // create a new todo for the todo list
    function addTodo (id, name) {
      self.todos.set(id, Todo.create({ name }));
    }

    return { addTodo };
  });

// create new model instance and pass it a snapshot - this requires all store references to be updated 
// if used in react components 
const store = RootStore.create({
  users: {
    "1": {
        id: "1",
        name: "mweststrate"
    },
    "2": {
        id: "2",
        name: "mattiamanzati"
    },
    "3": {
        id: "3",
        name: "johndoe"
    }
  },
  todos: {
    "1": {
        name: "Eat a cake",
        done: true
    }
  }
});

// // apply a snapshot to an existing model instance. Properties will be updated but the store reference
// // will remain the same. Triggers an operation called "reconciliation"
// applySnapshot(store, {
//   users: {},
//   todos: {
//     "1": {
//       name: "Eat a cake",
//       done: true
//     }
//   }
// });

// component to select the user for the todo
const UserPickerView =observer(props => (
  <select
    value={props.user ? props.user.id : ""}
    onChange={e => props.onChange(e.target.value)}
  >
    <option value="">-none-</option>
    {values(props.store.users).map(user => (
      <option value={user.id}>{user.name}</option>
    ))}
  </select>
));
// componenet for each todo on the list
const TodoView = observer(props => (
  <div>
    <input
      type="checkbox"
      checked={props.todo.done}
      onChange={e => props.todo.toggle()}
    />
    <input
      type="text"
      value={props.todo.name}
      onChange={e => props.todo.setName(e.target.value)}
    />
    <UserPickerView
      user={props.todo.user}
      store={props.store}
      onChange={userId => props.todo.setUser(userId)}
    />
  </div>
));

// displays the number of complete and incomplete tasks
const TodoCounterView = observer(props => (
  <div>
    {props.store.pendingCount} pending, {props.store.completedCount} completed
  </div>
))

// app componenet that includes the list of todos and the todos counter
const AppView = observer(props => (
  <div>
    <button onClick={e => props.store.addTodo(randomId(), "New Task")}>
      Add Task
    </button>
    {values(props.store.todos).map(todo => (
      <TodoView store={props.store} todo={todo} />
    ))}
    <TodoCounterView store={props.store} />
  </div>
));

render(<AppView store={store} />, document.getElementById("root"));





