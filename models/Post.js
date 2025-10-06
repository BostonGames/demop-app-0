const { ObjectId } = require("mongodb")

const postsCollection = require("../db").db().collection("posts")
// this exports it as a special Object ID object
const objectId = require("mongodb").objectId
const User = require("./User")

let Post = function (data, userid, requestedPostId) {
  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function () {
  if (typeof this.data.title != "string") {
    this.data.title = ""
  }
  if (typeof this.data.customField0 != "string") {
    this.data.customField0 = ""
  }
  if (typeof this.data.customField1 != "string") {
    this.data.customField1 = ""
  }
  if (typeof this.data.customField2 != "string") {
    this.data.customField2 = ""
  }
  if (typeof this.data.body != "string") {
    this.data.body = ""
  }

  //get rid of any bogus properties
  // make this.data exactly what we need it to be
  this.data = {
    title: this.data.title.trim(),
    customField0: this.data.customField0.trim(),
    customField1: this.data.customField1.trim(),
    customField2: this.data.customField2.trim(),
    body: this.data.body.trim(),
    createdDate: new Date(),
    // NOTE: In the class, he uses "author" instead of "createdBy"
    // Also, Mongo db treats user ID # values differently than other
    // data, so will have to process it differently
    // inside the new ObjectId() function.
    createdBy: new ObjectId(this.userid)
  }
}
Post.prototype.validate = function () {
  if (this.data.title == "") {
    this.errors.push("You must provide a title.")
  }
  if (this.data.customField0 == "") {
    this.errors.push("You must provide info in Custom Field 0.")
  }
  if (this.data.customField1 == "") {
    this.errors.push("You must provide info in Custom Field 1.")
  }
  if (this.data.customField2 == "") {
    this.errors.push("You must provide info in Custom Field 2.")
  }
  if (this.data.body == "") {
    this.errors.push("You must write some content to post.")
  }
}

Post.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // Save post into database
      // instertOne() returns a promise
      postsCollection
        .insertOne(this.data)
        // get the newly created id tag for this post
        // so you can use it elsewhere like the postController > create fn
        .then((info) => {
          resolve(info.insertedId)
        })
        .catch(() => {
          this.errors.push("Post.js: error uploading to MongoDB")
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}
Post.prototype.contact = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // Save post into database
      // instertOne() returns a promise
      contactCollection
        .insertOne(this.data)
        // get the newly created id tag for this post
        // so you can use it elsewhere like the postController > create fn
        .then((info) => {
          resolve(info.insertedId)
        })
        .catch(() => {
          this.errors.push("Post.js: error uploading contact attempt to MongoDB")
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      // does post exist?
      let post = await Post.findSingleById(this.requestedPostId, this.userid)
      // are we allowed to edit this as the owner?
      if (post.isVisitorOwner) {
        // update the db
        let status = await this.actuallyUpdate()
        // will use the status from the promise resolving
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}
Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate(
        { _id: new ObjectId(this.requestedPostId) },
        {
          $set: {
            title: this.data.title,
            customField0: this.data.customField0,
            customField1: this.data.customField1,
            customField2: this.data.customField2,
            body: this.data.body
          }
        }
      )
      // the status this promise witll return
      resolve("Success!")
    } else {
      // validation errors
      // the status this promise witll return
      resolve("Failure : (")
    }
  })
}

