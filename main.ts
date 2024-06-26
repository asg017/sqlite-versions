import * as core from "@actions/core";
import * as cache from "@actions/cache";
import * as process from "node:process";
import { spawnSync } from "node:child_process";
import fetch from "node-fetch";
import AdmZip from "adm-zip";
import * as path from "node:path";
import { mkdirSync } from "node:fs";
import { maxSatisfying } from "semver";
import * as os from "node:os";

function exportEnvPrepend(name: string, value: string) {
  core.exportVariable(
    name,
    process.env[name] ? `${value}:${process.env[name]}` : value
  );
}

/*

https://www.sqlite.org/changes.html

```
(() => {
    const data = Array.from(document.querySelectorAll('h3'))
        .map(e=>({date: e.innerText.slice(0, 'YYYY-MM-DD'.length), version: e.innerText.slice(e.innerText.indexOf('(')+1, e.innerText.indexOf(')'))}))
        .filter(d => d.version[0] === '3');
    copy(JSON.stringify(Object.fromEntries(data.map(d=>[d.version, d.date]))));
})();
```
*/
// prettier-ignore
const versionYears: {[key:string]:string} = {"3.46.0":"2024-05-23","3.45.3":"2024-04-15","3.45.2":"2024-03-12","3.45.1":"2024-01-30","3.45.0":"2024-01-15","3.44.2":"2023-11-24","3.44.1":"2023-11-22","3.44.0":"2023-11-01","3.43.2":"2023-10-10","3.43.1":"2023-09-11","3.43.0":"2023-08-24","3.42.0":"2023-05-16","3.41.2":"2023-03-22","3.41.1":"2023-03-10","3.41.0":"2023-02-21","3.40.1":"2022-12-28","3.40.0":"2022-11-16","3.39.4":"2022-09-29","3.39.3":"2022-09-05","3.39.2":"2022-07-21","3.39.1":"2022-07-13","3.39.0":"2022-06-25","3.38.5":"2022-05-06","3.38.4":"2022-05-04","3.38.3":"2022-04-27","3.38.2":"2022-03-26","3.38.1":"2022-03-12","3.38.0":"2022-02-22","3.37.2":"2022-01-06","3.37.1":"2021-12-30","3.37.0":"2021-11-27","3.36.0":"2021-06-18","3.35.5":"2021-04-19","3.35.4":"2021-04-02","3.35.3":"2021-03-26","3.35.2":"2021-03-17","3.35.1":"2021-03-15","3.35.0":"2021-03-12","3.34.1":"2021-01-20","3.34.0":"2020-12-01","3.33.0":"2020-08-14","3.32.3":"2020-06-18","3.32.2":"2020-06-04","3.32.1":"2020-05-25","3.32.0":"2020-05-22","3.31.1":"2020-01-27","3.31.0":"2020-01-22","3.30.1":"2019-10-10","3.30.0":"2019-10-04","3.29.0":"2019-07-10","3.28.0":"2019-04-16","3.27.2":"2019-02-25","3.27.1":"2019-02-08","3.27.0":"2019-02-07","3.26.0":"2018-12-01","3.25.3":"2018-11-05","3.25.2":"2018-09-25","3.25.1":"2018-09-18","3.25.0":"2018-09-15","3.24.0":"2018-06-04","3.23.1":"2018-04-10","3.23.0":"2018-04-02","3.22.0":"2018-01-22","3.21.0":"2017-10-24","3.20.1":"2017-08-24","3.20.0":"2017-08-01","3.18.2":"2017-06-17","3.18.1":"2017-06-16","3.19.3":"2017-06-08","3.19.2":"2017-05-25","3.19.1":"2017-05-24","3.19.0":"2017-05-22","3.18.0":"2017-03-30","3.17.0":"2017-02-13","3.16.2":"2017-01-06","3.16.1":"2017-01-03","3.16.0":"2017-01-02","3.15.2":"2016-11-28","3.15.1":"2016-11-04","3.15.0":"2016-10-14","3.14.2":"2016-09-12","3.14.1":"2016-08-11","3.14":"2016-08-08","3.13.0":"2016-05-18","3.12.2":"2016-04-18","3.12.1":"2016-04-08","3.9.3":"2016-04-01","3.12.0":"2016-03-29","3.11.1":"2016-03-03","3.11.0":"2016-02-15","3.10.2":"2016-01-20","3.10.1":"2016-01-14","3.10.0":"2016-01-06","3.9.2":"2015-11-02","3.9.1":"2015-10-16","3.9.0":"2015-10-14","3.8.11.1":"2015-07-29","3.8.11":"2015-07-27","3.8.10.2":"2015-05-20","3.8.10.1":"2015-05-09","3.8.10":"2015-05-07","3.8.9":"2015-04-08","3.8.8.3":"2015-02-25","3.8.8.2":"2015-01-30","3.8.8.1":"2015-01-20","3.8.8":"2015-01-16","3.8.7.4":"2014-12-09","3.8.7.3":"2014-12-05","3.8.7.2":"2014-11-18","3.8.7.1":"2014-10-29","3.8.7":"2014-10-17","3.8.6":"2014-08-15","3.8.5":"2014-06-04","3.8.4.3":"2014-04-03","3.8.4.2":"2014-03-26","3.8.4.1":"2014-03-11","3.8.4":"2014-03-10","3.8.3.1":"2014-02-11","3.8.3":"2014-02-03","3.8.2":"2013-12-06","3.8.1":"2013-10-17","3.8.0.2":"2013-09-03","3.8.0.1":"2013-08-29","3.8.0":"2013-08-26","3.7.17":"2013-05-20","3.7.16.2":"2013-04-12","3.7.16.1":"2013-03-29","3.7.16":"2013-03-18","3.7.15.2":"2013-01-09","3.7.15.1":"2012-12-19","3.7.15":"2012-12-12","3.7.14.1":"2012-10-04","3.7.14":"2012-09-03","3.7.13":"2012-06-11","3.7.12.1":"2012-05-22","3.7.12":"2012-05-14","3.7.11":"2012-03-20","3.7.10":"2012-01-16","3.7.9":"2011-11-01","3.7.8":"2011-09-19","3.7.7.1":"2011-06-28","3.7.7":"2011-06-23","3.7.6.3":"2011-05-19","3.7.6.2":"2011-04-17","3.7.6.1":"2011-04-13","3.7.6":"2011-04-12","3.7.5":"2011-02-01","3.7.4":"2010-12-07","3.7.3":"2010-10-08","3.7.2":"2010-08-24","3.7.1":"2010-08-23","3.7.0.1":"2010-08-04","3.7.0":"2010-07-21","3.6.23.1":"2010-03-26","3.6.23":"2010-03-09","3.6.22":"2010-01-06","3.6.21":"2009-12-07","3.6.20":"2009-11-04","3.6.16.1":"2009-10-30","3.6.19":"2009-10-14","3.6.18":"2009-09-11","3.6.17":"2009-08-10","3.6.16":"2009-06-27","3.6.15":"2009-06-15","3.6.14.2":"2009-05-25","3.6.14.1":"2009-05-19","3.6.14":"2009-05-07","3.6.13":"2009-04-13","3.6.12":"2009-03-31","3.6.11":"2009-02-18","3.6.10":"2009-01-15","3.6.9":"2009-01-14","3.6.8":"2009-01-12","3.6.7":"2008-12-16","3.6.6.2":"2008-11-26","3.6.6.1":"2008-11-22","3.6.6":"2008-11-19","3.6.5":"2008-11-12","3.6.4":"2008-10-15","3.6.3":"2008-09-22","3.6.2":"2008-08-30","3.6.1":"2008-08-06","3.6.0 beta":"2008-07-16","3.5.9":"2008-05-14","3.5.8":"2008-04-16","3.5.7":"2008-03-17","3.5.6":"2008-02-06","3.5.5":"2008-01-31","3.5.4":"2007-12-14","3.5.3":"2007-11-27","3.5.2":"2007-11-05","3.5.1":"2007-10-04","3.5.0":"2007-09-04","3.4.2":"2007-08-13","3.4.1":"2007-07-20","3.4.0":"2007-06-18","3.3.17":"2007-04-25","3.3.16":"2007-04-18","3.3.15":"2007-04-09","3.3.14":"2007-04-02","3.3.13":"2007-02-13","3.3.12":"2007-01-27","3.3.11":"2007-01-22","3.3.10":"2007-01-09","3.3.9":"2007-01-04","3.3.8":"2006-10-09","3.3.7":"2006-08-12","3.3.6":"2006-06-06","3.3.5":"2006-04-05","3.3.4":"2006-02-11","3.3.3":"2006-01-31","3.3.2 beta":"2006-01-24","3.3.1 alpha":"2006-01-16","3.3.0 alpha":"2006-01-11","3.2.8":"2005-12-19","3.2.7":"2005-09-24","3.2.6":"2005-09-17","3.2.5":"2005-08-27","3.2.4":"2005-08-24","3.2.3":"2005-08-21","3.2.2":"2005-06-12","3.2.1":"2005-03-29","3.2.0":"2005-03-21","3.1.6":"2005-03-17","3.1.5":"2005-03-11","3.1.4":"2005-03-11","3.1.3":"2005-02-19","3.1.2":"2005-02-15","3.1.1 BETA":"2005-02-01","3.1.0 ALPHA":"2005-01-21","3.0.8":"2004-10-12","3.0.7":"2004-09-18","3.0.6 beta":"2004-09-02","3.0.5 beta":"2004-08-29","3.0.4 beta":"2004-08-09","3.0.3 beta":"2004-07-22","3.0.2 beta":"2004-06-30","3.0.1 alpha":"2004-06-22","3.0.0 alpha":"2004-06-18"};

