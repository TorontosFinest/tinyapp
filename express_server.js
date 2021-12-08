const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  var short = req.params.shortURL;
  let longURL = urlDatabase[short];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = urlDatabase[shortURL];
  let templateVars = {
    shortURL: shortURL,
    longURL: longURL,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});
// POSTS
app.post("/urls", (req, res) => {
  let url = generateRandomString();
  let result = req.body.longURL;
  urlDatabase[url] = result;
  res.redirect("/urls/");
});

app.post("/urls/:id", (req, res) => {
  const longURL = req.body.longURL;
  urlDatabase[req.params.id] = longURL;
  res.redirect("/urls/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;

  if (email === "" || password === "") {
    console.log("please fill out all fields");
    res.status(400).redirect("/register");
  } else if (getUserEmail(email)) {
    console.log("user in system");
    res.status(400).redirect("/register");
  } else {
    users[id] = {
      id: id,
      email: email,
      password: password,
    };

    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls/");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

function generateRandomString() {
  var randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var result = "";
  for (var i = 0; i < 6; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
}

function getUserEmail(email) {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return false;
}
