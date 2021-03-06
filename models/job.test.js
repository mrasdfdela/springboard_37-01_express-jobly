"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "newJob",
    salary: 30000,
    equity: 0,
    companyHandle: "c3"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      title: "newJob",
      salary: 30000,
      equity: "0",
      companyHandle: "c3",
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'newJob'`
    );
    expect(result.rows).toEqual([
      {
        title: "newJob",
        salary: 30000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works: no filter", async function () {
    let jobs = await Job.get();
    expect(jobs).toEqual([
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
      },
    ]);
  });
    
  test("works: filter by job title", async function () {
    let query = { title: "engineer" };
    let jobs = await Job.get(query);
    expect(jobs).toEqual([
      {
        title: "Engineer",
        salary: 75000,
        equity: "0",
        company_handle: "c2",
      }
    ]);
  });

  test("works: filter by salary minimum", async function () {
    let query = { minSalary: 50000 };
    let jobs = await Job.get(query);
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: filter by equity", async function () {
    const newJob = {
      title: "entrepreneur",
      salary: 2000000,
      equity: .5,
      companyHandle: "c3",
    };
    await Job.create(newJob);
    let query = { hasEquity: true };
    let jobs = await Job.get(query);
    expect(jobs).toEqual([
      {
        title: "entrepreneur",
        salary: 2000000,
        equity: "0.5",
        company_handle: "c3",
      },
    ]);
  });

  test("works: filter by equity", async function () {
    let query = { hasEquity: false };
    let jobs = await Job.get(query);
    expect(jobs).toEqual([
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
      },
    ]);
  });

  test("does not work: non-existant parameters", async function () {
    try {
      let query = { title: "Chef" };
      await Job.get(query);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
      salary: 42500,
      equity: "0",
      company_handle: "c2",
  };

  test("works", async function () {
    let job = await Job.update("Technician", updateData);
    expect(job).toEqual({
      title: "Technician",
      ...updateData,
    });

  const result = await db.query(
        `SELECT title, salary, equity, company_handle
          FROM jobs
          WHERE company_handle = 'c2'`);

    expect(result.rows).toEqual([
      {
        title: "Engineer",
        salary: 75000,
        equity: "0",
        company_handle: "c2",
      },
      {
        title: "Technician",
        salary: 42500,
        equity: "0",
        company_handle: "c2",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      salary: null,
      equity: null,
      company_handle: "c3",
    };

    let job = await Job.update("Engineer", updateDataSetNulls);
    expect(job).toEqual({
      title: "Engineer",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'Engineer'`
    );
    expect(result.rows).toEqual([
      {
        title: "Engineer",
        salary: null,
        equity: null,
        company_handle: "c3",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("Farmer", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("Technician");
    const res = await db.query(
        "SELECT title FROM jobs WHERE title='Technician'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
