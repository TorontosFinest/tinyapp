const express = require("express");
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const { getUserByEmail } = require("./helpers");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const cookieSession = require("cookie-session");
app.use(
  cookieSession({
    name: "session",
    secret: "dwajdjgjwajdwajawj",
    maxAge: 24 * 60 * 60 * 1000,
  })
);
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

  hi: {
    id: "hi",
    email: "hi@hi.com",
    password: "hi",
  },
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  if (!users[req.session["user_id"]]) {
    console.log("must be logged in to see!");
    res.redirect("/login");
  } else {
    const user = req.session["user_id"];
    const templateVars = {
      user,
      urls: urlsForUser(user),
      user: users[req.session["user_id"]],
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls", (req, res) => {
  if (!users[req.session["user_id"]]) {
    console.log("must be logged in to see!");
    res.redirect("/login");
  } else {
    const user = req.session["user_id"];
    const templateVars = {
      user,
      urls: urlsForUser(user),
      user: users[req.session["user_id"]],
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session["user_id"]] };
  res.render("register", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.status(403).redirect("/login");
  }
  let templateVars = { urls: urlDatabase, user: users[req.session["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  if (!urlDatabase[short]) {
    res.redirect("/urls/");
  } else {
    let longURL = urlDatabase[short].longURL;
    res.redirect(longURL);
  }
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session["user_id"]] };
  res.render("login", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    return res.send(404);
  }

  if (req.session["user_id"] !== urlDatabase[shortURL]["userID"]) {
    return res.status(403).send("user can only see their own urls");
  }
  let longURL = urlDatabase[shortURL]["longURL"];
  let templateVars = {
    shortURL: shortURL,
    longURL: longURL,
    user: users[req.session["user_id"]],
  };
  res.render("urls_show", templateVars);
});
// POSTS
app.post("/urls", (req, res) => {
  if (!users[req.session["user_id"]]) {
    console.log("must be logged in to post!");
    res.redirect("/login");
  } else {
    let url = generateRandomString();
    let result = req.body.longURL;
    urlDatabase[url] = {
      longURL: result,
      shortURL: url,
      userID: req.session["user_id"],
    };
    res.redirect("/urls/");
  }
});

app.post("/urls/:id", (req, res) => {
  const user = req.session["user_id"];
  if (user === urlDatabase[req.params.id].userID) {
    const longURL = req.body.longURL;
    urlDatabase[req.params.id]["longURL"] = longURL;
    res.redirect("/urls/");
  } else {
    res.send(403, "cannot modify/delete  links that arent yours");
  }
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;
  const trimPass = password.trim();
  if (email === "" || password === "") {
    console.log("please fill out all fields");
    res.status(400).redirect("/register");
  } else if (getUserByEmail(email, users)) {
    console.log("user in system");
    res.status(400).redirect("/register");
  } else {
    let hashedPassword = bcrypt.hashSync(trimPass, 10);
    users[id] = {
      id: id,
      email: email,
      password: hashedPassword,
    };

    req.session["user_id"] = id;
    res.redirect("/urls");
  }
});
app.post("/urls/:shortURL/delete", (req, res) => {
  let short = req.params.shortURL;
  let id = req.session["user_id"];
  if (id === urlDatabase[short].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls/");
  } else {
    res.status(403).send("Do not have permissions to delete this");
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const trimPass = password.trim();
  const user = getUserByEmail(email, users);
  const hashedpass = bcrypt.hashSync(trimPass, 10);
  if (email === "" && password === "") {
    console.log("Please enter all fields");
    res.redirect("/login");
  }
  console.log(user);
  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      console.log("successful login");
      req.session["user_id"] = user.id;
      res.redirect("/urls");
    } else {
      console.log("failed login, incorrect credentials");
      res.status(403).redirect("/login");
    }
  } else {
    res.status(403).redirect("/login");
  }
});
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
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

function urlsForUser(id) {
  const obj = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      obj[key] = urlDatabase[key];
    }
  }
  return obj;
}
