const { _ } = require("ajv")
const bcrypt = require("bcryptjs")
const adviserUsersCollection = require("../db").db().collection("adviserUsers")
const validator = require("validator")

let Adviser = function (data, getAvatar) {
  this.data = data
  this.errors = []
  // if the User function is called without the getAvatar parameter
  if (getAvatar == undefined) {
    getAvatar = false
  }
  // if the User function is called with the getAvatar parameter (true)
  if (getAvatar) {
    this.getAvatar()
  }
}

Adviser.prototype.cleanUp = function () {
  // Step 1: Check to see if input is anything other than a string:

  // Username
  if (typeof this.data.username != "string") {
    this.data.username = ""
  }
  // First Name
  if (typeof this.data.firstName != "string") {
    this.data.firstName = ""
  }
  // Last Name
  if (typeof this.data.lastName != "string") {
    this.data.lastName = ""
  }
  // Email
  if (typeof this.data.email != "string") {
    this.data.email = ""
  }
  // Password
  if (typeof this.data.password != "string") {
    this.data.password = ""
  }

  // Step 2: Get rid of any bogus properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    firstName: this.data.firstName.trim(),
    lastName: this.data.lastName.trim(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

Adviser.prototype.validate = function () {
  // Use an arrow function so the "this" keyword points to the correct object
  return new Promise(async (resolve, reject) => {
    // Validate user data

    // Username Validation:
    if (this.data.username == "") {
      // push a new item onto errors array
      this.errors.push("You must provide a username")
    }
    if (this.data.firstName == "") {
      // push a new item onto errors array
      this.errors.push("You must provide a first name")
    }
    if (this.data.lastName == "") {
      // push a new item onto errors array
      this.errors.push("You must provide a last name")
    }
    if (this.data.username.length > 0 && this.data.length < 3) {
      this.errors.push("Username must be at least 3 characters")
    }
    if (this.data.username.length > 30) {
      this.errors.push("Username cannot exceed 30 characters")
    }
    //Name validation
    if (this.data.firstName.length > 0 && this.data.length < 2) {
      this.errors.push("Name must be at least 2 characters")
    }
    if (this.data.firstName.length > 30) {
      this.errors.push("Name cannot exceed 30 characters")
    }
    if (!this.data.firstName == "" && !validator.isAlpha(this.data.firstName)) {
      this.errors.push("Name can only contain alphabetic letters")
    }
    if (this.data.lastName.length > 0 && this.data.length < 2) {
      this.errors.push("Last name must be at least 2 characters")
    }
    if (this.data.lastName.length > 30) {
      this.errors.push("Last name cannot exceed 30 characters")
    }
    if (!this.data.lastName == "" && !validator.isAlpha(this.data.lastName)) {
      this.errors.push("Last name can only contain alphabetic letters")
    }
    // End name validation
    if (!this.data.username == "" && !validator.isAlphanumeric(this.data.username)) {
      this.errors.push("Username can only contain letters and numbers")
    }
    // If the username is valid, then go check db to make sure
    // that it is not already taken:
    if (this.data.username.length && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      let usernameExists = await adviserUsersCollection.findOne({ username: this.data.username })
      if (usernameExists) {
        this.errors.push("Username is unavailable")
      }
    }

    // Email Validation:
    if (this.data.email == "") {
      // push a new item onto errors array
      this.errors.push("You must provide a email")
    }
    // use an email validator to check if the email is valid
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("You must provide a valid email address")
    }
    // If the email is valid, then go check db to make sure
    // that it is not already taken:
    if (validator.isEmail(this.data.email)) {
      let emailExists = await adviserUsersCollection.findOne({ email: this.data.email })
      if (emailExists) {
        this.errors.push("Email is unavailable")
      }
    }

    //Password Validation:
    if (this.data.password == "") {
      // push a new item onto errors array
      this.errors.push("You must provide a password")
    }
    if (this.data.password.length > 0 && this.data.password.length < 8) {
      this.errors.push("Password must be at least 8 characters")
    }
    // using 50 because bcrypt has a max number it will hash before cutoff
    if (this.data.password.length > 50) {
      this.errors.push("Password cannot exceed 50 characters")
    }

    resolve()
  })
}

Adviser.prototype.login = function () {
  // Arrow function: using an arrow function so the "this" reference still points to the correct object
  // only need async here for the inner arrow function where we are awaiting something
  return new Promise(async (resolve, reject) => {
    // Step #1: Validate data
    this.cleanUp()

    // Step #2: Does User Exist?
    // attemptedUser will validate to True if it exists in datbase
    const attemptedAdviserUser = await adviserUsersCollection.findOne({ username: this.data.username })
    // Step 3: Does the password match the one in the database?
    // using bcrypt to hash the entered password and make sure it matches the database hash
    // that way all the hashing goes on behind the scenes of user exp
    if (attemptedAdviserUser && bcrypt.compareSync(this.data.password, attemptedAdviserUser.password)) {
      this.data = attemptedAdviserUser
      this.getAvatar()
      console.log("Adviser.js: Username and password match")
      resolve("Adviser.js: Username and password match")
    } else {
      console.log("Adviser.js: Invalid username / password")
      reject("Adviser.js: Invalid username / password")
    }
  })
}

Adviser.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    // Step #1: Validate data
    this.cleanUp()
    // Use promise to validate data first before proceeding
    await this.validate()

    // Step #2: Only if no validation errors
    // then save user data into a database
    if (!this.errors.length) {
      // Hash User Password:
      let salt = bcrypt.genSaltSync(10)
      // update users password to hash
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await adviserUsersCollection.insertOne(this.data)
      this.getAvatar()
      console.log("adveiserController > register seemed to go through")
      resolve()
    } else {
      console.log("adveiser.js > register failed")
      reject(this.errors)
    }
  })
}

