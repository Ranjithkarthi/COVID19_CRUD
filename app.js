const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    consloe.log(`Db Error:${e.message}`);
  }
};

initializeDbAndServer();

const convertToCamelCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//1 get all states
app.get("/states/", async (request, response) => {
  try {
    const dbQuery = "SELECT * FROM state;";
    const dbResponse = await db.all(dbQuery);
    response.send(dbResponse.map((eachArray) => convertToCamelCase(eachArray)));
  } catch (e) {
    console.error(`Db Error: ${e.message}`);
  }
});

//2 get State based On stateId
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const dbQuery = `SELECT * FROM state
    WHERE state_id = ${stateId};`;
  const dbResponse = await db.get(dbQuery);
  response.send(convertToCamelCase(dbResponse));
});

//3 post new row in district table
app.post("/districts/", async (request, response) => {
  try {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const dbQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
            VALUES (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
            );`;
    await db.run(dbQuery);
    response.send("District Successfully Added");
  } catch (error) {
    console.error(`Post Error: ${error.message}`);
  }
});

//District CamelCase conversion
const convertDistrictCamelCase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//4 return district based on districtId
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dbQuery = `SELECT * FROM district
    WHERE district_id = ${districtId}`;
  const dbResponse = await db.get(dbQuery);
  response.send(convertDistrictCamelCase(dbResponse));
});

//5 Delete row from district using id
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dbQuery = `DELETE FROM district 
    WHERE district_id = ${districtId};`;
  await db.run(dbQuery);
  response.send("District Removed");
});

//6 Update district by id
app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const dbQuery = `UPDATE district
            SET 
            district_name='${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
            WHERE district_id = ${districtId};`;
    await db.run(dbQuery);
    response.send("District Details Updated");
  } catch (error) {
    console.error(`put Error: ${error.message}`);
  }
});

//7 get sum of district details
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const dbQuery = `SELECT 
    SUM(cases) as totalCases,
    SUM(cured) as totalCured, 
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM district
    WHERE state_id = ${stateId}`;
  const dbResponse = await db.get(dbQuery);
  response.send(dbResponse);
});

const convertStateNameCase = (dbObj) => {
  return {
    stateName: dbObj.state_name,
  };
};

//8 get state Name
app.get("/districts/:districtId/details/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const dbQuery = `
    SELECT state_name from state
    NATURAL JOIN district
    WHERE district_id = ${districtId};`;

    const dbResponse = await db.get(dbQuery);
    response.send(convertStateNameCase(dbResponse));
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
});

module.exports = app;