async function downloadSqliteAmalgammation(
  versionSpec: string,
  targetDirectory: string
): Promise<string> {
  let version =
    Object.keys(versionYears).find((v) => v === versionSpec) ??
    maxSatisfying(Object.keys(versionYears), versionSpec);
  if (version === null)
    throw Error(`could not resolve a SQLite version for ${versionSpec}`);

  const [major, minor, patch] = version.split(".");
  const year = versionYears[version].slice(0, "YYYY".length);

  const filename = `sqlite-amalgamation-${major}${minor.padStart(
    2,
    "0"
  )}${patch.padStart(2, "0")}00`;

  if (
    cache.isFeatureAvailable() &&
    (await cache.restoreCache([targetDirectory], filename)) !== undefined
  ) {
  } else {
    const url = `https://www.sqlite.org/${year}/${filename}.zip`;

    core.info(`downloading amalgammation at ${url}`);

    const amalgammation = await fetch(url).then((response) => {
      if (response.status !== 200) {
        throw Error(`Error fetching SQLite amalgamation [${response.status}]`);
      }
      return response.arrayBuffer();
    });

    const zip = new AdmZip(Buffer.from(amalgammation));
    zip.extractAllTo(targetDirectory);

    if (cache.isFeatureAvailable())
      await cache.saveCache([targetDirectory], filename);
  }
  return path.join(targetDirectory, filename);
}

