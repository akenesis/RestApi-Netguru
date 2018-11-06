const helmet = require("helmet");
const express = require("express");
const RequestHandler = require("./RequestHandler");
const bodyParser = require("body-parser");
const { isAlphanumeric } = require("validator");
const { MongoClient, ObjectId } = require("mongodb");
const port = process.env.PORT || 3008;
const requestHandler = new RequestHandler();
const textParser = bodyParser.text();
const _ = require("lodash");

let IDSTATE = [];

const flatten = (arr, result = []) => {
  for (let i = 0, length = arr.length; i < length; i++) {
    const value = arr[i];
    if (Array.isArray(value)) {
      flatten(value, result);
    } else {
      result.push(value);
    }
  }
  return result;
};

const sanitize = text => {
  const commentObj = JSON.parse(text);
  const keys = Object.keys(commentObj);
  const id = keys[0].match(/id/i) ? keys[0] : keys[1];
  const comment = keys[0].match(/comment/i) ? keys[0] : keys[1];
  const sanitizedObject = { id: commentObj[id], comment: commentObj[comment] };

  return sanitizedObject;
};

const populateIds = db => {
  db.collection("EXPIII")
    .find({}, { projection: { _id: 1 } })
    .toArray((err, result) => {
      if (err) throw err;
      IDSTATE = result.map(a => a._id.toString());
      console.log(IDSTATE);
    });
};

const getObjComments = (text, db, callback) => {
  const _id = isValidID(text, db);
  if (_id) {
    db.collection("EXPIII")
      .find({ _id: new ObjectId(_id) })
      .toArray()
      .then(
        doc => {
          if (doc.length) {
            const comments = [doc[0].comment];
            callback(comments);
          }
        },
        err => {
          console.log(err);
        }
      );
  } else {
    console.log(`ha`);
  }
};

const isValidJSON = text => {
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
};

const isValidID = text => {
  // will return a valid mongoDB _id
  const sanitzedObject = sanitize(text);
  // console.log(IDSTATE.includes(sanitzedObject.id));
  // console.log(IDSTATE);

  if (
    isAlphanumeric(sanitzedObject.id) &&
    sanitzedObject.id.length === 24 &&
    sanitzedObject.id.match(/^[0-9a-fA-F]{24}$/) &&
    IDSTATE.includes(sanitzedObject.id)
  ) {
    return new ObjectId(sanitzedObject.id);
  } else {
    return false;
  }
};

const validObjKeys = text => {
  const keyObj = JSON.parse(text);
  const keys = Object.keys(keyObj);
  if (
    (keys[0].match(/id/i) || keys[1].match(/id/i)) &&
    (keys[0].match(/comment/i) || keys[1].match(/comment/i))
  ) {
    return true;
  }
  return false;
};

const postComment = (text, db, res, callback) => {
  const sanitizedObject = sanitize(text);
  getObjComments(text, db, comments => {
    console.log(comments);

    comments = flatten(comments.concat(sanitizedObject.comment));
    console.log(comments);

    db.collection("EXPIII")
      .findOneAndUpdate(
        {
          _id: new ObjectId(sanitizedObject.id)
        },
        {
          $set: {
            comment: comments
          }
        },
        {
          returnOriginal: false
        }
      )
      .then(
        result => {
          callback(...[sanitizedObject.comment, comments, result]);
        },
        err => {
          console.log(err, `Internal server error`);
        }
      );
  });
};

const postMovie = (movieObj, db) => {
  const movieObjWComment = Object.assign({}, movieObj, { comment: [] });
  db.collection("EXPIII").insertOne(movieObjWComment, (err, result) => {
    if (err) {
      return console.error(`Error:`, err);
    }

    IDSTATE.push(result.ops[0]._id.toString());
    console.log(JSON.stringify(result.ops, undefined, 2));
  });
};

