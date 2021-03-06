import { newTestPage, click } from "../../test-utils";
import { expect } from "chai";
import { clickNestedText, getText } from "pentf/browser_utils";

export const description = "Show custom debug value";

export async function run(config: any) {
	const { page, devtools } = await newTestPage(config, "hooks", {
		preact: "hook",
	});

	const hooksPanel = '[data-testid="props-row"]';

	// State update
	await clickNestedText(devtools, "DebugValue");
	await devtools.waitForSelector(hooksPanel);

	const name = await getText(devtools, '[data-testid="prop-name"]');
	let value = await getText(devtools, '[data-testid="prop-value"]');

	expect(name).to.equal("useMyHook");
	expect(value).to.equal('"Offline"');

	await click(page, '[data-testid="debug-hook-toggle"]');

	value = await getText(devtools, '[data-testid="prop-value"]');
	expect(value).to.equal('"Online"');
}
