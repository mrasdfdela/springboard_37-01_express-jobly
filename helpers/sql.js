const { BadRequestError } = require("../expressError");

/* Supports creating SQL/pg query statements by accepting data and manualy entered column names as parameters. Used to update companies and users tables.
- dataToUpdate parameter specifies data to be updated (via reqest body)as a set of key/value pairs
- jsToSql parameter is used to match SQL column names where they are formatted differently than their corresponding objects 
- returns setCols (a string w/ column names for the SQL query) and values (an array of data values corresponding to the columns)
See also: instance functions Company.update(handle, data) and User.update(username, data) */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/* Supports querying companies via the Company.findAll() instance method.Takes in query parameters from the request and translates it into a string to insert into a SQL WHERE clause. Note that if no valid query parameters are passed in, an empty string will be returned.*/

function sqlWhereFromQuery(query){
  let queryArr = [];
  if (query) {
    for ( const [k,v] of Object.entries(query) ) {
      if (k === 'name') {
        queryArr.push(`UPPER(${k}) LIKE UPPER('%${v}%')`);
      } else if (k === 'minEmployees') {
        queryArr.push(`num_employees >= ${v}`);
      } else if (k === 'maxEmployees') {
        queryArr.push(`num_employees <= ${v}`);
      }
    }
  }
  if (queryArr.length > 0) {
    const queryString = ` WHERE ${queryArr.join(' AND ')}`
    return queryString;
  }
  return ''
}

module.exports = { sqlForPartialUpdate, sqlWhereFromQuery };