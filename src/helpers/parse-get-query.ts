import { Orm } from "@lchemy/orm";
import { Field, Filter } from "@lchemy/orm/core";
import { FindAllQuery, RawFindSortField } from "@lchemy/orm/queries/find";
import { IDictionary } from "hapi";

import { parseFields } from "./parse-fields";
import { parseFilter } from "./parse-filter";
import { parseSorts } from "./parse-sorts";

export function parseGetQuery(orm: Orm, query: IDictionary<string>): Promise<FindAllQuery> {
	return Promise.all([
		getFields(orm, query),
		getFilter(orm, query),
		getSorts(orm, query),
		getPagination(query)
	]).then(([fields, filter, sorts, pagination]) => {
		return { fields, filter, sorts, pagination };
	});
}

function getFields(orm: Orm, query: IDictionary<string>): Promise<Array<Field<Orm, any>> | undefined> {
	return parseFields(orm, query["fields"]);
}

function getFilter(orm: Orm, query: IDictionary<string>): Promise<Filter | undefined> {
	return parseFilter(orm, query["filter"]);
}

function getSorts(orm: Orm, query: IDictionary<string>): Promise<RawFindSortField[] | undefined> {
	return parseSorts(orm, query["sorts"]);
}

function getPagination(query: IDictionary<string>): { offset: number, limit: number } {
	let offset: number = query["offset"] != null ? Math.floor(Number(query["offset"])) : 0,
		limit: number = query["limit"] != null ? Math.floor(Number(query["limit"])) : 50;

	if (offset < 0) {
		offset = 0;
	}
	if (limit < 1) {
		limit = 1;
	}
	if (limit > 100) {
		limit = 100;
	}

	return { offset, limit };
}
