import { Orm } from "@lchemy/orm";
import { CompositeField, Field, JoinManyField } from "@lchemy/orm/core";
import * as Boom from "boom";

export type OrmField = Field<Orm, any> | Orm | CompositeField | JoinManyField<Orm, Orm>;
type OrmFieldMap = Map<string, OrmField>;

const FIELD_CACHE: Map<Orm, OrmFieldMap> = new Map();

export function getOrmField(orm: Orm, fieldStr: string): Promise<OrmField> {
	let ormCache: OrmFieldMap | undefined = FIELD_CACHE.get(orm);
	if (ormCache != null && ormCache.has(fieldStr)) {
		return Promise.resolve(ormCache.get(fieldStr));
	}

	let path: string[] = fieldStr.split(".");
	let out: any | undefined = path.reduce<any>((piece, part) => {
		if (piece == null) {
			return undefined;
		}
		if (piece instanceof JoinManyField) {
			piece = piece.orm;
		}
		return piece[part];
	}, orm);

	if (out == null) {
		return Promise.reject(Boom.badRequest(`Invalid field '${ fieldStr }'`));
	}

	if (ormCache == null) {
		ormCache = new Map<string, OrmField>();
		FIELD_CACHE.set(orm, ormCache);
	}
	ormCache.set(fieldStr, out);

	return Promise.resolve(out);
}
