#!/usr/bin/env node
const child_process = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");

const exec = promisify(child_process.exec);

main().catch(error => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const binary = `java -cp "axis-1_4/lib/*:axis-1_4/samples/userguide/example1/*" org.apache.axis.wsdl.Java2WSDL`;

  const options = [
    `-o wp.wsdl`,
    `-l"http://localhost:8080/axis/services/WidgetPrice"`,
    `-n "urn:Example6"`,
    `-p"samples.userguide.example6"`,
    `"urn:Example6"`,
    `org.apache.axis.wsdl.Java2WSDL`
  ];
  const input = options.join(" ");
  const command = `${binary} ${input}`;

  await snapshot({ id: "self", command });
}

async function snapshot({ id, command }) {
  const snapshotsDir = path.resolve("./__snapshots__");
  const snapshotFile = path.join(snapshotsDir, `${id}.snapshot`);

  const { stdout, stderr } = await exec(command);
  await fs.writeFile(snapshotFile, JSON.stringify({ stdout, stderr }, null, 2));
}
