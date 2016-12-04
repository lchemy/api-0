import { FilterExpression, GroupExpression } from "@lchemy/api-filter-parser";
import { Orm, getOrm } from "@lchemy/orm";
import { JoinManyField } from "@lchemy/orm/core";
import { ComparableField, Field, LikeField, RangeField } from "@lchemy/orm/core/field";
import { AndFilterGroup, Filter, OrFilterGroup } from "@lchemy/orm/core/filter";
import * as Boom from "boom";

import { getOrmField } from "./get-orm-field";

export function apiToOrmFilter(ref: string | symbol | Orm, filter: FilterExpression): Promise<Filter> {
	return getOrm(ref).then((orm) => {
		return apiExpressionToOrmFilter(orm, filter);
	});
}

function apiExpressionToOrmFilter(orm: Orm, filter: FilterExpression): Promise<Filter> {
	if (isGroupExpression(filter)) {
		if (filter.grouping === "and" || filter.grouping === "or") {
			return Promise.all(filter.expressions.map((expression) => {
				return apiExpressionToOrmFilter(orm, expression);
			})).then((expressions) => {
				if (filter.grouping === "and") {
					return new AndFilterGroup(expressions);
				} else {
					return new OrFilterGroup(expressions);
				}
			});
		}
		return Promise.reject(Boom.badRequest(`Invalid filter expression.`));
	}

	return getFilterableOrmField(orm, filter.field).then((field) => {
		switch (filter.operator) {
			case "eq":
				if (!(field instanceof Field)) {
					break;
				}
				return expandFilterValue(orm, filter.value).then((value) => {
					return field.eq(value);
				});
			case "neq":
				if (!(field instanceof Field)) {
					break;
				}
				return expandFilterValue(orm, filter.value).then((value) => {
					return field.neq(value);
				});
			case "gt":
				if (!(field instanceof ComparableField)) {
					break;
				}
				return expandFilterValue(orm, filter.value).then((value) => {
					return field.gt(value);
				});
			case "gte":
				if (!(field instanceof ComparableField)) {
					break;
				}
				return expandFilterValue(orm, filter.value).then((value) => {
					return field.gte(value);
				});
			case "lt":
				if (!(field instanceof ComparableField)) {
					break;
				}
				return expandFilterValue(orm, filter.value).then((value) => {
					return field.lt(value);
				});
			case "lte":
				if (!(field instanceof ComparableField)) {
					break;
				}
				return expandFilterValue(orm, filter.value).then((value) => {
					return field.lte(value);
				});
			case "like":
				if (!(field instanceof LikeField)) {
					break;
				}
				return expandFilterValue(orm, filter.value).then((value) => {
					return field.like(value);
				});
			case "not like":
				if (!(field instanceof LikeField)) {
					break;
				}
				return expandFilterValue(orm, filter.value).then((value) => {
					return field.notLike(value);
				});
			case "in":
				if (!(field instanceof RangeField)) {
					break;
				}
				return expandFilterValues(orm, filter.value).then((values) => {
					return field.in(...values);
				});
			case "not in":
				if (!(field instanceof RangeField)) {
					break;
				}
				return expandFilterValues(orm, filter.value).then((values) => {
					return field.notIn(...values);
				});
			case "between":
				if (!(field instanceof RangeField)) {
					break;
				}
				return expandFilterValues(orm, filter.value).then((values) => {
					return field.between(values[0], values[1]);
				});
			case "not between":
				if (!(field instanceof RangeField)) {
					break;
				}
				return expandFilterValues(orm, filter.value).then((values) => {
					return field.notBetween(values[0], values[1]);
				});
			case "is null":
				if (!(field instanceof Field)) {
					break;
				}
				return field.isNull();
			case "is not null":
				if (!(field instanceof Field)) {
					break;
				}
				return field.isNotNull();
			case "exists":
				if (!(field instanceof JoinManyField)) {
					break;
				}
				return expandJoinFilterValue(field.orm, filter.value).then((value) => {
					return field.exists(value ? () => value : undefined);
				});
			case "not exists":
				if (!(field instanceof JoinManyField)) {
					break;
				}
				return expandJoinFilterValue(field.orm, filter.value).then((value) => {
					return field.notExists(value ? () => value : undefined);
				});
			default:
				break;
		}
		return Promise.reject<Filter>(Boom.badRequest(`Invalid filter expression.`));
	});
}

type FilterableOrmField = Field<Orm, any> | JoinManyField<Orm, Orm>;
function getFilterableOrmField(orm: Orm, fieldStr: string): Promise<FilterableOrmField> {
	return getOrmField(orm, fieldStr).then((field) => {
		if (!(field instanceof Field || field instanceof JoinManyField)) {
			return Promise.reject(Boom.badRequest(`Invalid filter field: ${ fieldStr }`));
		}
		return field;
	});
}

// TODO: support booleans, dates, etc.
function expandFilterValue(orm: Orm, value: number | string): Promise<number | string | FilterableOrmField> {
	if (typeof value === "number") {
		return Promise.resolve(value);
	}
	if (value[0] === value[value.length - 1] && value[0] === '"') {
		return Promise.resolve(value.substr(1, value.length - 2));
	}
	return getFilterableOrmField(orm, value);
}

function expandFilterValues(orm: Orm, values: Array<number | string>): Promise<Array<number | string | Field<Orm, any>>> {
	return Promise.all(values.map((value) => {
		return expandFilterValue(orm, value);
	}));
}

// TODO: add fromOrm and toOrm concepts here
function expandJoinFilterValue(orm: Orm, filter: FilterExpression | undefined): Promise<Filter | undefined> {
	if (filter == null) {
		return Promise.resolve(undefined);
	}
	return apiExpressionToOrmFilter(orm, filter);
}

function isGroupExpression(test: FilterExpression): test is GroupExpression {
	return "grouping" in test && "expressions" in test;
}
