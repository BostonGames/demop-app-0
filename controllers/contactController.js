const Contact = require("../models/Contact")

exports.viewContactScreen = function (req, res) {
  res.render("contact", { errors: req.flash("errors"), success: req.flash("success") })
}

exports.viewContactSentScreen = function (req, res) {
  res.render("contact-sent", { errors: req.flash("errors"), success: req.flash("success") })
}

exports.sendContactRequest = function (req, res) {
  // req.body will contain the info we passed through the form
  let contact = new Contact(req.body)
  contact
    .sendContactRequest()
    .then(function () {
      req.flash("success", "New contact request sent!")
      req.session.save(function () {
        res.redirect(`/contact-sent`)
      })
    })
    .catch(function (errors) {
      res.send(errors)
    })
}

// // req.body will contain the info we passed through the form
// let contact = new Contact(req.body)
// contact.sendContactRequest()
// if (contact.errors.length) {
//   res.send(contact.errors)
// } else {
//   res.send("Congrats, there are no errors.")
// }

// let contact = new Contact(req.body)
// contact
//   .sendContactRequest()
//   .then(() => {
//     // Once the user registers, store this into session data:
//     req.flash("errors", errors)
//     console.log("THEN BLOCK Test error message deleteme in contactController.")
//     req.session.save(function () {
//       res.redirect("/contact")
//     })
//   })
//   .catch((errors) => {
//     console.log("CATCH BLOCK Test error message deleteme in contactController.")
//     req.flash("errors", errors)
//     errors.forEach(function (error) {
//       req.flash("errors", error)
//     })
//     req.session.save(function () {
//       // this will not run until the session data has had a chance to
//       // complete in the daatabase
//       res.redirect("/contact")
//     })
//   })
