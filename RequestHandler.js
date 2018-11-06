// const request = require("request");
/*Initial version using e6 classes 
*/
// class RequestHandler {
//   constructor() {
//     this.api = "http://www.omdbapi.com/?t=";
//     this.apiKey = "&apikey=dc9d40a4";
//   }

//   fetch(movieTitle) {
//     let regex = / /gi;
//     movieTitle = movieTitle.replace(regex, "+");
//     let url = this.api.concat(movieTitle, this.apiKey);
//     request(
//       {
//         url,
//         json: true
//       },
//       (error, response, body) => {
//         if (error) {
//           console.log("Error: Unable to connect to server");
//         } else if (body["Error"]) {
//           console.log("Error: movie not found");
//         } else {
//           console.log(body);
//         }
//       }
//     );
//   }
// }

/* Version 2 using Async functions */

// const RequestHandler = (movieName, callback) => {
//   const api = "http://www.omdbapi.com/?t=";
//   const apiKey = "&apikey=dc9d40a4";

//   const fetch = (movieName, callback) => {
//     const regex = /\s/gi;
//     const encodedMovieName = movieName.replace(regex, "+");
//     const url = api.concat(encodedMovieName, apiKey);

//     request({ url, json: true }, (error, response, body) => {
//       if (error) {
//         callback(`Error: unable to connect to server`);
//       } else if (body["Error"]) {
//         callback("Error: movie not found");
//       } else {
//         console.log(body);
//         callback(undefined, body);
//       }
//     });
//   };

//   fetch(movieName, callback);
// };

/* Version 3 using promises */

// const RequestHandler = movieName => {
//   const api = "http://www.omdbapi.com/?t=";
//   const apiKey = "&apikey=dc9d40a4";
//   const regex = /\s/gi;
//   const encodedMovieName = movieName.replace(regex, "+");
//   const url = api.concat(encodedMovieName, apiKey);

//   return new Promise((resolve, reject) => {
//     request({ url, json: true }, (error, response, body) => {
//       if (error || body["Error"]) {
//         reject(error ? error : body["Error"]);
//       }
//       resolve(body);
//     });
//   });
// };
const axios = require("axios");

class RequestHandler {
  constructor() {
    this.api = "http://www.omdbapi.com/?t=";
    this.apiKey = "&apikey=dc9d40a4";
    this.movieObj = null;
    this.fetchUrl = this.fetchUrl.bind(this);
    this.fetchMovie = this.fetchMovie.bind(this);
  }

  fetchUrl(movieName) {
    const regex = /\s/gi;
    const encodedMovieName = movieName.replace(regex, "+");
    const url = this.api.concat(encodedMovieName, this.apiKey);
    return url;
  }

  fetchMovie(url, callback) {
    axios
      .get(url)
      .then(response => {
        const movieObj = response.data;
        callback(movieObj);
      })
      .catch(e => console.log("error"));
  }
}

module.exports = RequestHandler;
