import { Orm } from "@lchemy/orm";
import { Field, SortDirection } from "@lchemy/orm/core";
import { RawFindSortField } from "@lchemy/orm/queries/find";
import * as Boom from "boom";

import { getOrmField } from "./get-orm-field";

export function parseSorts(orm: Orm, sortsStr?: string): Promise<RawFindSortField[] | undefined> {
	if (sortsStr == null) {
		return Promise.resolve(undefined);
	}

	return Promise.all(sortsStr.split(",").map((section) => {
		let [fieldStr, directionStr]: Array<string | undefined> = section.split(/\s+/, 2),
			direction: SortDirection = parseDirection(directionStr);
		return getOrmField(orm, fieldStr).then<RawFindSortField>((field) => {
			if (!(field instanceof Field)) {
				return Promise.reject(Boom.badRequest(`Invalid sort field: ${ fieldStr }`));
			}
			return {
				field,
				direction
			};
		});
	}));
}

function parseDirection(directionStr?: string): SortDirection {
	switch (directionStr) {
		case "0":
		case "-1":
		case "-":
		case "d":
		case "desc":
			return SortDirection.DESCENDING;
		default:
			return SortDirection.ASCENDING;
	}
}
