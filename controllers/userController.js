const User = require("../models/User")
const Post = require("../models/Post")

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    // Call the next funciton for this route
    // so, in this case, the next function listed after
    // this one in router.js for the router.get function
    // for the '/create-post' page
    next()
  } else {
    // Show an error if the user is not logged in
    req.flash("errors", "You must be logged in to perform that action")
    // Manually save session data before continuing
    req.session.save(function () {
      // Redirect back to the homepage
      res.redirect("/")
    })
  }
}

exports.login = function (req, res) {
  let user = new User(req.body)
  user
    .login()
    .then(function (result) {
      // Get and store persistent data
      // on user after login using sessions/cookies:
      // the good part is the session number is the only
      // data stored on the users browser
      // the other properties (like username:) are stored in
      // the cloud database
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        firstName: user.data.firstName,
        lastName: user.data.lastName,
        email: user.data.email,
        _id: user.data._id
      }
      req.session.save(function () {
        res.redirect("/")
      })
    })
    .catch(function (error) {
      // will look in req.session.flash.errors = []
      // to display the error message
      req.flash("errors", error)
      req.session.save(function () {
        res.redirect("/")
      })
    })
}

exports.logout = function (req, res) {
  // This will delete the users session cookies
  req.session.destroy(function () {
    res.redirect("/")
    console.log("User.js: user signed out")
  })
}

exports.register = function (req, res) {
  let user = new User(req.body)
  user
    .register()
    .then(() => {
      // Once the user registers, store this into session data:
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        firstName: user.data.firstName,
        lastName: user.data.lastName,
        _id: user.data._id
      }
      req.session.save(function () {
        res.redirect("/")
      })
    })
    .catch((regErrors) => {
      regErrors.forEach(function (error) {
        req.flash("regErrors", error)
      })
      req.session.save(function () {
        res.redirect("/")
      })
    })
}

exports.viewRegisterScreen = function (req, res) {
  res.render("register")
}

exports.home = function (req, res) {
  if (req.session.user) {
    res.render("home-dashboard")
  } else {
    res.render("home-guest", { regErrors: req.flash("regErrors") })
  }
}

exports.ifUserExists = function (req, res, next) {
  User.findByUserName(req.params.username)
    .then(function (userDocument) {
      // store it so the next function can access it:
      req.profileUser = userDocument
      next()
    })
    .catch(function () {
      console.log("userController > ifUserExists")
      res.render("404")
    })
}

// This will be where user-generated things go.
// such as results of quizzes, or budgeting tables.
exports.profilePostsScreen = function (req, res) {
  // Ask our posts/content model for posts/content by a certain user/author/account id
  // it has to take time to go get data from database, so will
  // need it to return a promise:
  Post.findByAuthorId(req.profileUser._id)
    .then(function (posts) {
      // will only be able to render the users account or profile after
      // successfully finding them in database, so inside the
      // then funciton
      res.render("profile", {
        posts: posts,
        profileUsername: req.profileUser.username
        // TODO change this to something i can Get/ReaD FROM DB later
        // right now it's a static href in the .ejs
        // to make it functional, will have to put in
        // <% profileAvatar %> in the profile.ejs or account.ejs whatever
        // i want it to show i
        //profileAvatar: req.profileUser.avatar
      })
    })
    .catch(function () {
      // technical error
      console.log("userController > profilePostsScreen")
      res.render("404")
    })
}
