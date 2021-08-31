"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlJobGetQuery } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT title, company_handle
           FROM jobs
           WHERE title = $1 AND company_handle = $2`,
      [title, companyHandle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title} at ${companyHandle}`);

    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );

    const job = result.rows[0];

    return job;
  }

  /** Given a job title, minimum salary, and/or equity, return jobs that have matching positions.
   *
   * Returns [{ title, salary, equity, company_handle }, ...]
   * Throws NotFoundError if not found.
   **/

  static async get(query) {
    let queryString = `SELECT title, salary, equity, company_handle
                      FROM jobs`;
    queryString = queryString + sqlJobGetQuery(query);
    queryString = queryString + " ORDER BY id";
    const jobsRes = await db.query(queryString);

    if (!jobsRes.rows[0]) {
      throw new NotFoundError(`Invalid search parameters!`);
    }
    return jobsRes.rows;

  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const titleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE title = ${titleVarIdx} 
                      RETURNING title, salary, equity, company_handle`;
    const result = await db.query(querySql, [...values, title]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(title) {
    const result = await db.query(
      `DELETE
      FROM jobs
      WHERE title = $1
      RETURNING title`,
      [title]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);
  }
}


module.exports = Job;
