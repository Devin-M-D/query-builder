var queryBuilder = {}
queryBuilder.new = () => {
  var query = ``
  var params = []
  return {
    query: () => { return query },
    params: () => { return params },
    insertQuery: (q) => { query += q },
    insertParam: (p) => { params.push(p) },
    insertParams: (...p) => { params = params.concat(p) },
    nullableValue: (p) => {
      return p != null ? "?" : "NULL"
      params.push(p)
    },
    nullableWhere: (tableName, paramName, paramVal) => {
      return paramVal != null ? `${tableName}.${paramName} = ?` : `${tableName}.${paramName} IS NULL`
      params.push(paramVal)
    },
    insertNonNullParams: (...p) => {
      for (var x = 0; x < p.length; x++){
        if (p[x] != null) params.push(p[x])
      }
    },
    run: async (expectOne = 0) => { return await queryBuilder.db.runQuery(query, params, expectOne) },
    printRunnable: () => {
      var tempQuery = query
      for (var x = 0; x < params.length; x++){
        tempQuery = tempQuery.replace('?', `'${params[x]}'`)
      }
      return tempQuery
    }
  }
}
queryBuilder.quickRun = async (quickQuery, quickParams = null, expectOne = 0) => {
  return await queryBuilder.db.runQuery(quickQuery, quickParams, expectOne)
}
queryBuilder.quickPrintRunnable = (quickQuery, quickParams = null) => {
  var tempQuery = quickQuery
  for (var x = 0; x < quickParams.length; x++){
    tempQuery = tempQuery.replace('?', `'${quickParams[x]}'`)
  }
  return tempQuery
}
function joinString(dir, leftTable, rightTable, leftField, rightField) {
  return `${dir} ${rightTable} ON ${leftTable}.${leftField} = ${rightTable}.${rightField}`
}
function buildJoin (dir) {
  if (!dir) { dir = "INNER JOIN" }
  if (dir == 1) { dir = "LEFT JOIN" }
  if (dir == 2) { dir = "RIGHT JOIN" }
  if (dir == 3) { dir = "OUTER JOIN" }
  return function (leftTable, rightTable) {
    return function (leftField, rightField) {
      leftField = leftField || `${rightTable}Id`
      rightField = rightField || `id`
      return joinString(dir, leftTable, rightTable, leftField, rightField)
    }
  }
}

queryBuilder.projections = (table, aliased) => {
  aliased = aliased == 0 ? aliased : 1
  var retVal = []
  retVal.push(`${table.tableName}.id AS ${aliased ? `${table.tableName}Id` : "id"}`)
  for (var field in table["fields"]){
    var alias = table["aliases"][field]
    field = table["fields"][field]
    retVal.push(`${table.tableName}.${field} AS ${aliased ? alias : field}`)
  }
  retVal = retVal.join(`, `)
  return retVal
}

queryBuilder.addSet = (alias) => {
  return {
    body: (queryBody) => {
      var retVal =
`CREATE TEMPORARY TABLE ${alias} (${queryBody});
SELECT * FROM ${alias};`
      return retVal
    }
  }
}
queryBuilder.join = (l, r, lf, rf) => { return buildJoin(0)(l, r)(lf, rf) },
queryBuilder.lJoin = (l, r, lf, rf) => { return buildJoin(1)(l, r)(lf, rf) },
queryBuilder.rJoin = (l, r, lf, rf) => { return buildJoin(2)(l, r)(lf, rf) },
queryBuilder.oJoin = (l, r, lf, rf) => { return buildJoin(3)(l, r)(lf, rf) },

queryBuilder.ifNull = (val, string) => { return val != null ? string : `` },
queryBuilder.nullableValue = (val) => { return val != null ? `?` : `NULL` }

module.exports = (db) => {
  queryBuilder.db = db
  return queryBuilder
}
