// const does not allow it to be reassigned anywhere else. we want this here.
const express = require("express")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const flash = require("connect-flash")
const app = express()

let sessionOptions = session({
  secret: "some secret string",
  store: MongoStore.create({ client: require("./db") }),
  resave: false,
  saveUninitialized: false,
  // Having sameSite: "strict" protects against CSRF attacks
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, sameSite: "strict" }
})

app.use(sessionOptions)
app.use(flash())

// Telling express to run this function before every request
// so the session data is available in all of our ejs templates
app.use(function (req, res, next) {
  // make all error/success flash messages available from all templates
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")

  // make current user id available on the req(esting) object
  // so can track who is doing what
  if (req.session.user) {
    req.visitorId = req.session.user._id
  } else {
    req.visitorId = 0
  }

  // make user session data available from within View templates
  res.locals.user = req.session.user
  next()
})

const router = require("./router")

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static("public"))
app.set("views", "views")
app.set("view engine", "ejs")

app.use("/", router)

module.exports = app
