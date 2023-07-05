const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, (request, response) => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API1 Returns a list of all movie names in the movie table

const convertDBObjectIntOResponse = (eachMovie) => {
  return {
    movieName: eachMovie.movie_name,
  };
};

app.get("/movies/", async (request, response) => {
  const moviesListQuery = `
    select movie_name from movie;`;
  const moviesList = await db.all(moviesListQuery);
  response.send(
    moviesList.map((eachMovie) => convertDBObjectIntOResponse(eachMovie))
  );
});

//API2 Creates a new movie in the movie table

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postMovieQuery = `Insert into 
    movie (director_id,movie_name,lead_actor)
    values
        ('${directorId}','${movieName}','${leadActor}');`;
  // we use run() as we are changing/updating the database
  const movieAdded = await db.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

//API 3 Returns a movie based on the movie ID

const getMovie = (movie) => {
  return {
    movieId: movie.movie_id,
    directorId: movie.director_id,
    movieName: movie.movie_name,
    leadActor: movie.lead_actor,
  };
};

app.get("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const getMovieWithIDQuery = `
        SELECT *
        FROM 
        MOVIE 
        WHERE 
        movie_id = ${movieId};`;
    const movie = await db.get(getMovieWithIDQuery);
    response.send(getMovie(movie));
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

//API 4 Updates the details of a movie in the movie table based on the movie ID

app.put("/movies/:movieId/", async (request, response) => {
  try {
    const { directorId, movieName, leadActor } = request.body;
    const { movieId } = request.params;
    const updateMovieQuery = `
        UPDATE
             MOVIE
        SET
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        WHERE
            movie_id = ${movieId};`;

    await db.run(updateMovieQuery);
    response.send("Movie Details Updated");
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

// API 5 Deletes a movie from the movie table based on the movie ID

app.delete("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const deleteMovieQuery = `
    DELETE 
        FROM 
        MOVIE
        WHERE
        movie_id = ${movieId};    
    `;
    await db.run(deleteMovieQuery);
    response.send("Movie Removed");
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
});

//API 6 Returns a list of all directors in the director table

const convertDbObjectToResponseObject = (eachDirector) => {
  return {
    directorId: eachDirector.director_id,
    directorName: eachDirector.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const directorsListQuery = `
    SELECT DISTINCT director_id,director_name
    FROM 
    director   
    `;
  const directorsList = await db.all(directorsListQuery);
  response.send(
    directorsList.map((eachDirector) =>
      convertDbObjectToResponseObject(eachDirector)
    )
  );
});

//API 7 Returns a list of all movie names directed by a specific director

const moviesListInReqFormat = (eachMovie) => {
  return {
    movieName: eachMovie.movie_name,
  };
};

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesListByDirectorId = `
        select movie_name
        from 
        movie 
        where director_id = ${directorId};
    `;

  const moviesList = await db.all(getMoviesListByDirectorId);

  response.send(
    moviesList.map((eachMovie) => moviesListInReqFormat(eachMovie))
  );
});

module.exports = app;
