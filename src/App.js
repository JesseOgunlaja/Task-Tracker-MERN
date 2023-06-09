import { disableReactDevTools } from "@fvilers/disable-react-devtools";
import { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import CryptoJS from "crypto-js";
const jwt = require("jsrsasign");

if (process.env.REACT_APP_GMAIL_PASSWORD) {
  disableReactDevTools();
}

function App() {
  const DATA_ENCRYPTION_KEY1 = process.env.REACT_APP_DATA_ENCRYPTION1;
  const parsedDataKey1 = CryptoJS.enc.Utf8.parse(DATA_ENCRYPTION_KEY1);
  const stringDataKey1 = CryptoJS.enc.Utf8.stringify(parsedDataKey1);
  const DATA_ENCRYPTION_KEY2 = process.env.REACT_APP_DATA_ENCRYPTION2;
  const parsedDataKey2 = CryptoJS.enc.Utf8.parse(DATA_ENCRYPTION_KEY2);
  const stringDataKey2 = CryptoJS.enc.Utf8.stringify(parsedDataKey2);
  const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;

  const newTaskTitle = useRef();
  const newTaskDate = useRef();
  const newTaskReminder = useRef();
  const editIndex = useRef();
  const passwordBox = useRef();
  const oldPasswordBox = useRef();
  const newPasswordBox = useRef();
  const addUserName = useRef();
  const addUserPassword = useRef();
  const addUserEmail = useRef();
  const passwordBeingResetBox = useRef();
  const codeBeingInputtedBox = useRef();
  const adminPasswordBox = useRef();
  const usernameBox = useRef();
  const newEmailBox = useRef();

  const [username, setUsername] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [tasks, setTasks] = useState(null);
  const [user, setUser] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [nameBeingAdded, setNameBeingAdded] = useState("");
  const [isPuttingPassword, setIsPuttingPassword] = useState(false);
  const [passwordBeingAdded, setPasswordBeingAdded] = useState("");
  const [isChangingData, setIsChangingData] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailBeingAdded, setEmailBeingAdded] = useState("");
  const [isForgettingPassword, setIsForgettingPassword] = useState(false);
  const [codeBeingInputted, setCodeBeingInputted] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordBeingReset, setPasswordBeingReset] = useState("");
  const [editedTaskTitle, setEditedTaskTitle] = useState("");
  const [editedTaskDate, setEditedTaskDate] = useState("");
  const [editedTaskReminder, setEditedTaskReminder] = useState();
  const [dataBeingChanged, setDataBeingChanged] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState(makeRandomString(8));
  const [token, setToken] = useState();

  const error = (text) => {
    if(text != undefined && text != null && text !== "") {
      toast.error(text, {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  async function completeChangeEmail() {
    newEmailBox.current.disabled = true;
    await fetch(`api/Users/user`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: username.toUpperCase(),
        email: newEmail.toLowerCase(),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.refresh) {
          window.location.reload();
        }
      });
    newEmailBox.current.disabled = true;
    back("changeEmail");
    setSignedIn(true);
  }

  function encryptString(nameGiven) {
    const encrypted1 = CryptoJS.AES.encrypt(
      nameGiven,
      stringDataKey1
    ).toString();
    const encrypted2 = CryptoJS.AES.encrypt(
      encrypted1,
      stringDataKey2
    ).toString();
    return encrypted2;
  }

  async function signInUsername() {
    usernameBox.current.disabled = true;
    const res = await toast.promise(
      new Promise((resolve, reject) => {
        fetch("/api/users/loginName", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.toUpperCase(),
          }),
        })
          .then((response) => {
            usernameBox.current.disabled = false;
            const data = response.json();
            if (data.refresh && response.status === 401) {
              window.location.reload();
            }
            if (response.ok) {
              signIn(username);
              resolve(data);
            } else {
              reject(new Error(`HTTP error: ${response.status}`));
            }
          })
          .catch((error) => {
            reject(error);
          });
      }),
      {
        pending: "Loading",
        success: "Success",
        error: "User not found",
      }
    );
  }

  async function signIn(person) {
    setIsPuttingPassword(true);
    setUser(person);
  }

  async function deleteTask(index) {
    const currentTasks = [...tasks];
    currentTasks.splice(index, 1);

    await fetch(`api/Users/user`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: username.toUpperCase(),
        tasks: currentTasks,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.refresh) {
          window.location.reload();
        }
        else {
          setTasks(data.tasks);
        }
      });

  }

  async function addTask() {
    if (newTaskTitle.current.value !== "" && newTaskDate.current.value !== "") {
      const newTask = {
        task: newTaskTitle.current.value,
        date: newTaskDate.current.value,
        reminder: newTaskReminder.current.checked,
      };

      const currentTasks = [...tasks];
      const encryptedTasks = currentTasks.map((task) => {
        const newTask = task.task;
        const newDate = task.date;
        return {
          reminder: task.reminder,
          _id: task._id,
          task: newTask,
          date: newDate,
        };
      });
      encryptedTasks.push(newTask);

      await fetch(`api/Users/user`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.toUpperCase(),
          tasks: encryptedTasks,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.refresh) {
            window.location.reload();
          }
          else {
            setTasks(data.tasks);
          }
        });
    }
    setIsAdding(false);
  }

  function edit(index) {
    if (isAdding === false) {
      setEditedTaskDate(tasks[index].date);
      setEditedTaskTitle(tasks[index].task);
      setEditedTaskReminder(tasks[index].reminder);
      setIsEditing(true);
      editIndex.current = index;
    }
  }

  async function editTask() {
    const updatedTask = {
      task: editedTaskTitle,
      date: editedTaskDate,
      reminder: editedTaskReminder,
    };

    const currentTasks = [...tasks];
    currentTasks[editIndex.current] = updatedTask;

    await fetch(`api/Users/user`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: username.toUpperCase(),
        tasks: currentTasks,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.refresh) {
          window.location.reload();
        }
        else {
          setTasks(data.tasks);
        }
      });
    setIsEditing(false);
  }

  async function checkIfSignedIn() {
    if (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1]
    ) {
      const res = await toast.promise(
        new Promise((resolve, reject) => {
          fetch("/api/users/checkJWT", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          })
            .then(async (response) => {
              const data = await response.json();
              if (data.refresh && response.status === 401) {
                window.location.reload();
              }
              if (response.status === 500) {
                deleteCookie('authToken');
                window.location.reload();
              } else {
                if (data.message === "Valid cookie") {
                  setUsername(data.user.name);
                  setToken(data.token);
                  setTasks(data.user.tasks);
                  setSignedIn(true);
                  resolve(data);
                } else if (data.message === "Invalid cookie") {
                  deleteCookie('authToken');
                  window.location.reload();
                  reject(new Error(`Invalid cookie`));
                }
              }
            })
            .catch((error) => {
              reject(error);
            });
        }),
        {
          pending: "Loading",
          success: "Success",
          error: "User not found",
        }
      );
    }
  }

  useEffect(() => {
    checkIfSignedIn();
  }, []);

  async function signIn(person, id) {
    setIsPuttingPassword(true);
    setUser(person);
  }

  async function addUser() {
    if (nameBeingAdded === "") {
      error("Name required");
    } else if (passwordBeingAdded === "") {
      error("Password required");
    } else {
      addUserPassword.current.type = "password";

      const res = await toast.promise(
        new Promise((resolve, reject) => {
          fetch(`api/Users`, {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({
              name: nameBeingAdded.toUpperCase(),
              tasks: [],
              password: passwordBeingAdded,
              email: emailBeingAdded.toLowerCase(),
            }),
          })
            .then( async (response) => {
              const data = await response.json();
              if(data.message) {
                if(data.message === "Duplicate email") {
                  console.log("email")
                  reject("A user is already registered with that email")
                  return;
                }
                else if(data.message === "Duplicate name") {
                  reject("A user is already registered with that name")
                  return;
                }
              }
              else if (response.ok) {
                signOut(false);
                resolve(data);
              } else {
                reject(new Error(`HTTP error: ${response.status}`));
              }
            })
            .catch(() => {
              reject("error");
            });
        }),
        {
          pending: "Loading",
          success: "Registered",
          error: {
            render({data}){
              if(data.includes("user")) {
                return data
              }
              else {
                return "Error"
              }
            }
          }
        }
      );
  }
}

  async function signOut(eraseUserName) {
    setNewEmail("");
    setDataBeingChanged("");
    setEmailBeingAdded("");
    setPasswordBeingAdded("");
    setNewPassword("");
    setOldPassword("");
    deleteCookie('authToken');
    if (eraseUserName === true) {
      setUsername("");
    }
    setIsForgettingPassword(false);
    setPasswordBeingReset("");
    setPasswordBeingAdded("");
    setIsResettingPassword(false);
    setVerificationCode(makeRandomString(8));
    setCodeBeingInputted("");
    setIsChangingData(false);
    setNameBeingAdded("");
    setIsAdding(false);
    setIsAddingUser(false);
    setIsEditing(false);
    setIsPuttingPassword(false);
    setSignedIn(false);
  }

  async function deleteAccount() {
    await fetch(`api/Users//user/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: username.toUpperCase(),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.refresh) {
          window.location.reload();
        }
      });
    signOut(true);
  }

  async function submitPassword() {
    passwordBox.current.disabled = true;
    const res = await toast.promise(
      new Promise(async (resolve, reject) => {
        await fetch("/api/users/loginPassword", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.toUpperCase(),
            password: passwordBeingAdded,
          }),
        })
          .then(async (response) => {
            passwordBox.current.disabled = false;
            const data = await response.json();
            if (data.refresh && response.status === 401) {
              window.location.reload();
            }
            if (response.ok) {
              const tokenGiven = data.token;
              setToken(tokenGiven);
              passwordBox.current.type = "password";
              setTasks(data.user.tasks);
              setSignedIn(true);
              resolve(data);
            } else {
              reject(new Error(`HTTP error: ${response.status}`));
            }
          })
          .catch((error) => {
            reject(error);
          });
      }),
      {
        pending: "Loading",
        success: "Success",
        error: "Incorrect Password",
      }
    );
  }

  function changePassword() {
    setIsAdding(false);
    setIsEditing(false);
    signOut(false);
    setIsChangingData(true);
    setDataBeingChanged("password");
  }

  function changeEmail() {
    setIsAdding(false);
    setIsEditing(false);
    signOut(false);
    setIsChangingData(true);
    setDataBeingChanged("email");
  }

  async function completeChangePassword() {
    oldPasswordBox.current.disabled = true;
    newPasswordBox.current.disabled = true;
    if (oldPassword === "" || newPassword === "") {
      oldPasswordBox.current.disabled = true;
      newPasswordBox.current.disabled = true;
      error("Value required");
      return;
    }
    oldPasswordBox.current.type = "password";
    newPasswordBox.current.type = "password";

    const res = await toast.promise(
      new Promise(async (resolve, reject) => {
        const res2 = await fetch("/api/users/loginPassword", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.toUpperCase(),
            password: oldPassword,
          }),
        })
          .then(async (response) => {
            if (response.ok) {
              await fetch(`api/Users/user`, {
                method: "PATCH",
                headers: {
                  "Content-type": "application/json",
                },
                credentials: "include",

                body: JSON.stringify({
                  username: username.toUpperCase(),
                  password: newPassword,
                }),
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.refresh) {
                    window.location.reload();
                  }
                });
              signOut(false);
              resolve(response.json());
            } else {
              reject(new Error(`HTTP error: ${response.status}`));
            }
          })
          .catch((error) => {
            reject(error);
          });
      }),
      {
        pending: "Loading",
        success: "Success",
        error: "Incorrect Password",
      }
    );
    oldPasswordBox.current.disabled = true;
    newPasswordBox.current.disabled = true;
  }

  useEffect(() => {
    if (passwordBox.current) {
      passwordBox.current.focus();
    }
  }, [isPuttingPassword]);

  useEffect(() => {
    if (isChangingData === "password" && oldPassword.current) {
      oldPasswordBox.current.focus();
    }
    if (isChangingData === "email" && newEmailBox.current) {
      newEmailBox.current.focus();
    }
  }, [isChangingData]);

  useEffect(() => {
    if (addUserName.current) {
      addUserName.current.focus();
    }
  }, [isAddingUser]);

  useEffect(() => {
    if (codeBeingInputtedBox.current) {
      codeBeingInputtedBox.current.focus();
    }
  }, [isForgettingPassword]);

  useEffect(() => {
    if (passwordBeingResetBox.current) {
      passwordBeingResetBox.current.focus();
    }
  }, [isForgettingPassword]);

  window.onkeyup = function (e) {
    if (e.code === "Enter") {
      if (addUserPassword.current === document.activeElement) {
        addUser();
      }
      if (isPuttingPassword && passwordBox.current === document.activeElement) {
        submitPassword();
      }
      if (isChangingData && newPasswordBox.current === document.activeElement) {
        completeChangePassword();
      }
      if (isAddingUser && adminPasswordBox.current === document.activeElement) {
        addUser();
      }
      if (
        isResettingPassword &&
        passwordBeingResetBox.current === document.activeElement
      ) {
        submitNewPassword();
      }
      if (usernameBox.current === document.activeElement) {
        signInUsername();
      }
      if (newEmailBox.current === document.activeElement) {
        completeChangeEmail();
      }
      if (codeBeingInputtedBox.current === document.activeElement) {
        submitVerificationCode();
      }
    }
  };

  function showPassword(password) {
    if (password === "newUserPassword") {
      if (addUserPassword.current.type === "text") {
        addUserPassword.current.type = "password";
      } else {
        addUserPassword.current.type = "text";
      }
    }
    if (password === "oldPassword") {
      if (oldPasswordBox.current.type === "text") {
        oldPasswordBox.current.type = "password";
      } else {
        oldPasswordBox.current.type = "text";
      }
    }
    if (password === "newPassword") {
      if (newPasswordBox.current.type === "text") {
        newPasswordBox.current.type = "password";
      } else {
        newPasswordBox.current.type = "text";
      }
    }
    if (password === "password") {
      if (passwordBox.current.type === "text") {
        passwordBox.current.type = "password";
      } else {
        passwordBox.current.type = "text";
      }
    }
    if (password === "resetPassword") {
      if (passwordBeingResetBox.current.type === "text") {
        passwordBeingResetBox.current.type = "password";
      } else {
        passwordBeingResetBox.current.type = "text";
      }
    }
    if (password === "adminPassword") {
      if ((adminPasswordBox.current.type = "text")) {
        adminPasswordBox.current.type = "password";
      } else {
        adminPasswordBox.current.type = "text";
      }
    }
  }

  function makeRandomString(length) {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  async function forgotPassword() {
    const verifCode = makeRandomString(8);
    setVerificationCode(verifCode);
    setIsForgettingPassword(true);
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      KEY: process.env.REACT_APP_GLOBAL_KEY,
      exp: Math.floor(Date.now() / 1000) + 5,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const globalToken = jwt.jws.JWS.sign(
      "HS256",
      sHeader,
      sPayload,
      SECRET_KEY
    );
    await fetch(`/api/users/email`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        authorization: `Bearer ${globalToken}`,
      },
      body: JSON.stringify({
        verificationCode: encryptString(verifCode),
        username: username.toUpperCase(),
      }),
    });
  }

  function submitVerificationCode() {
    if (codeBeingInputted === verificationCode) {
      setIsResettingPassword(true);
      setIsForgettingPassword(false);
    } else {
      error("Incorrect verification code");
    }
  }

  async function submitNewPassword() {
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      KEY: process.env.REACT_APP_GLOBAL_KEY,
      exp: Math.floor(Date.now() / 1000) + 5,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const globalToken = jwt.jws.JWS.sign(
      "HS256",
      sHeader,
      sPayload,
      SECRET_KEY
    );
    await fetch(`api/Users/user/resetPassword`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        authorization: `Bearer ${globalToken}`,
      },
      body: JSON.stringify({
        username: username.toUpperCase(),
        password: passwordBeingReset,
      }),
    });
    signOut(false);
  }

  function back(page) {
    if (page === "signInPassword") {
      setPasswordBeingAdded("");
      setIsPuttingPassword("");
      setUsername("");
    }
    if (page === "changePassword") {
      setIsChangingData(false);
      setSignedIn(true);
    }
    if (page === "addingUser") {
      setEmailBeingAdded("");
      setNameBeingAdded("");
      setPasswordBeingAdded("");
      setIsAddingUser(false);
    }
    if (page === "forgetPassword") {
      setIsForgettingPassword(false);
      setIsPuttingPassword(false);
      setPasswordBeingAdded("");
    }
    if (page === "changeEmail") {
      setIsChangingData(false);
      setDataBeingChanged("");
      setEmailBeingAdded("");
      setNewEmail("");
      setSignedIn(true);
    }
  }

  async function deleteCookie(cookie) {
    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  return (
    <div className="app">
      <>
        <ToastContainer
          position="top-right"
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover={false}
          theme="dark"
        />
        {signedIn ? (
          <>
            <div className="container">
              <div className="header">
                <h1 className="title">Task Tracker</h1>
                <button
                  className={isAdding ? "button red" : "button green"}
                  onClick={() => isEditing === false && setIsAdding(!isAdding)}
                >
                  {isAdding ? "Close" : "Add"}
                </button>
              </div>
              {isAdding || isEditing ? (
                <div className={isAdding ? "addTask" : "editTask"}>
                  <label
                    className={isAdding ? "addTaskLabel" : "editTaskLabel"}
                    htmlFor="task"
                  >
                    Task
                  </label>
                  <input
                    autoComplete="off"
                    ref={isAdding ? newTaskTitle : null}
                    className={isAdding ? "addTaskInput" : "editTaskInput"}
                    value={isEditing ? editedTaskTitle : undefined}
                    onChange={(e) =>
                      isEditing && setEditedTaskTitle(e.target.value)
                    }
                    type="text"
                    placeholder={isAdding ? "Doctors Appoinment" : null}
                    id="task"
                  />
                  <label
                    className={isAdding ? "addTaskLabel" : "editTaskLabel"}
                    htmlFor="day"
                  >
                    Time
                  </label>
                  <input
                    autoComplete="off"
                    ref={isAdding ? newTaskDate : null}
                    type="text"
                    value={isEditing ? editedTaskDate : undefined}
                    onChange={(e) =>
                      isEditing && setEditedTaskDate(e.target.value)
                    }
                    className={isAdding ? "addTaskInput" : "editTaskInput"}
                    placeholder={isAdding ? "February 6th" : null}
                    id="day"
                  />
                  <div
                    className={
                      isAdding ? "addTaskReminder" : "editTaskReminder"
                    }
                  >
                    <label
                      htmlFor="reminder"
                      className={isAdding ? "addTaskLabel" : "editTaskLabel"}
                    >
                      Reminder
                    </label>
                    <input
                      ref={isAdding ? newTaskReminder : null}
                      className="reminderCheckbox"
                      id="reminder"
                      type="checkbox"
                      checked={isEditing ? editedTaskReminder : null}
                      onChange={(e) =>
                        isEditing && setEditedTaskReminder(e.target.checked)
                      }
                    />
                  </div>
                  {isEditing && (
                    <button
                      className="red cancel-button"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => (isAdding ? addTask() : editTask())}
                    className="saveTask"
                  >
                    Save Task
                  </button>
                </div>
              ) : null}
              <>
                {tasks.length !== 0 ? (
                  tasks.map((task, index) => (
                    <div
                      key={Math.random()}
                      className={task.reminder ? "task reminder" : "task"}
                    >
                      <p className="taskName">{task.task}</p>
                      <p className="taskDate">{task.date}</p>
                      <div className="buttons">
                        <button
                          className="button green edit-button"
                          onClick={() => edit(index)}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(index)}
                          className="button red edit-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="noTasks">No tasks</p>
                )}
              </>

              <div className="signOutButtons">
                <button
                  className="signOutButton notWide"
                  onClick={changePassword}
                >
                  Change Password
                </button>
                <button onClick={changeEmail} className="signOutButton notWide">
                  Change Email
                </button>
              </div>
              <button
                className="signOutButton red wide"
                onClick={deleteAccount}
              >
                Delete Account
              </button>
              <button
                className="signOutButton green wide"
                onClick={() => signOut(true)}
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="container">
              {isAddingUser ? (
                <div className="addUser">
                  <div
                    className="back addingUser"
                    onClick={() => back("addingUser")}
                  >
                    <div className="backTriangle">{"<"}</div>
                    <div>Back</div>
                  </div>
                  <label className="addUserName">Name:</label>
                  <input
                    ref={addUserName}
                    value={nameBeingAdded}
                    onChange={(e) => setNameBeingAdded(e.target.value)}
                    className="addUserInput"
                    type="text"
                  />
                  <label className="addUserName">Email:</label>
                  <input
                    ref={addUserEmail}
                    value={emailBeingAdded}
                    onChange={(e) => setEmailBeingAdded(e.target.value)}
                    className="addUserInput"
                    type="text"
                  />
                  <label className="addUserName">Password:</label>
                  <input
                    ref={addUserPassword}
                    value={passwordBeingAdded}
                    onChange={(e) => setPasswordBeingAdded(e.target.value)}
                    className="addUserInput show"
                    type="password"
                    style={{ marginBottom: "10px" }}
                  />
                  <div
                    className="showButton"
                    onClick={() => showPassword("newUserPassword")}
                  >
                    Show
                  </div>
                  <button onClick={addUser} className="signOutButton wide">
                    Add
                  </button>
                </div>
              ) : (
                <>
                  {isPuttingPassword ? (
                    <div>
                      {isResettingPassword ? (
                        <div>
                          <label>New Password</label>
                          <input
                            className="addUserInput show"
                            type="password"
                            value={passwordBeingReset}
                            ref={passwordBeingResetBox}
                            onChange={(e) =>
                              setPasswordBeingReset(e.target.value)
                            }
                          />
                          <div
                            className="showButton"
                            style={{ marginBottom: "10px" }}
                            onClick={() => showPassword("resetPassword")}
                          >
                            Show
                          </div>
                          <button
                            onClick={() => submitNewPassword()}
                            className="signOutButton wide"
                          >
                            Submit
                          </button>
                        </div>
                      ) : (
                        <div>
                          {isForgettingPassword ? (
                            <div>
                              <div
                                className="back"
                                onClick={() => back("forgetPassword")}
                              >
                                <div className="backTriangle">{"<"}</div>
                                <div>Back</div>
                              </div>
                              <p style={{ width: "85%" }}>
                                We just sent a verification code to the email
                                registered with your account
                              </p>
                              <br />
                              <label>Code:</label>
                              <input
                                ref={codeBeingInputtedBox}
                                value={codeBeingInputted}
                                onChange={(e) =>
                                  setCodeBeingInputted(e.target.value)
                                }
                                type="text"
                                className="addUserInput"
                                style={{ marginBottom: "10px" }}
                              />
                              <button
                                className="signOutButton wide"
                                onClick={submitVerificationCode}
                              >
                                Submit
                              </button>
                            </div>
                          ) : (
                            <>
                              <div
                                className="back"
                                onClick={() => back("signInPassword")}
                              >
                                <div className="backTriangle">{"<"}</div>
                                <div>Back</div>
                              </div>
                              <label>Password</label>
                              <input
                                ref={passwordBox}
                                type="password"
                                className="password show"
                                value={passwordBeingAdded}
                                onChange={(e) =>
                                  setPasswordBeingAdded(e.target.value)
                                }
                              />
                              <div
                                className="showButton"
                                onClick={() => showPassword("password")}
                              >
                                Show
                              </div>
                              <button
                                className="submitPassword"
                                onClick={submitPassword}
                              >
                                Sign in
                              </button>

                              <div
                                className="forgotPassword"
                                onClick={() => forgotPassword()}
                              >
                                Forgot Password?
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {isChangingData ? (
                        <div>
                          {dataBeingChanged === "password" ? (
                            <>
                              <div
                                className="back"
                                onClick={() => back("changePassword")}
                              >
                                <div className="backTriangle">{"<"}</div>
                                <div>Back</div>
                              </div>
                              <label className="addUserName">
                                Old Password
                              </label>
                              <input
                                ref={oldPasswordBox}
                                className="addUserInput show"
                                value={oldPassword}
                                type="password"
                                onChange={(e) => setOldPassword(e.target.value)}
                              />
                              <div
                                className="showButton"
                                onClick={() => showPassword("oldPassword")}
                              >
                                Show
                              </div>
                              <label className="addUserName">
                                New Password
                              </label>
                              <input
                                ref={newPasswordBox}
                                className="addUserInput show"
                                value={newPassword}
                                type="password"
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                              <div
                                className="showButton"
                                onClick={() => showPassword("newPassword")}
                              >
                                Show
                              </div>
                              <button
                                className="submitButton"
                                onClick={completeChangePassword}
                              >
                                Submit
                              </button>
                            </>
                          ) : (
                            <div>
                              <div
                                className="back"
                                onClick={() => back("changeEmail")}
                              >
                                <div className="backTriangle">{"<"}</div>
                                <div>Back</div>
                              </div>
                              <label className="addUserName">New email</label>
                              <input
                                ref={newEmailBox}
                                className="addUserInput"
                                value={newEmail}
                                type="text"
                                onChange={(e) => setNewEmail(e.target.value)}
                              />
                              <button
                                className="submitButton"
                                onClick={completeChangeEmail}
                              >
                                Submit
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="header">
                            <h1
                              className="title"
                              style={{ textAlign: "center" }}
                            >
                              Task Tracker
                            </h1>
                            <button
                              className="addUserButton"
                              onClick={() => setIsAddingUser(true)}
                            >
                              Add User
                            </button>
                          </div>
                          <div className="signInUsername">
                            <div className="">
                              <label>Username</label>
                              <input
                                value={username}
                                ref={usernameBox}
                                onChange={(e) => setUsername(e.target.value)}
                                className="addUserInput"
                                type="text"
                              />
                              <button
                                className="submitPassword"
                                onClick={signInUsername}
                              >
                                Sign in
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </>
    </div>
  );
}

export default App;
