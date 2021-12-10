const { assert } = require("chai");

const { getUserByEmail } = require("../helpers.js");

const testUsers = {
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

describe("getUserByEmail", function () {
  it("should return a user with valid email", function () {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it("should return false when user cant be found", () => {
    const user = getUserByEmail("dadad@naada.com", testUsers);
    const expectedOutput = undefined;
    assert.isUndefined(user, expectedOutput);
  });

  it("should return false when email is empty", () => {
    const user = getUserByEmail("", testUsers);
    const expectedOutput = undefined;
    assert.isUndefined(user, expectedOutput);
  });
});
