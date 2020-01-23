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
  const binary = `java -cp "axis-1_4/lib/*:axis-1_4/build/classes" org.apache.axis.wsdl.Java2WSDL`;

  const options = [
    `-o ${getSnapshotPath({ id: "example6", filename: "wp.wsdl" })}`,
    `-l"http://localhost:8080/axis/services/WidgetPrice"`,
    `-n "urn:Example6"`,
    `-p"samples.userguide.example6"`,
    `"urn:Example6"`,
    `org.apache.axis.wsdl.Java2WSDL`
  ];
  const input = options.join(" ");
  const command = `${binary} ${input}`;

  await snapshot({ id: "example6", command });
}

async function snapshot({ id, command }) {
  const { stdout, stderr } = await exec(command);

  try {
    await fs.mkdir(getSnapshotPath({ id }));
  } catch {
    // ignore existing dirs
  }
  await fs.writeFile(
    getSnapshotPath({ id, filename: "out.json" }),
    JSON.stringify({ stdout, stderr }, null, 2)
  );
}

function getSnapshotPath({ id, filename = "" }) {
  return path.resolve("./__snapshots__", id, filename);
}