const readMovies = db => {
  return new Promise((resolve, reject) => {
    let outerDocs;

    db.collection("EXPIII")
      .find()
      .toArray()
      .then(
        docs => {
          outerDocs = JSON.stringify(docs, undefined, 2);
          console.log(outerDocs);
          resolve(docs);
        },
        err => {
          reject(err);
        }
      );
  });
};

app = express();
app.use(helmet());

MongoClient.connect(
  "mongodb://localhost:27017/EXPIII",
  { useNewUrlParser: true },
  (err, client) => {
    if (err) {
      return console.error(`ERROR:`, err);
    }
    console.log(`Connected to MongoDB server`);
    const db = client.db("EXPIII");

    populateIds(db);

    app.listen(port, () => {
      console.log(`App started on port ${port}`);
    });

    app.get("/", (req, res) => {
      res.send("API up and running");
    });

    // GET /movies:
    // Should fetch list of all movies already present in application database.
    // Additional filtering, sorting is fully optional (BONUS points) ... use query string for sorting ?

    app.get("/movies", (req, res) => {
      let query = req.query;

      readMovies(db).then(
        docs => {
          res.json(docs);
        },

        err => {
          console.log(err);
        }
      );
    });

    // GET /comments:
    // Should fetch list of all comments present in application database.
    // Should allow filtering comments by associated movie, by passing its ID.

    app.get("/comments", (req, res) => {
      db.collection("EXPIII")
        .find({}, { projection: { comment: 1, Title: 1 } })
        .toArray((err, result) => {
          if (err) throw err;

          if (req.query.id) {
            const ID = req.query.id.toString();

            for (let i = 0; i < result.length; i++) {
              if (result[i]["_id"].toString().match(ID)) {
                const comment = result[i]["comment"];
                res.send(comment);
                break;
              }
            }
          } else {
            const comments = result.map(e => e["comment"]);
            res.send(comments);
          }
        });
    });

    // POST /movies:
    // Request body should contain only movie title, and its presence should be validated.
    // Based on passed title, other movie details should be fetched from http://www.omdbapi.com/ (or other similar, public movie database) - and saved to application database.
    // Request response should include full movie object, along with all data fetched from external API.

    app.post("/movies", textParser, (req, res) => {
      if (!req.body) {
        res.status(400).send(`Movie name is required, please re-enter`);
      } else if (req.body.match(/\s/)) {
        const response = req.body.split(/\s+/).join("");
        if (isAlphanumeric(response)) {
          const url = requestHandler.fetchUrl(req.body);
          requestHandler.fetchMovie(url, movieObj => {
            postMovie(movieObj, db);
            res.json(movieObj);
          });
        } else {
          res
            .status(400)
            .send(
              "Invalid movie name: only alpha-numeric characters permitted"
            );
        }
      } else if (isAlphanumeric(req.body)) {
        const url = requestHandler.fetchUrl(req.body);
        requestHandler.fetchMovie(url, movieObj => {
          postMovie(movieObj, db);
          res.json(movieObj);
        });
      } else {
        res
          .status(400)
          .send("Invalid movie name: only alpha-numeric characters permitted");
      }
    });

    // POST /comments:
    // Request body should contain ID of movie already present in database, and comment text body.
    // Comment should be saved to application database and returned in request response.
    // IMPLEMENTED USING JSON. API ACCEPTS JSON STRUCTURE TEXT WITH ID AND COMMENT PROPERTIES

    app.post("/comments", textParser, (req, res) => {
      const text = req.body;
      if (!isValidJSON(text)) {
        res
          .status(400)
          .send(
            `${text}, format is invalid. Please pass text in valid JSON format`
          );
      } else if (!validObjKeys(text)) {
        res
          .status(400)
          .send(
            `Invalid object keys. Please re-enter with proper key/value pair`
          );
      } else if (!isValidID(text)) {
        res.status(400).send(`Invalid movie id. Please re-enter`);
      } else {
        postComment(text, db, res, (newComment, allComments, result) => {
          if (newComment) {
            res.send(newComment);
          }
        });
      }
    });
  }
);

module.exports.app = app;