async function run(): Promise<void> {
  const VERSION = core.getInput("version", { required: true });
  const CFLAGS = core.getInput("cflags", { required: false });
  const skipActivateInput = core.getInput("skip-activate", {
    required: false,
  });
  const skipActivate = skipActivateInput.toLowerCase() == "true";

  let platform: "windows" | "macos" | "linux" =
    process.platform === "win32"
      ? "windows"
      : process.platform === "darwin"
      ? "macos"
      : "linux";

  const prefix = platform === "windows" ? "" : "lib";
  const suffix =
    platform === "windows" ? "dll" : platform === "macos" ? "dylib" : "so.0";
  const targetPath = `${prefix}sqlite3${
    platform === "macos" ? "" : ""
  }.${suffix}`;

  if (platform === "windows") {
    throw Error("Unsupported platform " + platform);
  }
  let targetDirectory = path.join(process.env.RUNNER_TEMP!, "sqlite-versions");
  mkdirSync(targetDirectory);
  let directory = await downloadSqliteAmalgammation(VERSION, targetDirectory);
  let cflag_args =
    CFLAGS === "" || CFLAGS.trim().length === 0
      ? []
      : CFLAGS.split(" ").filter((d) => d.length);

  const command = "gcc";
  const args = [
    "-fPIC",
    "-shared",
    ...cflag_args,
    path.join(directory, "sqlite3.c"),
    `-I${directory}`,
    "-o",
    targetPath,
  ];
  core.info(`Executing ${command} ${JSON.stringify(args)}`);
  const result = spawnSync(command, args);
  if (result.status !== 0) {
    throw Error(`Error compiling SQLite amalgamation: ${result.stderr}`);
  }

  core.exportVariable("sqlite-location", process.cwd());

  if (!skipActivate) {
    if (os.platform() === "darwin") {
      exportEnvPrepend("DYLD_LIBRARY_PATH", process.cwd());
    } else {
      exportEnvPrepend("LD_LIBRARY_PATH", process.cwd());
    }
  }
}

run();
