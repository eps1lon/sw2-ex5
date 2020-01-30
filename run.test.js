const child_process = require("child_process");
const fs = require("fs").promises;
const lodash = require("lodash");
const path = require("path");
const rimraf = require("rimraf");
const { promisify } = require("util");
const xmlParser = require("fast-xml-parser");

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
      files: []
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
      files: []
    }
  ],
  [
    "ex6-widgetPrice",
    {
      options: [
        `-o tmp/ex6-widgetPrice.wsdl`,
        `-p"samples.userguide.example6"`,
        `-l"http://localhost:8080/axis/services/WidgetPrice"`,
        `-n "urn:Example6"`,
        `samples.userguide.example6.WidgetPrice`
      ],
      files: ["tmp/ex6-widgetPrice.wsdl"]
    }
  ],
  [
    "ex5-BeanService",
    {
      options: [
        `-o tmp/ex5-beanservice.wsdl`,
        `-p"samples.userguide.example5"`,
        `-l"http://localhost:8080/axis/services/ex5"`,
        `-n "urn:Example5"`,
        `samples.userguide.example5.BeanService`
      ],
      files: ["tmp/ex5-beanservice.wsdl"]
    }
  ]
];

beforeEach(async () => {
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

  expect(error).toMatchSnapshot("actual error");
  expect(stdout).toMatchSnapshot("stdout");
  expect(stderr).toMatchSnapshot("stderr");
  for (const expectedFile of files) {
    const actualFileName = useModified
      ? getModifiedFileName(expectedFile)
      : expectedFile;
    const xml = await fs.readFile(actualFileName, { encoding: "utf8" });
    const wsdl = xmlParser.parse(xml, { ignoreAttributes: false });
    const stableWsdl = deepSortStable(wsdl);

    expect(stableWsdl).toMatchSnapshot(`file ${expectedFile}`);
  }
});

/**
 * sorts objects by their keys
 * sorts arrays by their JSON.stringified value
 * all deep
 */
function deepSortStable(obj) {
  if (Array.isArray(obj)) {
    return obj
      .map(deepSortStable)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([key, value]) => {
          return [key, deepSortStable(value)];
        })
        .sort(([a], [b]) => {
          return a.localeCompare(b);
        })
    );
  }
  return obj;
}
