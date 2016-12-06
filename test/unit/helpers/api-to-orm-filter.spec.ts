import { Parser } from "@lchemy/api-filter-parser";
import { define, field, join } from "@lchemy/orm";
import { FilterGroup, JoinManyFilterNode, OpFilterNode } from "@lchemy/orm/core";
import { expect } from "chai";

import { apiToOrmFilter } from "../../../src/helpers/api-to-orm-filter";

describe("api to orm filter helper", () => {
	const parser: Parser = new Parser();

	// TODO: move this to fixtures
	let ref: symbol;
	interface TestOrm {
		id: field.primary.Numerical;
		fields: {
			binary: field.Binary;
			boolean: field.Boolean;
			date: field.Date;
			enum: field.Enum<any>;
			numerical: field.Numerical;
			string: field.String;
		};
		joinOne: join.One<TestOrm>;
		joinMany: join.Many<TestOrm>;
	}

	beforeEach(() => {
		// TODO: move this to fixtures
		ref = Symbol();

		return define<TestOrm>({
			ref,
			table: "test"
		}, (field, join) => {
			return {
				id: field.primary.Numerical("id"),
				fields: {
					binary: field.Binary("binary"),
					boolean: field.Boolean("boolean"),
					date: field.Date("date"),
					enum: field.Enum("enum"),
					numerical: field.Numerical("numerical"),
					string: field.String("string")
				},
				joinOne: join.One<TestOrm>(ref, false).on((o1, o2) => o1.id.eq(o2.id)),
				joinMany: join.Many<TestOrm>(ref, false).on((o1, o2) => o1.id.eq(o2.id))
			};
		});
	});

	it("should parse simple filters", () => {
		return Promise.all([
			apiToOrmFilter(ref, parser.parse("id eq 1")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id eq 1");
			}),
			apiToOrmFilter(ref, parser.parse("id neq 1")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id neq 1");
			}),
			apiToOrmFilter(ref, parser.parse("id gt 1")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id gt 1");
			}),
			apiToOrmFilter(ref, parser.parse("id gte 1")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id gte 1");
			}),
			apiToOrmFilter(ref, parser.parse("id lt 1")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id lt 1");
			}),
			apiToOrmFilter(ref, parser.parse("id lte 1")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id lte 1");
			}),
			apiToOrmFilter(ref, parser.parse("fields.string like \"test\"")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("fields.string like \"test\"");
			}),
			apiToOrmFilter(ref, parser.parse("fields.string not like \"test\"")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("fields.string not like \"test\"");
			}),
			apiToOrmFilter(ref, parser.parse("id in 1,2,3")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id in 1, 2, 3");
			}),
			apiToOrmFilter(ref, parser.parse("id not in 1,2,3")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id not in 1, 2, 3");
			}),
			apiToOrmFilter(ref, parser.parse("id between 1,3")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id between 1, 3");
			}),
			apiToOrmFilter(ref, parser.parse("id not between 1,3")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id not between 1, 3");
			}),
			apiToOrmFilter(ref, parser.parse("id is null")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id is null");
			}),
			apiToOrmFilter(ref, parser.parse("id is not null")).then((filter) => {
				expect(filter).to.be.instanceof(OpFilterNode);
				expect(filter.toString()).to.eq("id is not null");
			}),
			apiToOrmFilter(ref, parser.parse("joinMany exists")).then((filter) => {
				expect(filter).to.be.instanceof(JoinManyFilterNode);
				expect(filter.toString()).to.eq("joinMany exists");
			}),
			apiToOrmFilter(ref, parser.parse("joinMany not exists")).then((filter) => {
				expect(filter).to.be.instanceof(JoinManyFilterNode);
				expect(filter.toString()).to.eq("joinMany not exists");
			}),
			// apiToOrmFilter(ref, parser.parse("joinMany exists (id eq 1)")).then((filter) => {
			// 	expect(filter).to.be.instanceof(JoinManyFilterNode);
			// 	expect(filter.toString()).to.eq("joinMany exists (id eq 1)");
			// }),
			// apiToOrmFilter(ref, parser.parse("joinMany not exists (id eq 2)")).then((filter) => {
			// 	expect(filter).to.be.instanceof(JoinManyFilterNode);
			// 	expect(filter.toString()).to.eq("joinMany not exists (id eq 2)");
			// }),
			apiToOrmFilter(ref, parser.parse("id eq 1 and id eq 2")).then((filter) => {
				expect(filter).to.be.instanceof(FilterGroup);
				expect(filter.toString()).to.eq("(id eq 1 and id eq 2)");
			}),
			apiToOrmFilter(ref, parser.parse("id eq 1 or id eq 2")).then((filter) => {
				expect(filter).to.be.instanceof(FilterGroup);
				expect(filter.toString()).to.eq("(id eq 1 or id eq 2)");
			})
		]);
	});
});
