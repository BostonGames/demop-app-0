const { _ } = require("ajv")
const contactCollection = require("../db").db().collection("contact-messages")
const validator = require("validator")

let Contact = function (data) {
  this.data = data
  this.errors = []
}

Contact.prototype.cleanUp = function () {
  // for Contact attempts
  if (typeof this.data.emailContact != "string") {
    this.data.emailContact = ""
  }
  if (typeof this.data.firstName != "string") {
    this.data.firstName = ""
  }
  if (typeof this.data.lastName != "string") {
    this.data.lastName = ""
  }
  if (typeof this.data.topic != "string") {
    this.data.topic = ""
  }
  if (typeof this.data.contactSource != "string") {
    this.data.contactSource = ""
  }
  if (typeof this.data.contactMessage != "string") {
    this.data.contactMessage = ""
  }
  //get rid of any bogus properties
  // make this.data exactly what we need it to be
  this.data = {
    emailContact: this.data.emailContact.trim(),
    firstName: this.data.firstName.trim(),
    lastName: this.data.lastName.trim(),
    topic: this.data.topic.trim(),
    contactSource: this.data.contactSource.trim(),
    contactMessage: this.data.contactMessage.trim(),
    contactDate: new Date()
  }
}

Contact.prototype.validate = function () {
  // Validate email
  if (this.data.emailContact == "") {
    this.errors.push("You must provide an email.")
  }
  // use an email validator to check if the email is valid
  if (!validator.isEmail(this.data.emailContact)) {
    this.errors.push("You must provide a valid email address")
  }
  // Validate Name
  if (this.data.firstName.length == 1) {
    this.errors.push("Name must be at least 2 characters")
  }
  if (this.data.firstName.length > 30) {
    this.errors.push("Name cannot exceed 30 characters")
  }
  if (!this.data.firstName == "" && !validator.isAlpha(this.data.firstName)) {
    this.errors.push("Name can only contain alphabetic letters")
  }
  if (this.data.firstName == "") {
    this.errors.push("You must provide a first name")
  }
  if (this.data.lastName.length == 1) {
    this.errors.push("Last name must be at least 2 characters")
  }
  if (this.data.lastName.length > 30) {
    this.errors.push("Last name cannot exceed 30 characters")
  }
  if (!this.data.lastName == "" && !validator.isAlpha(this.data.lastName)) {
    this.errors.push("Last name can only contain alphabetic letters")
  }
  if (this.data.lastName == "") {
    this.errors.push("You must provide a last name")
  }

  if (this.data.contactSource == "") {
    this.errors.push("You must provide a source of contact.")
  }
  if (this.data.contactMessage == "") {
    this.errors.push("You must write a message.")
  }
}

Contact.prototype.sendContactRequest = function () {
  return new Promise((resolve, reject) => {
    // Step #1: Validate user data
    this.cleanUp()
    this.validate()

    if (!this.errors.length) {
      // Save contact message to db
      contactCollection
        .insertOne(this.data)
        .then(() => {
          resolve()
        })
        .catch(() => {
          this.errors.push("Please try again later.")
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}

//   // Step #1: Validate user data
//   this.validate()
//   this.cleanUp()

//   // Step #2: Only if there are no validation errors
//   // then save the user data into a database
//   if (!this.errors.length) {
//     contactCollection.insertOne(this.data)
//   }

//   return new Promise(async (resolve, reject) => {
//     // Step #1: Validate data
//     this.cleanUp()
//     // Use promise to validate data first before proceeding
//     await this.validate()

//     // Step #2: Only if no validation errors
//     // then save user data into a database
//     if (!this.errors.length) {
//       await contactCollection.insertOne(this.data)
//       resolve()
//     } else {
//       reject(this.errors)
//     }
//   })

module.exports = Contact
