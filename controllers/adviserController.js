const Adviser = require("../models/Adviser")

exports.viewAdviserLoginScreen = function (req, res) {
  res.render("adviser-login")
}

exports.viewAdviserRegisterScreen = function (req, res) {
  res.render("adviser-register")
}

exports.viewError404Screen = function (req, res) {
  res.render("4040")
}

exports.viewAdviserDashboardScreen = function (req, res) {
  res.render("home-adviser-dashboard")
}

exports.home = function (req, res) {
  if (req.session.adviserUser) {
    res.render("home-adviser-dashboard")
  } else {
    res.render("adviser-login", { regErrors: req.flash("regErrors") })
  }
}

exports.login = function (req, res) {
  let adviserUser = new Adviser(req.body)
  adviserUser
    .login()
    .then(function (result) {
      // Get and store persistent data
      // on user after login using sessions/cookies:
      // the good part is the session number is the only
      // data stored on the users browser
      // the other properties (like username:) are stored in
      // the cloud database
      req.session.adviserUser = {
        avatar: adviserUser.avatar,
        username: adviserUser.data.username,
        firstName: adviserUser.data.firstName,
        lastName: adviserUser.data.lastName,
        email: adviserUser.data.email,
        _id: adviserUser.data._id
      }
      req.session.save(function () {
        req.flash("success", "adviserController: adviser was logged in succesfully")
        console.log("adveiserController > login was succcessful")
        res.redirect("/home-adviser-dashboard")
      })
    })
    .catch(function (error) {
      // will look in req.session.flash.errors = []
      // to display the error message
      req.flash("errors", error)
      req.session.save(function () {
        console.log("adveiserController > login was not successful")
        res.redirect("/adviser-login")
      })
    })
}

exports.logout = function (req, res) {
  // This will delete the users session cookies
  req.session.destroy(function () {
    res.redirect("/adviser-login")
    console.log("User.js: user signed out")
  })
}

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.adviserUser) {
    // Call the next funciton for this route
    // so, in this case, the next function listed after
    // this one in router.js for the router.get function
    // for the '/create-post' page
    next()
  } else {
    // Show an error if the user is not logged in
    req.flash("errors", "You must be logged in as an Adviser to perform that action")
    // Manually save session data before continuing
    req.session.save(function () {
      // Redirect back to the homepage
      res.redirect("adviser-login")
    })
  }
}

exports.adviserRegister = function (req, res) {
  let adviserUser = new Adviser(req.body)
  adviserUser
    .register()
    .then(() => {
      // Once the adviserUser registers, store this into session data:
      req.session.adviserUser = {
        avatar: adviserUser.avatar,
        username: adviserUser.data.username,
        firstName: adviserUser.data.firstName,
        lastName: adviserUser.data.lastName,
        _id: adviserUser.data._id
      }
      req.session.save(function () {
        res.redirect("/home-adviser-dashboard")
      })
    })
    .catch((regErrors) => {
      regErrors.forEach(function (error) {
        req.flash("regErrors", error)
      })
      req.session.save(function () {
        res.redirect("/adviser-register")
      })
    })
}

exports.ifUserExists = function (req, res, next) {
  Adviser.findByUserName(req.params.username)
    .then(function (userDocument) {
      // store it so the next function can access it:
      req.profileUser = userDocument
      next()
    })
    .catch(function () {
      console.log("adveiserController > ifUserExists")
      res.render("404")
    })
}
