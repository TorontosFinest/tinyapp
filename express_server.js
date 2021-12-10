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

// this is the default or root home page. if user isnt logged in, redirect to login.
app.get("/", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.redirect("/login");
  } else {
    // else , create a session and pass the variables ( user , their urls, and session) to the index template
    const user = req.session["user_id"];
    const templateVars = {
      user,
      urls: urlsForUser(user),
      user: users[req.session["user_id"]],
    };
    res.render("urls_index", templateVars);
  }
});

// if user isnt logged in then send respective error.
app.get("/urls", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.status(403).send("user must be logged in to view urls");
  } else {
    // render the info of corresponding user
    const user = req.session["user_id"];
    const templateVars = {
      user,
      urls: urlsForUser(user),
      user: users[req.session["user_id"]],
    };
    res.render("urls_index", templateVars);
  }
});

// if there isnt anyone logged in , complete the registration. else, redirect to urls
app.get("/register", (req, res) => {
  if (!users[req.session["user_id"]]) {
    let templateVars = { user: users[req.session["user_id"]] };
    res.render("register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

// if there isnt anynone logged in, send error and redirect to login
app.get("/urls/new", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.status(403).redirect("/login");
  } // else, render the users urls
  let templateVars = { urls: urlDatabase, user: users[req.session["user_id"]] };
  res.render("urls_new", templateVars);
});
// if the url isnt in the database, send error. else, redirect to the long url's destination.
app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  if (!urlDatabase[short]) {
    res.status(404).send(" url does not exist");
  } else {
    let longURL = urlDatabase[short].longURL;
    res.redirect(longURL);
  }
});

// if there isnt anyone logged in, render the login. else, if they are, redirect to /urls
app.get("/login", (req, res) => {
  if (!users[req.session["user_id"]]) {
    let templateVars = { user: users[req.session["user_id"]] };
    res.render("login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  // if short doesnt exist, throw error
  if (!urlDatabase[shortURL]) {
    return res.status(400).send("url does not exist");
  }
  // if the user is trying to view a url that doesnt belong to them, throw error
  if (req.session["user_id"] !== urlDatabase[shortURL]["userID"]) {
    return res.status(403).send("user can only see their own urls");
  }
  // else if all above isnt the case, render the info to show template
  let longURL = urlDatabase[shortURL]["longURL"];
  let templateVars = {
    shortURL: shortURL,
    longURL: longURL,
    user: users[req.session["user_id"]],
  };
  res.render("urls_show", templateVars);
});
// POSTS
// if there isnt an active session ( someone logged in ), throw error
app.post("/urls", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.status(400).send("must be logged in");
  } else {
    // else, create a new random Id, and a new post in the database, then redirect to urls.
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

// if user is logged in, allow them to edit. else, throw error
app.post("/urls/:id", (req, res) => {
  const user = req.session["user_id"];
  if (user === urlDatabase[req.params.id].userID) {
    const longURL = req.body.longURL;
    urlDatabase[req.params.id]["longURL"] = longURL;
    res.redirect("/urls/");
  } else {
    res.status(400).send("forbidden access");
  }
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;
  const trimPass = password.trim();
  if (email === "" || password === "") {
    res.status(400).send("fields cannot be empty when registering");
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("user is already in the system, go to login.");
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
// if user is logged in and OWNS the url, then let them delete. else, throw error.
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
  // set variables from the login
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  // if either of the fields are empty, throw error
  if (email === "" && password === "") {
    res.status(404).send("both fields must be filled in");
  }
  // if the user has been found, then compare passwords.
  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      // if they match, set session and redirect to urls
      req.session["user_id"] = user.id;
      res.redirect("/urls");
    } else {
      // credentials were wrong
      res.status(403).send("failed login, please enter correct credentials");
    }
  } else {
    // user isnt in system.
    res.status(404).send("user does not exist, create a user.");
  }
});
// to logout, first set session to null then reddirect.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//function to create random string of length 6
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

// function that returns all the urls for the current user;
function urlsForUser(id) {
  const obj = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      obj[key] = urlDatabase[key];
    }
  }
  return obj;
}
