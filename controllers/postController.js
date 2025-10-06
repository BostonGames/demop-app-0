const Post = require("../models/Post")

exports.viewCreateScreen = function (req, res) {
  res.render("create-post")
}

exports.create = function (req, res) {
  // Pass in data into the Post request
  // notice that there are the same number of parameters as
  // the Post anonymous function in Post.js
  // just for reference on how the data passes through
  // and gets defined
  let post = new Post(req.body, req.session.user._id)
  post
    .create()
    .then(function (newId) {
      req.flash("success", "Post Created.")
      req.session.save(function () {
        res.redirect(`/post/${newId}`)
      })
    })
    .catch(function (errors) {
      errors.forEach((error) => req.flash("errors", error))
      req.session.save(function () {
        res.redirect(`/create-post`)
      })
    })
}

// contact
exports.createContact = function (req, res) {
  // Pass in data into the Post request
  // notice that there are the same number of parameters as
  // the Post anonymous function in Post.js
  // just for reference on how the data passes through
  // and gets defined
  let post = new Post(req.body, req.session.user._id)
  post
    .create()
    .then(function (newId) {
      req.flash("success", "Contact request sent.")
      req.session.save(function () {
        res.redirect(`/contact`)
      })
    })
    .catch(function (errors) {
      errors.forEach((error) => req.flash("errors", error))
      req.session.save(function () {
        res.redirect(`/contact`)
      })
    })
}

exports.viewSingle = async function (req, res) {
  try {
    // The 'id' part in req.params.id corresponds to
    // the :id dynamic part in router.js where it says
    // router.get("/post/:id", etc...
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    //
    res.render("single-post-screen", { post: post })
  } catch {
    console.log("postController > viewSingle catch block")

    res.render("404")
  }
}

exports.viewEditScreen = async function (req, res) {
  try {
    // ask for data for relevant post;
    // whatever promise this resolves to will be the post we are interested in
    // so make it a variable:
    let post = await Post.findSingleById(req.params.id, req.visitorId)

    // TODO: CAN MAKE CERTAIN PAGES UNAVAILABLE TO NON-CREATORS OR ADMIN ONLY THIS WAY. USE METHOD.
    //only creator can get to edit screen:
    // OLD LINE: if (post.createdByThisUserId == req.visitorId) {
    if (post.isVisitorOwner) {
      //render edit screen template
      res.render("edit-post", { post: post })
    } else {
      req.flash("errors", "Action denied.")
      req.session.save(function () {
        res.redirect("/")
      })
    }
  } catch {
    console.log("postController > viewEditScreen catch block")
    res.render("404")
  }
}

exports.edit = function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id)
  post
    .update()
    // TODO: TEST WHY THIS ISNT WORKING, NO FLASH MESSAGES SHOW. DO CONSOLE LOGS ON THE STATUS OR SOMETHING
    .then((status) => {
      if (status == "success") {
        // post successfully updated in db
        req.flash("success", "Updates Complete.")
        req.session.save(function () {
          // the id of the post they were trying to edit
          res.redirect(`/post/${req.params.id}/edit`)
        })
      } else {
        // user had permissions to edit but had validation errors
        post.errors.forEach(function (error) {
          req.flash("errors", error)
        })
        req.session.save(function () {
          // the id of the post they were trying to edit
          res.redirect(`/post/${req.params.id}/edit`)
        })
      }
    })

    .catch(() => {
      // if a post w requested id doesnt exist
      // or if visitor is not owner of the requested post
      req.flash("errors", "Action denied.")
      req.session.save(function () {
        res.redirect("/")
      })
    })
}

exports.delete = function (req, res) {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash("success", "Post successfully deleted.")
      req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
    })
    .catch(() => {
      req.flash("errors", "Action denied.")
      req.session.save(() => res.redirect("/"))
    })
}