Adviser.prototype.getAvatar = function () {
  // i am just using a static image for everyone
  // maybe find the functionality later of changing the color of the bg.
  this.avatar = `https://i0.wp.com/www.southsideblooms.com/wp-content/uploads/2022/12/blue.jpeg?fit=1536%2C1536&ssl=1`
}

// NOTE: MAY ONLY WANT THIS FUNCTIONALITY FOR USERS TO VIEW THE MAIN ADMIN APP ACCOUNT/PROFILE
Adviser.findByUserName = function (username) {
  return new Promise(function (resolve, reject) {
    if (typeof username != "string") {
      reject()
      // to prevent further execution of this function
      return
    }
    // check to see if there is matching username document
    adviserUsersCollection
      // We are looking for a Document where the Username field matches the data passed through
      .findOne({ username: username })
      // If found, then it will be passed through as UserDoc
      .then(function (userDoc) {
        // 1.) If the userDoc exists (is not empty and therefore = True)
        if (userDoc) {
          // 2.) Then do this:
          // You'll only want to use the data you need, not everything in the userDoc
          // so we make a enw instance of User with the data we pass through
          userDoc = new User(userDoc, true)
          // THESE ARE THE ONLY PROPERTIES THAT WILL GET PASSED BACK INTO THE USER CONTROLLER
          // These are the properties the User will see about the account (likely the admin one)
          // so don't pass unneccessary data
          userDoc = {
            _id: userDoc.data._id,
            username: userDoc.data.username
            // TODO change this to something better later
            // to make it functional, will have to put in (from userController) the variable
            // <% profileAvatar %> in the profile.ejs or account.ejs whatever
            // i want it to show in
            //avatar: userDoc.data.avatar
          }
          // Will want to resolve with a value
          // to put onto the request object so we can find more info on the User requested
          // this data will be passed back into the userController ifUserExists function in this instance
          // for this js class
          resolve(userDoc)
        } else {
          console.log("Adviser.js > Invalid username / password in FindByUsername")
          reject("Adviser.js: Invalid username / password")
        }
      })
      .catch(function () {
        // If it rejects, that is an indicator of a technical error
        console.log("Adviser.js > technical error")
        reject("Adviser.js: technical error")
      })
  })
}

module.exports = Adviser
