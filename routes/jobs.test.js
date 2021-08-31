"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    "title": "newJob",
    "salary": 30000,
    "equity": 0,
    "companyHandle": "c3"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      "job": {
          title: "newJob",
          salary: 30000,
          equity: "0",
          companyHandle: "c3",
        }
    });
  });

  test("unauth for u2", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "Farmer",
        salary: 50000,
        equity: "0"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      "companies": [
        {
          title: "Farmer",
          salary: 50000,
          equity: "0",
          company_handle: "c1",
        },
        {
          title: "Engineer",
          salary: 75000,
          equity: "0",
          company_handle: "c2",
        },
        {
          title: "Technician",
          salary: 40000,
          equity: "0",
          company_handle: "c2",
        }
      ]
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:title */

describe("GET /jobs/:title", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/farmer`);
    expect(resp.body).toEqual({
        "job": [{
          title: "Farmer",
          salary: 50000,
          equity: "0",
          company_handle: "c1",
        }]
      });
  });

  test("not found; no such company", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:handle", function () {
  test("works for authorized users", async function () {
    const resp = await request(app)
        .patch(`/jobs/Farmer`)
        .send({
          title: "former",
          salary: 100000
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        title: "former",
        salary: 100000,
        equity: "0",
        company_handle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/Farmer`)
        .send({
          title: "agronomist",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for u2", async function () {
    const resp = await request(app)
        .patch(`/jobs/Farmer`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found; no such company", async function () {
    const resp = await request(app)
        .patch(`/jobs/nope`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/Farmer`)
      .send({
        handle: "Farmer-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/Farmer`)
      .send({
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
      .delete(`/jobs/Farmer`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "Farmer" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/Farmer`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for u2", async function () {
    const resp = await request(app)
        .delete(`/jobs/Farmer`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});