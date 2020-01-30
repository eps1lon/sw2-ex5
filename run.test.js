const child_process = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const rimraf = require("rimraf");
const { promisify } = require("util");

const exec = promisify(child_process.exec);

const useModified = false;
/**
 * modified outputs as _impl.wsdl
 * function removes this suffix in order to diff the files
 */
function getModifiedFileName(filename) {
  const basename = path.basename(filename, ".wsdl");
  const expectedBasename = `${basename}_impl`;

  return path.join(path.dirname(filename), `${expectedBasename}.wsdl`);
}

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
  ],
  [
    "widgetPriceOtherFile",
    {
      options: [
        `-o tmp/wp-other.wsdl`,
        `-l"http://localhost:8080/axis/services/WidgetPrice"`,
        `-n "urn:Example6"`,
        `-p"samples.userguide.example"`,
        `"urn:Example6"`,
        `org.apache.axis.wsdl.Java2WSDL`
      ],
      files: ["tmp/wp-other.wsdl"]
    }
  ],
  ["usage", { options: [], files: [] }],
  ["help", { options: ["--help"], files: [] }],
  [
    "widgetPriceStyleDOCUMENT",
    {
      options: [
        `-o tmp/wp-other.wsdl`,
        `-l"http://localhost:8080/axis/services/WidgetPrice"`,
        `-n "urn:Example6"`,
        `-p"samples.userguide.example"`,
        `--style DOCUMENT`,
        `"urn:Example6"`,
        `org.apache.axis.wsdl.Java2WSDL`
      ],
      files: ["tmp/wp-other.wsdl"]
    }
  ],
  [
    "widgetPriceStyleWSDL",
    {
      options: [
        `-o tmp/wp-other.wsdl`,
        `-l"http://localhost:8080/axis/services/WidgetPrice"`,
        `-n "urn:Example6"`,
        `-p"samples.userguide.example"`,
        `--style RPC`,
        `"urn:Example6"`,
        `org.apache.axis.wsdl.Java2WSDL`
      ],
      files: ["tmp/wp-other.wsdl"]
    }
  ]
];

beforeAll(async () => {
  rimraf.sync("tmp");
  await fs.mkdir("tmp");
});

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
  for (const expectedFile of files) {
    const actualFileName = useModified
      ? getModifiedFileName(expectedFile)
      : expectedFile;
    const xml = await fs.readFile(actualFileName, { encoding: "utf8" });

    const withoutComments = xml.replace(/<!--[\s\S\n]*?-->/gm, "");
    expect(withoutComments).toMatchSnapshot();
  }
});
