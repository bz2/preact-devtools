import { expect } from "chai";
import { patchTree } from "./patchTree";
import { flames } from "../testHelpers";
import { cloneTree } from "./util";
import { Tree, DevNode } from "../../../../store/types";
import * as patch1 from "./fixtures/patch1";
import * as patch2 from "./fixtures/patch2";
import * as patch3 from "./fixtures/patch3";
import * as patch4 from "./fixtures/patch4";
import * as patch5 from "./fixtures/patch5";

export function toTimings(tree: Tree) {
	return Array.from(tree.values())
		.map(x => ({
			id: x.id,
			name: x.name,
			children: x.children,
			treeStartTime: x.treeStartTime,
			treeEndTime: x.treeEndTime,
		}))
		.sort((a, b) => a.id - b.id);
}

export function prepareFixture(fixture: {
	previous: DevNode[];
	next: DevNode[];
	expected: ReturnType<typeof toTimings>;
}) {
	const { previous, next, expected } = fixture;
	return {
		previous: new Map(previous.map(node => [node.id, node])),
		previousRoot: previous.length ? previous[0].id : -42,
		next: new Map(next.map(node => [node.id, node])),
		nextRoot: next[0].id,
		expected,
	};
}

describe.only("patchTree", () => {
	it("should return old tree when new one is empty", () => {
		const old = new Map();
		const res = patchTree(old, new Map(), 1, "expand");
		expect(res).to.equal(old);
	});

	it("should offset timings if tree is new", () => {
		const state = flames`
			App *******
				Bar **
		`;

		state.nodes.forEach(x => {
			x.startTime += 200;
			x.treeStartTime += 200;
			x.treeEndTime += 200;
		});

		const res = patchTree(new Map(), state.idMap, 1, "expand");
		expect(res.get(1)!.treeStartTime).to.equal(0);
		expect(res.get(1)!.treeEndTime < 200).to.equal(true);

		expect(res.get(2)!.treeStartTime < 200).to.equal(true);
		expect(res.get(2)!.treeEndTime < 200).to.equal(true);
	});

	it("should merge trees at root", () => {
		const a = flames`
			App ******
		`;

		const b = flames`
			App *****
			 Bar ***
		`;

		const merged = patchTree(a.idMap, b.idMap, 1, "expand");

		const app = merged.get(1)!;
		const bar = merged.get(2)!;

		expect(app.children).to.deep.equal([2]);
		expect(app.startTime < bar.startTime).to.equal(true);
		expect(app.endTime > bar.endTime).to.equal(true);
	});

	it("should merge sub-trees", () => {
		const a = flames`
			App ******
			  Bar **
		`;

		const b = flames`
			App *****
			 Bar ***
			 	Bob *
		`;

		const merged = patchTree(a.idMap, b.idMap, 1, "expand");

		const bar = merged.get(2)!;
		const bob = merged.get(3)!;

		expect(bar.children).to.deep.equal([3]);
		expect(bar.startTime < bob.startTime).to.equal(true);
		expect(bar.endTime > bob.endTime).to.equal(true);
	});

	it("should merge positive offset tree", () => {
		const a = flames`
			App ******
		`;

		const b = flames`
			App *****
			 Bar ***
			  Bob *
		`;

		b.nodes.forEach(x => {
			x.startTime += 100;
			x.treeStartTime += 100;
			x.endTime += 100;
			x.treeEndTime += 100;
		});

		patchTree(a.idMap, b.idMap, 1, "expand");

		const app = b.byName("App")!;
		const bar = b.byName("Bar")!;
		const bob = b.byName("Bob")!;
		expect(app.startTime < bar.startTime).to.equal(true);
		expect(app.endTime > bar.endTime).to.equal(true);
		expect(bar.startTime < bob.startTime).to.equal(true);
		expect(bar.endTime > bob.endTime).to.equal(true);
	});

	it("should move siblings to the right", () => {
		const a = flames`
		App ***********
		  Bar **
	`;

		const b = flames`
		App ***********
		 Bob *  Bar **
	`;

		// Correct ids
		b.byName("App")!.children = [3, 2];
		b.byName("Bar")!.id = 2;
		b.byName("Bob")!.id = 3;

		const expected = toTimings(cloneTree(b.idMap));
		const actual = toTimings(patchTree(a.idMap, b.idMap, 1, "expand"));
		expect(actual).to.deep.equal(expected);
	});

	it("should move siblings to the right #2", () => {
		const a = flames`
		App ******
		  Bar **
	`;

		const b = flames`
		App *************
		 Bob ****  Bar **
	`;

		// Correct ids
		b.byName("App")!.children = [3, 2];
		b.byName("Bar")!.id = 2;
		b.byName("Bob")!.id = 3;

		const expected = toTimings(cloneTree(b.idMap));
		const actual = toTimings(patchTree(a.idMap, b.idMap, 1, "expand"));
		expect(actual).to.deep.equal(expected);
	});

	it("should enlarge parent", () => {
		const a = flames`
			App ****
			 Bar **
		`;

		const b = flames`
			App ******
			 Bar ****
		`;

		const expected = toTimings(cloneTree(b.idMap));
		b.idMap.delete(1);

		const actual = toTimings(patchTree(a.idMap, b.idMap, 2, "expand"));
		expect(actual).to.deep.equal(expected);
	});

	it("should patch fixture 1", () => {
		const { previous, next, nextRoot, expected } = prepareFixture(patch1);
		const res = patchTree(previous, next, nextRoot, "expand");
		expect(toTimings(res)).to.deep.equal(expected);
	});

	it("should patch fixture 2", () => {
		const { previous, next, nextRoot, expected } = prepareFixture(patch2);
		const res = patchTree(previous, next, nextRoot, "expand");
		expect(toTimings(res)).to.deep.equal(expected);
	});

	it("should mount new nodes fixture 3", () => {
		const { previous, next, nextRoot, expected } = prepareFixture(patch3);
		const res = patchTree(previous, next, nextRoot, "expand");
		expect(toTimings(res)).to.deep.equal(expected);
	});

	it("should mount new nodes fixture 4", () => {
		const { previous, next, nextRoot, expected } = prepareFixture(patch4);
		const res = patchTree(previous, next, nextRoot, "expand");
		expect(toTimings(res)).to.deep.equal(expected);
	});

	it.only("should mount new nodes fixture 5", () => {
		const { previous, next, nextRoot, expected } = prepareFixture(patch5);
		const res = patchTree(previous, next, nextRoot, "expand");
		expect(toTimings(res)).to.deep.equal(expected);
	});
});
