const express = require("express")

const router = express.Router()
const userController = require("./controllers/userController")
const postController = require("./controllers/postController")
const contactController = require("./controllers/contactController")

// USER-RELATED ROUTES:
router.get("/", userController.home)
router.get("/register", userController.viewRegisterScreen)
router.post("/register", userController.register)
router.post("/login", userController.login)
router.post("/logout", userController.logout)

// Account/Profile Related Routes:
router.get("/profile/:username", userController.ifUserExists, userController.profilePostsScreen)

// POST-RELATED ROUTES:
router.get("/create-post", userController.mustBeLoggedIn, postController.viewCreateScreen)
router.post("/create-post", userController.mustBeLoggedIn, postController.create)
// TO VIEW A PUBLIC POST: if you remove the userController.mustBeLoggedIn,
// then anyone (non-users) can see the post as well.
// The colon ":" will allow us to place something flexible inside
router.get("/post/:id", postController.viewSingle)
router.get("/post/:id/edit", userController.mustBeLoggedIn, postController.viewEditScreen)
router.post("/post/:id/edit", userController.mustBeLoggedIn, postController.edit)
router.post("/post/:id/delete", userController.mustBeLoggedIn, postController.delete)

// CONTACT-REQUEST ROUTES
router.get("/contact", contactController.viewContactScreen)
router.post("/contact", contactController.sendContactRequest)
router.get("/contact-sent", contactController.viewContactSentScreen)

// THIS WILL BE FOR POSTS SENT TO THE ADVISOR ACCOUNT
// router.get("/privatePost/:id", userController.mustBeLoggedIn, postController.viewSingle)

module.exports = router