// for the class, he made this to use on all posts, but
// I will have different stuff I'm looking up so I left the
// findSingleById funciton alone and did not implement this part into that fn
// main difference is this one searches by username, and findSingleById searches by
// user _id:
Post.reusablePostQuery = function (uniqueOperations, visitorId) {
  return new Promise(async function (resolve, reject) {
    // concat going to return a new array and add that onto the original array
    let aggOperations = uniqueOperations.concat([
      // pull in relevant user account document
      // we want to pull a document FROM the 'users'
      // collection in Mongo DB
      // we want the createdBy (username/author name) field in the local, or 'posts' collection
      // and we want the _id: field in the Foriegn, or 'users' collection
      // NOTE: he used 'authorDocument' in the js class video
      { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "creatorDocument" } },
      // $project allows us to choose what fields we want the return data (pulled by aggregate) to contain
      {
        $project: {
          // 1 = yes, include
          title: 1,
          customField0: 1,
          customField1: 1,
          customField2: 1,
          body: 1,
          createdDate: 1,
          // in mongoDB, when you use a dollar sign $
          // mongo knows it is for the Field name, not a string of text
          createdByThisUserId: "$createdBy",
          // we want createdBy to contain everything in that creator document
          // we want the creator object to include the user's username, their
          // avatar, and whatever else we want in that doc
          // we know there is only ever going to be one creator document, so we
          // will only ever return the first item in the array aggregate returns
          // for this case. so we use 0 for the first item in the array
          createdBy: { $arrayElemAt: ["$creatorDocument", 0] }
        }
      }
    ])
    let posts = await postsCollection
      // aggregate operations will return data to use from the user document for the _id: we want to match:
      .aggregate(aggOperations)
      .toArray()

    // clean up createdBy: property in each post object
    posts = posts.map(function (post) {
      // the .equals() will give a true or false value
      // if the
      post.isVisitorOwner = post.createdByThisUserId.equals(visitorId)
      console.log("Post.js > reusablePostQuery > isVisitorOwner = " + post.isVisitorOwner)
      post.createdBy = {
        username: post.createdBy.username,
        avatar: new User(post.author, true).avatar
      }

      // everything before this is essentially manipulating 'post'
      return post
    })

    resolve(posts)
  })
}

// We are storing properties to our Post function by adding
// them on with a "."
Post.findSingleById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    // if it's not a string or valid ID
    if (typeof id != "string" || !ObjectId.isValid(id)) {
      reject()
      // prevent any further execution of this function
      return
    }
    let posts = await postsCollection
      // aggregate operations will return data to use from the user document for the _id: we want to match:
      .aggregate([
        // find the users ID
        { $match: { _id: new ObjectId(id) } },
        // pull in relevant user account document
        // we want to pull a document FROM the 'users'
        // collection in Mongo DB
        // we want the createdBy (username/author name) field in the local, or 'posts' collection
        // and we want the _id: field in the Foriegn, or 'users' collection
        // NOTE: he used 'authorDocument' in the js class video
        { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "creatorDocument" } },
        // $project allows us to choose what fields we want the return data (pulled by aggregate) to contain
        {
          $project: {
            // 1 = yes, include
            title: 1,
            customField0: 1,
            customField1: 1,
            customField2: 1,
            body: 1,
            createdDate: 1,
            // in mongoDB, when you use a dollar sign $
            // mongo knows it is for the Field name, not a string of text
            createdByThisUserId: "$createdBy",
            // we want createdBy to contain everything in that creator document
            // we want the creator object to include the user's username, their
            // avatar, and whatever else we want in that doc
            // we know there is only ever going to be one creator document, so we
            // will only ever return the first item in the array aggregate returns
            // for this case. so we use 0 for the first item in the array
            createdBy: { $arrayElemAt: ["$creatorDocument", 0] }
          }
        }
      ])
      .toArray()

    // clean up createdBy: property in each post object
    posts = posts.map(function (post) {
      // the .equals() will give a true or false value
      // if the
      post.isVisitorOwner = post.createdByThisUserId.equals(visitorId)
      console.log("Post.js > findSingleById > isVisitorOwner = " + post.isVisitorOwner)

      post.createdBy = {
        username: post.createdBy.username,
        avatar: new User(post.author, true).avatar
      }

      // everything before this is essentially manipulating 'post'
      return post
    })

    // if a post is found, "post" will not be false and can continue
    if (posts.length) {
      // this shows the data it pulls from the users document in the collection on Mongo DB"
      console.log(posts[0])
      // resolve with a value of the 'post' document
      resolve(posts[0])
    } else {
      // if there is no post with the requested id:
      reject()
    }
  })
}

// in this class he uses authorId, and I use "creadedBy" in the db
Post.findByAuthorId = function (createdBy) {
  return Post.reusablePostQuery([
    { $match: { createdBy: createdBy } },
    // want to sort so that newest posts are at the top
    // 1 to sort oldest, -1 for newest first
    { $sort: { createdDate: -1 } }
  ])
}

Post.delete = function (postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId)
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({ _id: new ObjectId(postIdToDelete) })
        resolve()
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

module.exports = Post
