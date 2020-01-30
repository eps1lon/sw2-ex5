const child_process = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");

const exec = promisify(child_process.exec);

const tests = [
  [
    "widgetPrice",
    {
      options: [
        `-o tmp/wp.wsdl`,
        `-l"http://localhost:8080/axis/services/WidgetPrice"`,
        `-n "urn:Example6"`,
        `-p"samples.userguide.example"`,
        `"urn:Example6"`,
        `org.apache.axis.wsdl.Java2WSDL`
      ],
      files: ["tmp/wp.wsdl"]
    }
  ]
];

it.each(tests)("%s matches", async (id, { options, files }) => {
  const binary = `java -cp "axis-1_4/lib/*:axis-1_4/build/classes" org.apache.axis.wsdl.Java2WSDL`;

  const input = options.join(" ");
  const command = `${binary} ${input}`;

  let stdout;
  let stderr;
  let error;
  try {
    ({ stdout, stderr } = await exec(command));
  } catch (caughtError) {
    error = caughtError;
  }

  expect(stdout).toMatchSnapshot();
  expect(stderr).toMatchSnapshot();
  for (const filename of files) {
    await expect(
      fs.readFile(filename, { encoding: "utf8" })
    ).resolves.toMatchSnapshot();
  }
});
