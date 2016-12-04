import { Parser } from "@lchemy/api-filter-parser";
import { Orm } from "@lchemy/orm";
import { Filter } from "@lchemy/orm/core";
import * as Boom from "boom";

import { apiToOrmFilter } from "./api-to-orm-filter";

const parser: Parser = new Parser();

export function parseFilter(orm: Orm, filterString?: string): Promise<Filter | undefined> {
	if (filterString == null) {
		return Promise.resolve(undefined);
	}

	try {
		return apiToOrmFilter(orm, parser.parse(filterString));
	} catch (e) {
		return Promise.reject(Boom.badRequest(`Invalid filter expression: ${ filterString }`));
	}
}
