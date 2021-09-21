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
    done: types.optional(types.boolean, false)
  })
  .actions(self => { // self = the object being constructed when an instance of your model is created
    // set the name of the attribute
    function setName(newName) {
      self.name = newName;
    }
    // toggle the todo to complete or incomplete
    function toggle() {
      self.done = !self.done;
    }

    return { setName, toggle };
  });

// entity model for user
const User = types.model({
  name: types.optional(types.string, "")
});

// entity model for root store
const RootStore = types
  .model({
    users: types.map(User),
    todos: types.optional(types.map(Todo), {})
  })
  .views(self => ({
    // returns number of incomplete tasks
    get pendingCount() {
      return values(self.todos).filter(todo => !todo.done).length;
    },
    // returns number of complete tasks
    get completedCount() {
      return values(self.todos).filter(todo => todo.done).length;
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
  users: {},
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
  </div>
));

const TodoCounterView = observer(props => (
  <div>
    {props.store.pendingCount} pending, {props.store.completedCount} completed
  </div>
))

const AppView = observer(props => (
  <div>
    <button onClick={e => props.store.addTodo(randomId(), "New Task")}>
      Add Task
    </button>
    {values(props.store.todos).map(todo => (
      <TodoView todo = {todo} />
    ))}
    <TodoCounterView store={props.store} />
  </div>
));

render(<AppView store={store} />, document.getElementById("root"));





