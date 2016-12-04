import { Orm } from "@lchemy/orm";
import { CompositeField, Field, JoinManyField } from "@lchemy/orm/core";

import { getOrmField } from "./get-orm-field";

export function parseFields(orm: Orm, fieldsStr?: string): Promise<Array<Field<Orm, any> | Orm | CompositeField | JoinManyField<Orm, Orm>> | undefined> {
	if (fieldsStr == null) {
		return Promise.resolve(undefined);
	}

	return Promise.all(fieldsStr.split(",").map((fieldStr) => {
		return getOrmField(orm, fieldStr);
	}));
}
